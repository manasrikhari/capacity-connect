import { describe, expect, it } from "vitest";
import { buildMinutesSystemPrompt, clampTranscript, extractiveMinutes } from "@/lib/minutes";

describe("clampTranscript", () => {
  it("returns short transcripts unchanged (trimmed)", () => {
    expect(clampTranscript("  hello world  ")).toBe("hello world");
  });
  it("trims the middle of an over-long transcript, keeping head and tail", () => {
    const long = "A".repeat(1000) + "B".repeat(1000);
    const out = clampTranscript(long, 400);
    expect(out).toContain("…[transcript trimmed]…");
    expect(out.startsWith("A")).toBe(true);
    expect(out.endsWith("B")).toBe(true);
    // head(240) + marker + tail(160) — well under the raw 2000 chars
    expect(out.length).toBeLessThan(500);
  });
});

describe("extractiveMinutes", () => {
  it("falls back gracefully on a too-short transcript", () => {
    expect(extractiveMinutes("hi")).toContain("too short");
  });
  it("produces a Markdown digest of the longest sentences, in source order", () => {
    const transcript = [
      "Today we cover the Doppler weather radar and how reflectivity maps to rainfall intensity.",
      "Ok.",
      "The nowcasting workflow ingests radar volume scans every ten minutes for short-range warnings.",
    ].join(" ");
    const out = extractiveMinutes(transcript);
    expect(out).toContain("## Summary");
    expect(out).toContain("## Key points");
    expect(out).toContain("- Today we cover the Doppler");
    expect(out).toContain("- The nowcasting workflow");
    // "Ok." is too short to be a bullet
    expect(out).not.toContain("- Ok.");
    // source order preserved
    expect(out.indexOf("Doppler")).toBeLessThan(out.indexOf("nowcasting"));
  });
  it("de-duplicates repeated sentences", () => {
    const s = "The satellite INSAT-3D provides half-hourly imagery over the Indian Ocean region.";
    const out = extractiveMinutes(`${s} ${s}`);
    expect(out.split("INSAT-3D").length - 1).toBe(1);
  });
});

describe("buildMinutesSystemPrompt", () => {
  it("instructs the model not to invent facts", () => {
    expect(buildMinutesSystemPrompt().toLowerCase()).toContain("never invent");
  });
});
