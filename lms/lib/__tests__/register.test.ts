import { describe, expect, it } from "vitest";
import { MIN_PASSWORD, registerSchema } from "@/lib/validations/auth";

const valid = {
  name: "Priya Raghavan",
  email: "Priya.Raghavan@imd.gov.in",
  password: "monsoon2026",
  confirm: "monsoon2026",
};

describe("registerSchema", () => {
  it("accepts a well-formed registration", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("lowercases and trims the email so duplicates cannot slip through case", () => {
    const r = registerSchema.safeParse({ ...valid, email: "  Priya.Raghavan@IMD.gov.in " });
    expect(r.success && r.data.email).toBe("priya.raghavan@imd.gov.in");
  });

  it("trims the name", () => {
    const r = registerSchema.safeParse({ ...valid, name: "  Priya  " });
    expect(r.success && r.data.name).toBe("Priya");
  });

  it("rejects a malformed email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "priya@" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: "priya" }).success).toBe(false);
  });

  it("rejects a short password", () => {
    const short = "a".repeat(MIN_PASSWORD - 1);
    const r = registerSchema.safeParse({ ...valid, password: short, confirm: short });
    expect(r.success).toBe(false);
  });

  it("rejects a mismatched confirmation, and says which field is wrong", () => {
    const r = registerSchema.safeParse({ ...valid, confirm: "different" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "confirm")).toBe(true);
    }
  });

  it("rejects a one-character name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "P" }).success).toBe(false);
  });

  it("has no role field — registration cannot choose what you become", () => {
    const r = registerSchema.safeParse({ ...valid, role: "SUPER_ADMIN" });
    expect(r.success).toBe(true);
    expect(r.success && "role" in r.data).toBe(false);
  });
});
