import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hasLlmKey, stripJsonFences } from "@/lib/llm";

describe("stripJsonFences", () => {
  it("strips ```json fences and surrounding prose to bare JSON", () => {
    const raw = [
      "Sure! Here is your JSON:",
      "```json",
      '{ "questions": [ { "q": 1 } ] }',
      "```",
      "Hope that helps.",
    ].join("\n");

    const out = stripJsonFences(raw);
    expect(out).toBe('{ "questions": [ { "q": 1 } ] }');
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it("returns already-bare JSON unchanged (aside from trimming)", () => {
    const bare = '{"a":1,"b":{"c":2}}';
    expect(stripJsonFences(bare)).toBe(bare);
  });

  it("returns trimmed input when there is no '{'", () => {
    expect(stripJsonFences("  no json here  ")).toBe("no json here");
  });
});

describe("hasLlmKey", () => {
  const original = process.env.DEEPSEEK_API_KEY;

  beforeEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = original;
  });

  it("is false when DEEPSEEK_API_KEY is unset", () => {
    expect(hasLlmKey()).toBe(false);
  });

  it("is true when DEEPSEEK_API_KEY is a non-empty string", () => {
    process.env.DEEPSEEK_API_KEY = "sk-test";
    expect(hasLlmKey()).toBe(true);
  });
});
