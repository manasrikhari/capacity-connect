import { describe, expect, it } from "vitest";
import {
  extractQueryTerms,
  findSeedNodes,
  traverse,
  queryGraph,
  encodeCitations,
  splitCitations,
  type Citation,
  type SeedNode,
} from "@/lib/graphrag";
import { buildFixture } from "./fixtures/graph";

describe("extractQueryTerms", () => {
  it("keeps the 'doppler radar' bigram", () => {
    const terms = extractQueryTerms("doppler radar");
    expect(terms).toContain("doppler radar");
    // unigrams follow the bigram
    expect(terms).toContain("doppler");
    expect(terms).toContain("radar");
    expect(terms.indexOf("doppler radar")).toBeLessThan(terms.indexOf("doppler"));
  });

  it("keeps hyphenated and de-hyphenated variants", () => {
    const terms = extractQueryTerms("velocity de-aliasing");
    expect(terms).toContain("de-aliasing");
    expect(terms).toContain("dealiasing");
  });

  it("keeps protected acronyms verbatim", () => {
    const terms = extractQueryTerms("configure the WRF model");
    expect(terms).toContain("wrf");
  });

  it("drops stopwords like 'the'", () => {
    const terms = extractQueryTerms("the radar");
    expect(terms).not.toContain("the");
    expect(terms).toContain("radar");
  });
});

describe("findSeedNodes", () => {
  it("ranks 'Doppler Weather Radar' first for 'doppler radar'", () => {
    const { nodes } = buildFixture();
    const seeds = findSeedNodes(extractQueryTerms("doppler radar"), nodes);
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds[0].node.name).toBe("Doppler Weather Radar");
    expect(seeds[0].matchedTerms.length).toBeGreaterThan(0);
    expect(seeds[0].score).toBeGreaterThan(0);
  });

  it("returns at most topK seeds, all with score > 0", () => {
    const { nodes } = buildFixture();
    const seeds = findSeedNodes(extractQueryTerms("radar reflectivity"), nodes, 3);
    expect(seeds.length).toBeLessThanOrEqual(3);
    for (const s of seeds) expect(s.score).toBeGreaterThan(0);
  });
});

describe("traverse", () => {
  it("expands both directions from the Cyclone Tracking seed", () => {
    const { nodes, relations, nodesById } = buildFixture();
    const ct = nodes.find((n) => n.name === "Cyclone Tracking")!;
    const seeds: SeedNode[] = [
      { node: ct, score: 10, matchedTerms: ["cyclone tracking"] },
    ];

    const paths = traverse(seeds, relations, nodesById, { maxHops: 2 });
    const chains = paths.map((p) => p.nodes.map((n) => n.name));

    expect(chains).toContainEqual([
      "Cyclone Tracking",
      "Doppler Weather Radar",
      "WRF Model",
    ]);
    expect(chains).toContainEqual([
      "Cyclone Tracking",
      "Doppler Weather Radar",
      "Radial Velocity",
    ]);

    // capped
    expect(paths.length).toBeLessThanOrEqual(12);

    // no path revisits a node
    for (const p of paths) {
      const ids = p.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }

    // no two returned paths share the same sorted relation-id key
    const keys = paths.map((p) =>
      p.relations
        .map((r) => r.id)
        .sort()
        .join("|"),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("queryGraph", () => {
  it("grounds 'radar reflectivity Z-R relation' with a cited Z-R node", () => {
    const { nodes, relations } = buildFixture();
    const result = queryGraph("radar reflectivity Z-R relation", nodes, relations);

    const zr = result.citations.find((c) => c.nodeName === "Z-R Relationship");
    expect(zr).toBeDefined();
    expect(zr!.source).toBeTruthy();

    expect(result.contextText).toContain("[Doppler Weather Radar]");

    const nodeIds = result.citations.map((c) => c.nodeId);
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
  });
});

describe("citations codec", () => {
  it("round-trips through encode/split", () => {
    const citations: Citation[] = [
      {
        nodeId: "n8",
        nodeName: "Z-R Relationship",
        type: "CONCEPT",
        category: "Radar & Telemetry",
        source: "IMD DWR SOP §4",
      },
    ];
    const body = "Here is the answer.";
    const combined = body + encodeCitations(citations);
    const { text, citations: parsed } = splitCitations(combined);
    expect(text).toBe(body);
    expect(parsed).toEqual(citations);
  });

  it("tolerates a truncated citations tail", () => {
    const { text, citations } = splitCitations("answer body <citations>[{bad");
    expect(text).toBe("answer body");
    expect(citations).toEqual([]);
  });

  it("returns empty citations when no block is present", () => {
    const { text, citations } = splitCitations("just an answer  ");
    expect(text).toBe("just an answer");
    expect(citations).toEqual([]);
  });
});
