import { describe, expect, it } from "vitest";
import {
  catalogueQuery,
  coursePhase,
  daysUntilStart,
  durationWeeks,
  hasActiveFilters,
  parseCatalogueParams,
} from "@/lib/catalogue";

const NOW = new Date("2026-06-15T00:00:00Z");

describe("parseCatalogueParams", () => {
  it("defaults to page 1, sort 'starting', and no facets", () => {
    const f = parseCatalogueParams({});
    expect(f).toEqual({
      q: "",
      domain: null,
      level: null,
      department: null,
      tier: null,
      sort: "starting",
      page: 1,
      past: false,
    });
  });

  it("keeps facet values that exist in the taxonomy", () => {
    const f = parseCatalogueParams({
      domain: "Radar & Telemetry",
      level: "Advanced",
      department: "IMD",
      tier: "BIP-M",
    });
    expect(f.domain).toBe("Radar & Telemetry");
    expect(f.level).toBe("Advanced");
    expect(f.department).toBe("IMD");
    expect(f.tier).toBe("BIP-M");
  });

  it("drops facet values that are not in the taxonomy", () => {
    const f = parseCatalogueParams({
      domain: "Astrology",
      level: "Wizard",
      department: "NASA",
      tier: "BIP-Z",
    });
    expect(f.domain).toBeNull();
    expect(f.level).toBeNull();
    expect(f.department).toBeNull();
    expect(f.tier).toBeNull();
  });

  it("trims and caps the search term", () => {
    expect(parseCatalogueParams({ q: "  radar  " }).q).toBe("radar");
    expect(parseCatalogueParams({ q: "x".repeat(500) }).q).toHaveLength(100);
  });

  it("falls back to page 1 for junk, zero and negative pages", () => {
    expect(parseCatalogueParams({ page: "abc" }).page).toBe(1);
    expect(parseCatalogueParams({ page: "0" }).page).toBe(1);
    expect(parseCatalogueParams({ page: "-3" }).page).toBe(1);
    expect(parseCatalogueParams({ page: "4" }).page).toBe(4);
  });

  it("only treats past=1 as opting into completed courses", () => {
    expect(parseCatalogueParams({}).past).toBe(false);
    expect(parseCatalogueParams({ past: "1" }).past).toBe(true);
    expect(parseCatalogueParams({ past: "true" }).past).toBe(false);
    expect(parseCatalogueParams({ past: "0" }).past).toBe(false);
  });

  it("rejects an unknown sort", () => {
    expect(parseCatalogueParams({ sort: "cheapest" }).sort).toBe("starting");
    expect(parseCatalogueParams({ sort: "name" }).sort).toBe("name");
  });
});

describe("hasActiveFilters", () => {
  it("is false for a bare catalogue and true once anything is set", () => {
    expect(hasActiveFilters(parseCatalogueParams({}))).toBe(false);
    expect(hasActiveFilters(parseCatalogueParams({ page: "3" }))).toBe(false);
    expect(hasActiveFilters(parseCatalogueParams({ q: "radar" }))).toBe(true);
    expect(hasActiveFilters(parseCatalogueParams({ department: "IMD" }))).toBe(true);
  });
});

describe("catalogueQuery", () => {
  it("omits defaults so a bare catalogue has a clean URL", () => {
    expect(catalogueQuery(parseCatalogueParams({}))).toBe("");
  });

  it("round-trips active filters", () => {
    const f = parseCatalogueParams({ q: "radar", department: "IMD", page: "2" });
    const qs = new URLSearchParams(catalogueQuery(f));
    expect(qs.get("q")).toBe("radar");
    expect(qs.get("department")).toBe("IMD");
    expect(qs.get("page")).toBe("2");
  });

  it("round-trips the completed-courses toggle", () => {
    const f = parseCatalogueParams({ past: "1" });
    expect(new URLSearchParams(catalogueQuery(f)).get("past")).toBe("1");
    expect(new URLSearchParams(catalogueQuery(f, { past: null })).get("past")).toBeNull();
  });

  it("drops page when a facet is overridden, so filtering restarts at page 1", () => {
    const f = parseCatalogueParams({ page: "5", department: "IMD" });
    const qs = new URLSearchParams(catalogueQuery(f, { department: "MoES", page: null }));
    expect(qs.get("department")).toBe("MoES");
    expect(qs.get("page")).toBeNull();
  });
});

describe("coursePhase", () => {
  it("reports a finished course", () => {
    const p = coursePhase(new Date("2026-01-01"), new Date("2026-03-01"), NOW);
    expect(p.phase).toBe("finished");
    expect(p.label).toBe("Completed");
  });

  it("reports an upcoming course", () => {
    const p = coursePhase(new Date("2026-09-01"), new Date("2026-11-01"), NOW);
    expect(p.phase).toBe("upcoming");
  });

  it("reports a running course", () => {
    const p = coursePhase(new Date("2026-05-01"), new Date("2026-08-01"), NOW);
    expect(p.phase).toBe("running");
  });

  it("calls an undated course 'open' rather than pretending it starts soon", () => {
    const p = coursePhase(null, null, NOW);
    expect(p.phase).toBe("open");
    expect(p.label).toBe("Open");
  });

  it("treats an end date in the past as finished even without a start date", () => {
    expect(coursePhase(null, new Date("2026-02-01"), NOW).phase).toBe("finished");
  });

  it("treats a started course with no end date as running", () => {
    expect(coursePhase(new Date("2026-05-01"), null, NOW).phase).toBe("running");
  });
});

describe("daysUntilStart", () => {
  it("counts forward to a future start", () => {
    expect(daysUntilStart(new Date("2026-06-25T00:00:00Z"), NOW)).toBe(10);
  });

  it("is null once the course has started or has no date", () => {
    expect(daysUntilStart(new Date("2026-06-01T00:00:00Z"), NOW)).toBeNull();
    expect(daysUntilStart(null, NOW)).toBeNull();
  });
});

describe("durationWeeks", () => {
  it("rounds to whole weeks", () => {
    expect(durationWeeks(new Date("2026-01-01"), new Date("2026-02-12"))).toBe(6);
  });

  it("never returns zero for a short course", () => {
    expect(durationWeeks(new Date("2026-01-01"), new Date("2026-01-02"))).toBe(1);
  });

  it("is null when either date is missing or the range is inverted", () => {
    expect(durationWeeks(null, new Date("2026-02-01"))).toBeNull();
    expect(durationWeeks(new Date("2026-02-01"), null)).toBeNull();
    expect(durationWeeks(new Date("2026-03-01"), new Date("2026-01-01"))).toBeNull();
  });
});
