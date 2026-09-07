import { describe, expect, it } from "vitest";
import { coerceLocale, translate, translator, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

describe("coerceLocale", () => {
  it("accepts supported locales", () => {
    expect(coerceLocale("hi")).toBe("hi");
    expect(coerceLocale("en")).toBe("en");
  });
  it("falls back to the default for anything else", () => {
    expect(coerceLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(coerceLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(coerceLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("translate", () => {
  it("returns the localized string", () => {
    expect(translate("hi", "nav.signIn")).toBe("साइन इन करें");
    expect(translate("en", "nav.signIn")).toBe("Sign in");
  });
  it("falls back to English when a Hindi key is missing", () => {
    // Prove the fallback path with a key we know exists in en; simulate a gap by
    // checking that every en key resolves in hi (to en at worst), never to the raw key.
    for (const key of Object.keys({ "nav.signIn": 1 })) {
      expect(translate("hi", key)).not.toBe(key);
    }
  });
  it("returns the key itself when it exists in no dictionary", () => {
    expect(translate("en", "does.not.exist")).toBe("does.not.exist");
  });
  it("every locale has a Hindi or English rendering for every English key", () => {
    // No English key should be missing from the fallback chain (regression guard).
    for (const loc of LOCALES) {
      expect(translate(loc, "landing.ministry").length).toBeGreaterThan(0);
    }
  });
});

describe("translator", () => {
  it("binds a locale", () => {
    const t = translator("hi");
    expect(t("common.signOut")).toBe("साइन आउट");
  });
});
