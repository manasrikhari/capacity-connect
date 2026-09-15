// The Capacity Connect demo knowledge graph (MoES/IMD operational meteorology).
// Shared by prisma/seed.ts (inserts these) and the GraphRAG unit tests (build a
// deterministic fixture from them). 34 nodes, 45 relations. Node `type`/relation
// `relationType` come from lib/taxonomy.ts. `skillName` links SKILL nodes to a
// seeded Skill row; the seed resolves names → ids after insert.

export type SeedNodeMetadata = {
  aliases?: string[];
  source?: string;
  equation?: string;
  units?: string;
};

export type SeedKnowledgeNode = {
  name: string;
  type: string;
  category: string;
  description: string;
  metadata?: SeedNodeMetadata;
  skillName?: string;
};

export type SeedKnowledgeRelation = {
  source: string;
  target: string;
  relationType: string;
  weight?: number;
};

export const KNOWLEDGE_NODES: SeedKnowledgeNode[] = [
  { name: "Tropical Cyclone", type: "HAZARD", category: "Disaster Warning", description: "An intense rotating low-pressure system over warm tropical oceans; the primary severe-weather hazard IMD's cyclone warning apparatus tracks.", metadata: { aliases: ["cyclone", "tc", "tropical storm"] } },
  { name: "Cyclone Tracking", type: "PROCESS", category: "Disaster Warning", description: "Continuous determination of a cyclone's centre, movement and intensity by fusing radar, satellite and NWP guidance.", metadata: { aliases: ["track", "tracking"] } },
  { name: "Doppler Weather Radar", type: "INSTRUMENT", category: "Radar & Telemetry", description: "S-band/C-band DWR measuring reflectivity (Z), radial velocity and dual-polarisation variables for precipitation and cyclone surveillance.", metadata: { aliases: ["dwr", "radar", "doppler radar"], source: "IMD DWR SOP" } },
  { name: "Radial Velocity", type: "CONCEPT", category: "Radar & Telemetry", description: "The component of target motion along the radar beam, measured from the Doppler frequency shift.", metadata: { aliases: ["doppler velocity", "radial wind"] } },
  { name: "Nyquist Velocity", type: "CONCEPT", category: "Radar & Telemetry", description: "The maximum unambiguous radial velocity a radar can measure; velocities beyond it fold (alias).", metadata: { aliases: ["nyquist", "nyquist limit", "unambiguous velocity"], equation: "v_{max} = \\frac{\\lambda \\cdot PRF}{4}" } },
  { name: "Velocity De-aliasing", type: "SKILL", category: "Radar & Telemetry", description: "Unfolding aliased Doppler velocities beyond the Nyquist co-interval to recover true wind speeds.", metadata: { aliases: ["de-aliasing", "dealiasing", "velocity unfolding"] }, skillName: "Radar Velocity De-aliasing" },
  { name: "Reflectivity (dBZ)", type: "CONCEPT", category: "Radar & Telemetry", description: "Radar-returned power from hydrometeors, expressed in dBZ; the basis for precipitation estimation.", metadata: { aliases: ["reflectivity", "dbz", "z"] } },
  { name: "Z-R Relationship", type: "CONCEPT", category: "Radar & Telemetry", description: "Empirical power-law relating radar reflectivity Z to rain rate R, e.g. Marshall–Palmer Z = 200 R^{1.6}.", metadata: { aliases: ["z-r relation", "zr relation", "marshall-palmer"], equation: "Z = aR^b", source: "IMD DWR SOP §4" } },
  { name: "Quantitative Precipitation Estimation", type: "PRODUCT", category: "Radar & Telemetry", description: "Radar-derived rainfall product used in nowcasting and hydrology, combining Z–R and polarimetric methods.", metadata: { aliases: ["qpe", "precipitation estimation"] } },
  { name: "Radar Calibration", type: "PROCESS", category: "Radar & Telemetry", description: "Maintaining radar measurement accuracy via sun-tracking, solar scans and engineering checks.", metadata: { aliases: ["calibration", "sun-tracking"] } },
  { name: "Dual-Polarisation Variables", type: "CONCEPT", category: "Radar & Telemetry", description: "ZDR, KDP and ρHV enabling hydrometeor classification and improved QPE.", metadata: { aliases: ["dual-pol", "dual polarization", "zdr", "kdp"] } },
  { name: "WRF Model", type: "MODEL", category: "NWP Modeling", description: "Weather Research and Forecasting model used for regional numerical prediction over the Indian region.", metadata: { aliases: ["wrf", "wrf-arw"] } },
  { name: "GFS-T1534", type: "MODEL", category: "NWP Modeling", description: "Global Forecast System at T1534 (~12 km) resolution providing boundary and initial conditions.", metadata: { aliases: ["gfs", "gfs t1534"] } },
  { name: "NCUM", type: "MODEL", category: "NWP Modeling", description: "NCMRWF Unified Model — India's operational global NWP system.", metadata: { aliases: ["ncum", "unified model"] } },
  { name: "Data Assimilation", type: "SKILL", category: "NWP Modeling", description: "Ingesting radar, satellite and in-situ observations into the model initial state via 3D-Var/4D-Var.", metadata: { aliases: ["assimilation", "3d-var", "4d-var", "var"] }, skillName: "Data Assimilation (3D-Var/4D-Var)" },
  { name: "Model Nesting", type: "CONCEPT", category: "NWP Modeling", description: "Embedding higher-resolution domains inside coarser ones (e.g. parent_grid_ratio 3:1).", metadata: { aliases: ["nesting", "nested domains"] } },
  { name: "Ensemble Prediction System", type: "CONCEPT", category: "NWP Modeling", description: "A set of perturbed forecasts giving probabilistic guidance and forecast uncertainty.", metadata: { aliases: ["ensemble", "eps"] } },
  { name: "WRF Configuration", type: "SKILL", category: "NWP Modeling", description: "Setting up WRF domains, physics suites and nesting for regional forecasts.", metadata: { aliases: ["wrf setup", "namelist"] }, skillName: "WRF Model Configuration" },
  { name: "INSAT-3D", type: "INSTRUMENT", category: "Satellite Meteorology", description: "Geostationary imager/sounder providing multi-spectral cloud, moisture and SST products.", metadata: { aliases: ["insat-3d", "insat 3d", "insat"] } },
  { name: "INSAT-3DR", type: "INSTRUMENT", category: "Satellite Meteorology", description: "Follow-on to INSAT-3D at 74°E, extending imager/sounder coverage.", metadata: { aliases: ["insat-3dr", "insat 3dr"] } },
  { name: "Cloud Top Temperature", type: "PRODUCT", category: "Satellite Meteorology", description: "Infrared-derived cloud-top temperature used to gauge convective intensity and for Dvorak analysis.", metadata: { aliases: ["ctt", "cloud top temp"] } },
  { name: "Outgoing Longwave Radiation", type: "PRODUCT", category: "Satellite Meteorology", description: "Top-of-atmosphere longwave flux; a proxy for deep convection and monsoon activity.", metadata: { aliases: ["olr"] } },
  { name: "Nowcasting", type: "PROCESS", category: "Satellite Meteorology", description: "Very short-range (0–6 h) forecasting of severe weather from radar and satellite.", metadata: { aliases: ["nowcast"] } },
  { name: "Dvorak Technique", type: "CONCEPT", category: "Satellite Meteorology", description: "Estimating tropical-cyclone intensity (T-number) from satellite cloud patterns.", metadata: { aliases: ["dvorak", "t-number"] } },
  { name: "Cyclone Warning Stages", type: "STANDARD", category: "Disaster Warning", description: "IMD's four-stage bulletin system: Pre-Cyclone Watch, Cyclone Alert, Cyclone Warning, Post-Landfall Outlook.", metadata: { aliases: ["warning stages", "four-stage warning"], source: "IMD Cyclone Warning SOP" } },
  { name: "Impact-Based Forecasting", type: "CONCEPT", category: "Disaster Warning", description: "Communicating not just the hazard but its likely impacts to enable disaster response.", metadata: { aliases: ["ibf", "impact based"] } },
  { name: "Storm Surge", type: "HAZARD", category: "Disaster Warning", description: "Abnormal coastal sea-level rise driven by cyclone winds and low pressure.", metadata: { aliases: ["surge"] } },
  { name: "Agromet Advisory Service", type: "PRODUCT", category: "Agro-Meteorology", description: "District-level crop-weather advisories issued under the GKMS scheme.", metadata: { aliases: ["agromet advisory", "gkms", "advisory bulletin"] } },
  { name: "DAMU", type: "ORGANISATION", category: "Agro-Meteorology", description: "District Agro-Meteorology Unit that prepares and disseminates block-level advisories.", metadata: { aliases: ["damu", "district agromet unit"] } },
  { name: "Agromet Advisory Preparation", type: "SKILL", category: "Agro-Meteorology", description: "Translating the medium-range forecast into actionable crop-stage advisories.", metadata: { aliases: ["advisory preparation"] }, skillName: "Agromet Advisory Preparation" },
  { name: "Cyclone Track & Intensity Forecasting", type: "SKILL", category: "Disaster Warning", description: "Predicting cyclone movement and intensity using synoptic analysis and NWP/ensemble guidance.", metadata: { aliases: ["track forecasting", "intensity forecasting"] }, skillName: "Cyclone Track & Intensity Forecasting" },
  { name: "WMO BIP-M", type: "STANDARD", category: "WMO BIP-M Core", description: "WMO Basic Instruction Package for Meteorologists defining required core competencies.", metadata: { aliases: ["bip-m", "bip", "wmo bip-m"], source: "WMO-No. 1083 / BIP-M" } },
  { name: "IMD", type: "ORGANISATION", category: "WMO BIP-M Core", description: "India Meteorological Department — the national meteorological service under MoES.", metadata: { aliases: ["imd", "india meteorological department"] } },
  { name: "NCMRWF", type: "ORGANISATION", category: "NWP Modeling", description: "National Centre for Medium Range Weather Forecasting — operates the NCUM global model.", metadata: { aliases: ["ncmrwf"] } },
];

export const KNOWLEDGE_RELATIONS: SeedKnowledgeRelation[] = [
  { source: "Cyclone Tracking", target: "Doppler Weather Radar", relationType: "OBSERVED_BY" },
  { source: "Cyclone Tracking", target: "INSAT-3D", relationType: "OBSERVED_BY" },
  { source: "Tropical Cyclone", target: "Cyclone Tracking", relationType: "TRACKED_BY" },
  { source: "Tropical Cyclone", target: "Storm Surge", relationType: "CAUSES" },
  { source: "Doppler Weather Radar", target: "Radial Velocity", relationType: "MEASURES" },
  { source: "Doppler Weather Radar", target: "Reflectivity (dBZ)", relationType: "MEASURES" },
  { source: "Doppler Weather Radar", target: "Dual-Polarisation Variables", relationType: "MEASURES" },
  { source: "Doppler Weather Radar", target: "WRF Model", relationType: "INGESTED_BY", weight: 0.8 },
  { source: "Doppler Weather Radar", target: "Data Assimilation", relationType: "INGESTED_BY" },
  { source: "Radial Velocity", target: "Nyquist Velocity", relationType: "LIMITED_BY" },
  { source: "Radial Velocity", target: "Velocity De-aliasing", relationType: "REQUIRES_SKILL" },
  { source: "Nyquist Velocity", target: "Velocity De-aliasing", relationType: "PREREQUISITE_OF" },
  { source: "Velocity De-aliasing", target: "WMO BIP-M", relationType: "GOVERNED_BY" },
  { source: "Velocity De-aliasing", target: "Cyclone Tracking", relationType: "USED_FOR" },
  { source: "Reflectivity (dBZ)", target: "Z-R Relationship", relationType: "INPUT_TO" },
  { source: "Z-R Relationship", target: "Quantitative Precipitation Estimation", relationType: "PRODUCES" },
  { source: "Dual-Polarisation Variables", target: "Quantitative Precipitation Estimation", relationType: "IMPROVES" },
  { source: "Radar Calibration", target: "Reflectivity (dBZ)", relationType: "VALIDATES" },
  { source: "Radar Calibration", target: "WMO BIP-M", relationType: "GOVERNED_BY" },
  { source: "WRF Model", target: "WRF Configuration", relationType: "REQUIRES_SKILL" },
  { source: "WRF Model", target: "Data Assimilation", relationType: "REQUIRES_SKILL" },
  { source: "WRF Model", target: "Model Nesting", relationType: "USES" },
  { source: "WRF Model", target: "GFS-T1534", relationType: "NESTED_IN" },
  { source: "GFS-T1534", target: "IMD", relationType: "OPERATED_BY" },
  { source: "NCUM", target: "NCMRWF", relationType: "OPERATED_BY" },
  { source: "NCUM", target: "Ensemble Prediction System", relationType: "USED_FOR" },
  { source: "GFS-T1534", target: "Cyclone Track & Intensity Forecasting", relationType: "USED_FOR" },
  { source: "Data Assimilation", target: "WMO BIP-M", relationType: "GOVERNED_BY" },
  { source: "INSAT-3D", target: "Cloud Top Temperature", relationType: "PRODUCES" },
  { source: "INSAT-3D", target: "Outgoing Longwave Radiation", relationType: "PRODUCES" },
  { source: "INSAT-3DR", target: "INSAT-3D", relationType: "SUCCESSOR_OF", weight: 0.5 },
  { source: "INSAT-3D", target: "IMD", relationType: "OPERATED_BY" },
  { source: "Cloud Top Temperature", target: "Dvorak Technique", relationType: "INPUT_TO" },
  { source: "Cloud Top Temperature", target: "Nowcasting", relationType: "USED_FOR" },
  { source: "Dvorak Technique", target: "Cyclone Track & Intensity Forecasting", relationType: "PREREQUISITE_OF" },
  { source: "Cyclone Track & Intensity Forecasting", target: "Cyclone Warning Stages", relationType: "GOVERNED_BY" },
  { source: "Cyclone Warning Stages", target: "Impact-Based Forecasting", relationType: "PART_OF" },
  { source: "Cyclone Warning Stages", target: "IMD", relationType: "ISSUED_BY" },
  { source: "Impact-Based Forecasting", target: "WMO BIP-M", relationType: "GOVERNED_BY" },
  { source: "Outgoing Longwave Radiation", target: "Agromet Advisory Service", relationType: "INPUT_TO", weight: 0.6 },
  { source: "Agromet Advisory Service", target: "DAMU", relationType: "ISSUED_BY" },
  { source: "Agromet Advisory Service", target: "Agromet Advisory Preparation", relationType: "REQUIRES_SKILL" },
  { source: "DAMU", target: "IMD", relationType: "PART_OF" },
  { source: "Nowcasting", target: "Velocity De-aliasing", relationType: "REQUIRES_SKILL", weight: 0.7 },
  { source: "Doppler Weather Radar", target: "IMD", relationType: "OPERATED_BY" },
];
