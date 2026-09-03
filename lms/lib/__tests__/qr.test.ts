import { describe, expect, it } from "vitest";
import { qrMatrix, qrSvg } from "@/lib/qr";

// The verify URLs this encoder must carry, e.g.
// https://portal.example.gov.in/verify/<64-hex-hash>  (~90 chars) — but in
// practice we encode the number form and short hosts; test a realistic spread.
const SAMPLE = "https://capacity.connect/verify/IMD-CC-2026-000100";

function isFinder(m: boolean[][], top: number, left: number): boolean {
  // 7×7 finder: dark border ring + 3×3 dark core, light gap between.
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const border = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      if (m[top + r][left + c] !== (border || core)) return false;
    }
  }
  return true;
}

describe("qrMatrix", () => {
  it("produces a square matrix of a valid QR size for a verify URL", () => {
    const m = qrMatrix(SAMPLE);
    expect(m.length).toBeGreaterThanOrEqual(21);
    expect(m.every((row) => row.length === m.length)).toBe(true);
    // Version size = 21 + 4*(v-1) → always ≡ 21 (mod 4).
    expect((m.length - 21) % 4).toBe(0);
  });

  it("picks a large-enough version as the URL grows", () => {
    const short = qrMatrix("https://x/verify/1").length;
    const long = qrMatrix("https://capacity.connect/verify/" + "a".repeat(64)).length;
    expect(long).toBeGreaterThanOrEqual(short);
  });

  it("places the three finder patterns at the correct corners", () => {
    const m = qrMatrix(SAMPLE);
    const n = m.length;
    expect(isFinder(m, 0, 0)).toBe(true);
    expect(isFinder(m, 0, n - 7)).toBe(true);
    expect(isFinder(m, n - 7, 0)).toBe(true);
  });

  it("lays down alternating timing patterns on row/col 6", () => {
    const m = qrMatrix(SAMPLE);
    const n = m.length;
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
  });

  it("sets the fixed dark module", () => {
    const m = qrMatrix(SAMPLE);
    expect(m[m.length - 8][8]).toBe(true);
  });

  it("is deterministic", () => {
    expect(qrMatrix(SAMPLE)).toEqual(qrMatrix(SAMPLE));
  });
});

describe("qrSvg", () => {
  it("returns a self-contained SVG with a quiet zone and dark modules", () => {
    const svg = qrSvg(SAMPLE);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<rect");
    expect(svg).toContain("viewBox=");
  });
});
