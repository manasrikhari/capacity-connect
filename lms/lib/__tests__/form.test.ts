import { describe, expect, it } from "vitest";
import { z } from "zod";
import { optionalFormId, optionalFormString } from "@/lib/validations/form";

/**
 * These guard a bug that shipped twice: a conditionally-rendered control (a
 * week picker on a course with no weeks, an office picker for a coordinator
 * with one office) makes `FormData.get()` return null, and `z.string().optional()`
 * rejects null — so the whole form failed with an error message that had no
 * field to render against, and the submit button appeared to do nothing.
 */
describe("optionalFormId", () => {
  const schema = z.object({ weekId: optionalFormId() });

  it("accepts a missing control (null) as 'not provided'", () => {
    const r = schema.safeParse({ weekId: null });
    expect(r.success).toBe(true);
    expect(r.success && r.data.weekId).toBeNull();
  });

  it("accepts an unset field (undefined)", () => {
    const r = schema.safeParse({ weekId: undefined });
    expect(r.success).toBe(true);
    expect(r.success && r.data.weekId).toBeNull();
  });

  it("treats an empty string the same as absent", () => {
    const r = schema.safeParse({ weekId: "" });
    expect(r.success).toBe(true);
    expect(r.success && r.data.weekId).toBeNull();
  });

  it("passes a real id through", () => {
    const r = schema.safeParse({ weekId: "cw_123" });
    expect(r.success && r.data.weekId).toBe("cw_123");
  });

  it("is the fix for the plain-optional behaviour that caused the bug", () => {
    // Documents why the helper exists: this is what the old schema did.
    expect(z.string().optional().safeParse(null).success).toBe(false);
    expect(optionalFormId().safeParse(null).success).toBe(true);
  });
});

describe("optionalFormString", () => {
  const schema = z.object({ summary: optionalFormString(10) });

  it("normalises null, undefined and empty to undefined", () => {
    for (const v of [null, undefined, ""]) {
      const r = schema.safeParse({ summary: v });
      expect(r.success).toBe(true);
      expect(r.success && r.data.summary).toBeUndefined();
    }
  });

  it("passes text through and enforces the cap", () => {
    expect(schema.safeParse({ summary: "short" }).success).toBe(true);
    expect(schema.safeParse({ summary: "far too long to fit" }).success).toBe(false);
  });
});
