// Shared controlled vocabularies for Capacity Connect. Closed sets that also
// need DB enums live in schema.prisma; these open, admin-extensible sets stay
// as TS const tuples used by Zod (z.enum) and by <Select> options.

export const SKILL_CATEGORIES = [
  "Radar & Telemetry",
  "NWP Modeling",
  "Satellite Meteorology",
  "Agro-Meteorology",
  "Disaster Warning",
  "WMO BIP-M Core",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

// A course's operational "domain" is stored in Batch.subject.
export const DOMAINS = SKILL_CATEGORIES;

export const LEVELS = ["Foundation", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const DEPARTMENTS = ["IMD", "NCMRWF", "INCOIS", "IITM", "MoES"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const WMO_TIERS = ["BIP-M", "BIP-MT", "Specialised", "Refresher"] as const;
export type WmoTier = (typeof WMO_TIERS)[number];

export const NODE_TYPES = [
  "CONCEPT",
  "INSTRUMENT",
  "MODEL",
  "SKILL",
  "STANDARD",
  "PRODUCT",
  "PROCESS",
  "ORGANISATION",
  "HAZARD",
  "DATASET",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const RELATION_TYPES = [
  "OBSERVED_BY",
  "MEASURES",
  "INGESTED_BY",
  "REQUIRES_SKILL",
  "GOVERNED_BY",
  "PRODUCES",
  "PART_OF",
  "PREREQUISITE_OF",
  "USED_FOR",
  "OPERATED_BY",
  "ISSUED_BY",
  "VALIDATES",
  "INPUT_TO",
  "IMPROVES",
  "LIMITED_BY",
  "USES",
  "NESTED_IN",
  "SUCCESSOR_OF",
  "TRACKED_BY",
  "CAUSES",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const ANNOUNCEMENT_CATEGORIES = [
  "General",
  "Training Calendar",
  "MoES Advisory",
  "Achievement",
  "Policy",
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

// Synonyms per domain, used by the recommender's posting-affinity match and by
// the GraphRAG/domain detectors. Keys are Batch.subject (domain) values.
export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "Radar & Telemetry": ["radar", "dwr", "doppler"],
  "NWP Modeling": ["nwp", "model", "wrf", "forecast", "ncmrwf"],
  "Satellite Meteorology": ["satellite", "insat", "sat"],
  "Agro-Meteorology": ["agro", "damu", "kvk", "crop"],
  "Disaster Warning": ["cyclone", "coastal", "rmc", "warning", "surge"],
  "WMO BIP-M Core": ["bip", "wmo"],
};
