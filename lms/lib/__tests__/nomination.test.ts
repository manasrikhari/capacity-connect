import { describe, expect, it } from "vitest";
import { MAX_NOMINEES, parseNominationList } from "@/lib/validations/nomination";

describe("parseNominationList", () => {
  it("reads a bare column of emails", () => {
    const { rows, rejected } = parseNominationList(
      "a.kumar@imd.gov.in\nr.devi@imd.gov.in\n\n  s.rao@imd.gov.in  ",
    );
    expect(rows.map((r) => r.email)).toEqual([
      "a.kumar@imd.gov.in",
      "r.devi@imd.gov.in",
      "s.rao@imd.gov.in",
    ]);
    expect(rejected).toEqual([]);
    expect(rows[0].name).toBeNull();
  });

  it("reads name, email, cadre, designation in either delimiter", () => {
    const { rows } = parseNominationList(
      "A Kumar, a.kumar@imd.gov.in, Met-A, Scientist-B\nR Devi | r.devi@imd.gov.in | Met-B | Scientist-C",
    );
    expect(rows[0]).toEqual({
      name: "A Kumar",
      email: "a.kumar@imd.gov.in",
      cadre: "Met-A",
      designation: "Scientist-B",
    });
    expect(rows[1].cadre).toBe("Met-B");
  });

  it("finds the email wherever it sits in the line", () => {
    const { rows } = parseNominationList("a.kumar@imd.gov.in, A Kumar, Met-A");
    expect(rows[0].email).toBe("a.kumar@imd.gov.in");
    expect(rows[0].name).toBe("A Kumar");
    expect(rows[0].cadre).toBe("Met-A");
  });

  it("lowercases emails and drops duplicates, keeping the first", () => {
    const { rows } = parseNominationList(
      "A Kumar, A.Kumar@IMD.gov.in\nDuplicate, a.kumar@imd.gov.in",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("a.kumar@imd.gov.in");
    expect(rows[0].name).toBe("A Kumar");
  });

  it("reports unparseable lines instead of dropping them silently", () => {
    const { rows, rejected } = parseNominationList("A Kumar, Met-A\nr.devi@imd.gov.in");
    expect(rows.map((r) => r.email)).toEqual(["r.devi@imd.gov.in"]);
    expect(rejected).toEqual(["A Kumar, Met-A"]);
  });

  it("rejects strings that only look like emails", () => {
    const { rows, rejected } = parseNominationList("not-an-email\nfoo@bar\n@imd.gov.in");
    expect(rows).toHaveLength(0);
    expect(rejected).toHaveLength(3);
  });

  it("caps a runaway paste", () => {
    const many = Array.from({ length: MAX_NOMINEES + 50 }, (_, i) => `user${i}@imd.gov.in`).join("\n");
    expect(parseNominationList(many).rows).toHaveLength(MAX_NOMINEES);
  });

  it("returns nothing for empty input", () => {
    expect(parseNominationList("   \n\n ")).toEqual({ rows: [], rejected: [] });
  });
});
