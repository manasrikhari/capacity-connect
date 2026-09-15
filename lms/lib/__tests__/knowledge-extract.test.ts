import { describe, expect, it } from "vitest";
import {
  CHUNK_CHARS,
  chunkText,
  heuristicProposals,
  looksScanned,
  mergeProposals,
  normaliseName,
  type ExtractionResult,
} from "@/lib/knowledge-extract";
import {
  extractionResponseSchema,
  proposedNodeSchema,
} from "@/lib/validations/knowledge-extract";

const node = (over: Partial<Record<string, unknown>> = {}) => ({
  name: "Doppler Weather Radar",
  type: "INSTRUMENT" as const,
  category: "Radar & Telemetry",
  description: "A radar that measures the radial velocity of precipitation targets.",
  aliases: ["DWR"],
  equation: "",
  ...over,
});

describe("normaliseName", () => {
  it("folds case and collapses whitespace so near-duplicates collide", () => {
    expect(normaliseName("  Doppler   RADAR ")).toBe("doppler radar");
    expect(normaliseName("Doppler Radar")).toBe(normaliseName("doppler radar"));
  });
});

describe("chunkText", () => {
  it("keeps a short document as a single chunk", () => {
    expect(chunkText("Para one.\n\nPara two.")).toEqual(["Para one.\n\nPara two."]);
  });

  it("splits on paragraph boundaries rather than mid-sentence", () => {
    const para = `${"word ".repeat(1000).trim()}.`; // ~5000 chars
    const chunks = chunkText([para, para, para].join("\n\n"), 6000);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(6000);
    // No paragraph was cut in half: every chunk ends on the sentence stop.
    for (const c of chunks) expect(c.endsWith(".")).toBe(true);
  });

  it("hard-slices a single paragraph that exceeds the chunk size", () => {
    const chunks = chunkText("x".repeat(2500), 1000);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(1000);
  });

  it("never returns an empty chunk and returns nothing for blank input", () => {
    expect(chunkText("   \n\n  \n ")).toEqual([]);
    for (const c of chunkText("A.\n\n\n\nB.")) expect(c.trim().length).toBeGreaterThan(0);
  });

  it("respects the chunk ceiling", () => {
    const big = Array.from({ length: 40 }, () => "y".repeat(CHUNK_CHARS - 10)).join("\n\n");
    expect(chunkText(big).length).toBeLessThanOrEqual(5);
  });
});

describe("looksScanned", () => {
  it("flags a PDF whose text is far too short for its page count", () => {
    expect(looksScanned("", 10)).toBe(true);
    expect(looksScanned("a".repeat(150), 1)).toBe(true);
    expect(looksScanned("a".repeat(5000), 10)).toBe(false);
  });
});

describe("mergeProposals", () => {
  it("de-duplicates the same concept across chunks, case-insensitively", () => {
    const a: ExtractionResult = { nodes: [node()], relations: [] };
    const b: ExtractionResult = {
      nodes: [node({ name: "doppler weather radar", aliases: ["Doppler radar"] })],
      relations: [],
    };
    const merged = mergeProposals([a, b]);
    expect(merged.nodes).toHaveLength(1);
    expect(merged.nodes[0].name).toBe("Doppler Weather Radar"); // first casing wins
    expect(merged.nodes[0].aliases).toEqual(["DWR", "Doppler radar"]); // union
  });

  it("keeps the longest description, since a passing mention says less", () => {
    const short: ExtractionResult = { nodes: [node({ description: "A weather radar system." })], relations: [] };
    const long: ExtractionResult = {
      nodes: [node({ description: "A radar that measures radial velocity toward or away from the antenna." })],
      relations: [],
    };
    expect(mergeProposals([short, long]).nodes[0].description).toContain("radial velocity toward");
  });

  it("drops a relation whose endpoint matches no node", () => {
    const r: ExtractionResult = {
      nodes: [node()],
      relations: [
        { sourceName: "Doppler Weather Radar", targetName: "Nowhere Concept", relationType: "MEASURES", weight: 1 },
      ],
    };
    expect(mergeProposals([r]).relations).toHaveLength(0);
  });

  it("keeps a relation that links into a node already in the database", () => {
    const r: ExtractionResult = {
      nodes: [node()],
      relations: [
        { sourceName: "Doppler Weather Radar", targetName: "Radial Velocity", relationType: "MEASURES", weight: 1 },
      ],
    };
    expect(mergeProposals([r], ["Radial Velocity"]).relations).toHaveLength(1);
  });

  it("drops self-relations and de-duplicates by endpoints plus type", () => {
    const r: ExtractionResult = {
      nodes: [node(), node({ name: "Radial Velocity" })],
      relations: [
        { sourceName: "Doppler Weather Radar", targetName: "Doppler Weather Radar", relationType: "MEASURES", weight: 1 },
        { sourceName: "Doppler Weather Radar", targetName: "Radial Velocity", relationType: "MEASURES", weight: 1 },
        { sourceName: "doppler weather radar", targetName: "radial velocity", relationType: "MEASURES", weight: 4 },
      ],
    };
    const merged = mergeProposals([r]);
    expect(merged.relations).toHaveLength(1);
    expect(merged.relations[0].weight).toBe(4); // strongest wins
  });
});

describe("heuristicProposals", () => {
  it("builds a PART_OF chain from nested markdown headings", () => {
    const md = [
      "# Radar Meteorology",
      "The study of using radar to observe the atmosphere and precipitation.",
      "## Velocity De-aliasing",
      "Recovering true velocities that were folded beyond the Nyquist interval.",
    ].join("\n\n");
    const { nodes, relations } = heuristicProposals(md);
    expect(nodes.map((n) => n.name)).toEqual(["Radar Meteorology", "Velocity De-aliasing"]);
    expect(relations).toEqual([
      { sourceName: "Velocity De-aliasing", targetName: "Radar Meteorology", relationType: "PART_OF", weight: 1 },
    ]);
  });

  it("returns nothing for prose with no headings", () => {
    expect(heuristicProposals("Just some text with no structure at all.").nodes).toEqual([]);
  });

  it("skips a heading with no usable description under it", () => {
    expect(heuristicProposals("# Orphan\n\n## Also Orphan\n").nodes).toEqual([]);
  });
});

describe("schemas", () => {
  it("rejects a node type outside the taxonomy", () => {
    expect(proposedNodeSchema.safeParse(node({ type: "TECHNIQUE" })).success).toBe(false);
  });

  it("rejects a description longer than the prompt budget allows", () => {
    expect(proposedNodeSchema.safeParse(node({ description: "x".repeat(401) })).success).toBe(false);
  });

  it("coerces absent optional fields to empty strings rather than failing on null", () => {
    const parsed = proposedNodeSchema.parse({
      name: "Nyquist Velocity",
      type: "CONCEPT",
      description: "The maximum unambiguous velocity a pulsed radar can measure.",
      category: null,
      equation: null,
    });
    expect(parsed.category).toBe("");
    expect(parsed.aliases).toEqual([]);
  });

  it("accepts a well-formed chunk response", () => {
    const ok = extractionResponseSchema.safeParse({
      nodes: [node()],
      relations: [
        { sourceName: "Doppler Weather Radar", targetName: "Radial Velocity", relationType: "MEASURES" },
      ],
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.relations[0].weight).toBe(1); // default applied
  });
});
