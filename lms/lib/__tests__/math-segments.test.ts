import { describe, expect, it } from "vitest";
import { hasMath, markdownExcerpt, splitMath } from "@/lib/math-segments";

describe("splitMath", () => {
  it("splits inline and display math out of prose", () => {
    const segs = splitMath("Nyquist $v_{max} = \\lambda \\cdot PRF / 4$ and $$Z = 200R^{1.6}$$ done");
    expect(segs).toEqual([
      { kind: "text", value: "Nyquist " },
      { kind: "math", value: "v_{max} = \\lambda \\cdot PRF / 4", display: false },
      { kind: "text", value: " and " },
      { kind: "math", value: "Z = 200R^{1.6}", display: true },
      { kind: "text", value: " done" },
    ]);
  });

  it("accepts \\( \\) and \\[ \\] delimiters", () => {
    const segs = splitMath("\\(a^2\\) then \\[b^2\\]");
    expect(segs.filter((s) => s.kind === "math")).toEqual([
      { kind: "math", value: "a^2", display: false },
      { kind: "math", value: "b^2", display: true },
    ]);
  });

  it("leaves currency-style dollars alone", () => {
    expect(splitMath("costs $5 and $10 today")).toEqual([{ kind: "text", value: "costs $5 and $10 today" }]);
    expect(hasMath("costs $5 and $10 today")).toBe(false);
  });

  it("returns a single text segment for plain prose", () => {
    expect(splitMath("no math here")).toEqual([{ kind: "text", value: "no math here" }]);
  });
});

describe("markdownExcerpt", () => {
  it("strips markdown syntax but keeps math", () => {
    const md = "# 3D-Var / 4D-Var\n\n3D-Var minimises $$J(x) = \\tfrac{1}{2}(x - x_b)^T B^{-1}(x - x_b)$$\n- $B$ — **background** error covariance\n- `parent_grid_ratio` of *3:1*";
    expect(markdownExcerpt(md)).toBe(
      "3D-Var / 4D-Var 3D-Var minimises $J(x) = \\tfrac{1}{2}(x - x_b)^T B^{-1}(x - x_b)$ $B$ — background error covariance parent_grid_ratio of 3:1"
    );
  });

  it("truncates on a word boundary without cutting a formula", () => {
    const md = "Intro text that is fairly long " + "$E = mc^2$ " + "and then more words follow here";
    const out = markdownExcerpt(md, 45);
    expect(out.endsWith("…")).toBe(true);
    expect(out).toContain("$E = mc^2$");
    expect(out.length).toBeLessThanOrEqual(46 + "$E = mc^2$".length);
  });

  it("returns an empty string for empty input", () => {
    expect(markdownExcerpt("")).toBe("");
  });
});
