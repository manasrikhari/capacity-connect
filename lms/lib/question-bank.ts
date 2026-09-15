import type { GeneratedQuestion } from "@/lib/validations/generated-question";
import { difficultyMix } from "@/lib/assessment-prompt";

type BankKey = "radar" | "nwp" | "satellite" | "agro" | "cyclone" | "general";

export const QUESTION_BANK: Record<BankKey, GeneratedQuestion[]> = {
  radar: [
    {
      question:
        "For a Doppler weather radar, the maximum unambiguous (Nyquist) velocity $v_{max}$ is given by which expression, where $\\lambda$ is the wavelength and $PRF$ the pulse repetition frequency?",
      optionA: "$v_{max} = \\lambda \\cdot PRF / 4$",
      optionB: "$v_{max} = \\lambda \\cdot PRF$",
      optionC: "$v_{max} = c / (2 \\cdot PRF)$",
      optionD: "$v_{max} = \\lambda \\cdot PRF / 2$",
      correctOption: "A",
      difficulty: "MEDIUM",
      explanation:
        "The Nyquist velocity is $v_{max} = \\lambda \\cdot PRF / 4$. A higher PRF raises the maximum unambiguous velocity but lowers the maximum unambiguous range.",
      competencyTag: "Doppler radar principles",
    },
    {
      question:
        "On a Doppler velocity display, an abrupt transition from strong outbound (positive) to strong inbound (negative) velocities across adjacent range gates is the classic signature of what?",
      optionA: "Ground clutter",
      optionB: "Velocity folding (aliasing)",
      optionC: "A mesocyclone",
      optionD: "Beam blockage",
      correctOption: "B",
      difficulty: "MEDIUM",
      explanation:
        "When the true radial velocity exceeds the Nyquist velocity it 'folds', producing an unphysical jump from large positive to large negative values. De-aliasing corrects this.",
      competencyTag: "Doppler radar principles",
    },
    {
      question: "The dual-PRF (dual pulse repetition frequency) technique is used primarily to:",
      optionA: "Suppress ground clutter",
      optionB: "Extend the maximum unambiguous velocity",
      optionC: "Increase the antenna gain",
      optionD: "Reduce attenuation in heavy rain",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "By interleaving two PRFs, the effective Nyquist velocity is extended beyond that of either single PRF, mitigating velocity aliasing without shortening the unambiguous range excessively.",
      competencyTag: "Doppler radar principles",
    },
    {
      question:
        "The 'Doppler dilemma' in pulsed weather radar refers to the fundamental trade-off between:",
      optionA: "Range resolution and azimuthal resolution",
      optionB: "Maximum unambiguous range and maximum unambiguous velocity",
      optionC: "Transmit power and receiver noise",
      optionD: "Reflectivity and differential reflectivity",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "Because $r_{max} = c/(2\\,PRF)$ decreases as $v_{max} = \\lambda\\,PRF/4$ increases, a single PRF cannot simultaneously maximise both; this is the Doppler dilemma.",
      competencyTag: "Doppler radar principles",
    },
    {
      question:
        "The Marshall–Palmer relation commonly used by IMD to convert radar reflectivity $Z$ to rainfall rate $R$ is approximately:",
      optionA: "$Z = 200 R^{1.6}$",
      optionB: "$Z = 300 R^{1.4}$",
      optionC: "$Z = 100 R^{2.0}$",
      optionD: "$Z = 50 R^{1.0}$",
      correctOption: "A",
      difficulty: "EASY",
      explanation:
        "The classic Marshall–Palmer $Z$–$R$ relation is $Z = 200 R^{1.6}$ (with $Z$ in $mm^6 m^{-3}$ and $R$ in $mm\\,h^{-1}$), widely used for stratiform rain estimation.",
      competencyTag: "Radar quantitative precipitation estimation",
    },
  ],
  nwp: [
    {
      question:
        "In the WRF Pre-Processing System (WPS), the correct order of executing the three main programs is:",
      optionA: "ungrib → geogrid → metgrid",
      optionB: "geogrid → ungrib → metgrid",
      optionC: "metgrid → geogrid → ungrib",
      optionD: "geogrid → metgrid → ungrib",
      correctOption: "B",
      difficulty: "MEDIUM",
      explanation:
        "geogrid defines the domain and interpolates static terrestrial data, ungrib decodes the GRIB meteorological fields, and metgrid horizontally interpolates those fields onto the model grid.",
      competencyTag: "NWP model configuration",
    },
    {
      question:
        "In a nested WRF domain, the namelist variable 'parent_grid_ratio' specifies the:",
      optionA: "Ratio of parent to nest time steps",
      optionB: "Ratio of the parent grid spacing to the nest grid spacing",
      optionC: "Number of vertical levels in the nest",
      optionD: "Ratio of parent to nest map projections",
      correctOption: "B",
      difficulty: "MEDIUM",
      explanation:
        "parent_grid_ratio is the spatial refinement factor (commonly 3), so a nest inside a 12 km parent with ratio 3 has a 4 km grid spacing.",
      competencyTag: "NWP model configuration",
    },
    {
      question:
        "For a convection-permitting WRF run, cumulus parameterization is generally switched off when the horizontal grid spacing is finer than about:",
      optionA: "1 km",
      optionB: "4 km",
      optionC: "10 km",
      optionD: "25 km",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "Below roughly 4 km the model begins to resolve deep convection explicitly, so the cumulus scheme is usually disabled to avoid double-counting convective heating.",
      competencyTag: "NWP physics parameterization",
    },
    {
      question:
        "In three-dimensional variational (3D-Var) data assimilation, the analysis is obtained by minimizing a cost function $J(x)$ that combines:",
      optionA: "Only the observation term",
      optionB: "The background (first-guess) term and the observation term",
      optionC: "Only the background term",
      optionD: "The adjoint and the tangent-linear terms",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "3D-Var minimizes $J(x) = \\tfrac{1}{2}(x-x_b)^T B^{-1}(x-x_b) + \\tfrac{1}{2}(y-H(x))^T R^{-1}(y-H(x))$, balancing the background departure against the observation departure.",
      competencyTag: "Data assimilation",
    },
    {
      question:
        "The operational GFS spectral truncation T1534 corresponds to an approximate horizontal grid resolution of about:",
      optionA: "12 km",
      optionB: "50 km",
      optionC: "100 km",
      optionD: "1 km",
      correctOption: "A",
      difficulty: "EASY",
      explanation:
        "The GFS at T1534 (semi-Lagrangian) has an effective grid spacing of roughly 13 km, commonly quoted as about 12 km, in the higher-resolution part of the forecast.",
      competencyTag: "Global NWP systems",
    },
  ],
  satellite: [
    {
      question: "The imager on board INSAT-3D operates in how many spectral channels?",
      optionA: "3",
      optionB: "6",
      optionC: "10",
      optionD: "16",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "The INSAT-3D imager has 6 channels: visible, shortwave infrared, mid-infrared, water vapour, and two thermal infrared (split-window) channels.",
      competencyTag: "Satellite meteorology",
    },
    {
      question:
        "The 'split-window' technique, using two adjacent thermal infrared channels, is applied mainly to retrieve:",
      optionA: "Cloud droplet size",
      optionB: "Land/sea surface temperature with atmospheric correction",
      optionC: "Ozone concentration",
      optionD: "Wind speed at cloud top",
      correctOption: "B",
      difficulty: "MEDIUM",
      explanation:
        "The differential water-vapour absorption between the two split-window IR channels (~10.8 and ~12 µm) allows correction for atmospheric moisture, yielding accurate surface temperature.",
      competencyTag: "Satellite meteorology",
    },
    {
      question:
        "The water vapour (WV) channel of the INSAT-3D imager is centred in which spectral band?",
      optionA: "0.55–0.75 µm",
      optionB: "3.8–4.0 µm",
      optionC: "6.5–7.1 µm",
      optionD: "10.3–11.3 µm",
      correctOption: "C",
      difficulty: "MEDIUM",
      explanation:
        "The WV channel near 6.5–7.1 µm senses radiation from mid- to upper-tropospheric moisture, used to track jet streams and dynamic features.",
      competencyTag: "Satellite meteorology",
    },
    {
      question: "INSAT-3DR is positioned in geostationary orbit at approximately:",
      optionA: "74°E",
      optionB: "83°E",
      optionC: "93.5°E",
      optionD: "55°E",
      correctOption: "A",
      difficulty: "HARD",
      explanation:
        "INSAT-3DR operates near 74°E, providing frequent imaging and sounding over the Indian region as part of IMD's geostationary constellation.",
      competencyTag: "Satellite systems",
    },
    {
      question:
        "In the Dvorak technique for estimating tropical cyclone intensity from satellite imagery, cloud-top temperature (CTT) of the eyewall is used to:",
      optionA: "Measure the storm's translation speed",
      optionB: "Estimate the intensity via the difference between eye and surrounding cloud-top temperature",
      optionC: "Determine the storm surge height directly",
      optionD: "Retrieve the sea surface salinity",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "The enhanced-IR Dvorak technique uses the temperature contrast between the warm eye and the cold surrounding eyewall cloud tops to assign a T-number and hence intensity.",
      competencyTag: "Satellite meteorology",
    },
  ],
  agro: [
    {
      question:
        "Under the Gramin Krishi Mausam Sewa (GKMS), district-level agromet advisories are prepared by:",
      optionA: "Regional Meteorological Centres only",
      optionB: "District Agromet Units (DAMUs)",
      optionC: "The National Weather Forecasting Centre",
      optionD: "Panchayat offices",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "DAMUs, hosted mainly at Krishi Vigyan Kendras, prepare district and block-level Agromet Advisory Bulletins under the GKMS scheme.",
      competencyTag: "Agrometeorological advisory services",
    },
    {
      question:
        "Agromet Advisory Bulletins under GKMS are issued to farmers on which days of the week?",
      optionA: "Monday and Thursday",
      optionB: "Tuesday and Friday",
      optionC: "Wednesday and Saturday",
      optionD: "Daily",
      correctOption: "B",
      difficulty: "MEDIUM",
      explanation:
        "Bulletins are prepared and disseminated twice weekly, on Tuesdays and Fridays, so that advisories reach farmers ahead of expected weather.",
      competencyTag: "Agrometeorological advisory services",
    },
    {
      question:
        "The GKMS scheme has expanded the spatial resolution of agromet advisories down to the:",
      optionA: "State level",
      optionB: "District level only",
      optionC: "Block level",
      optionD: "Household level",
      correctOption: "C",
      difficulty: "MEDIUM",
      explanation:
        "Through DAMUs the service now provides block-level advisories, giving farmers guidance more representative of local conditions than the earlier district-level product.",
      competencyTag: "Agrometeorological advisory services",
    },
    {
      question:
        "The medium-range weather forecast that underpins the Agromet Advisory Bulletin is provided for a lead time of:",
      optionA: "24 hours",
      optionB: "5 days",
      optionC: "15 days",
      optionD: "1 season",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "The bulletins are based on a 5-day (medium-range) weather forecast of key parameters such as rainfall, temperature, wind and humidity.",
      competencyTag: "Agrometeorological advisory services",
    },
    {
      question:
        "Effective agromet advisories tailor recommendations primarily according to the:",
      optionA: "Farmer's landholding size only",
      optionB: "Current crop and its phenological (growth) stage",
      optionC: "Market price of the produce",
      optionD: "Distance to the nearest mandi",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "Advisories are crop- and stage-specific: the same forecast implies different actions (sowing, irrigation, spraying, harvesting) depending on the crop's current growth stage.",
      competencyTag: "Crop-weather relationships",
    },
  ],
  cyclone: [
    {
      question:
        "For a cyclonic disturbance over the north Indian Ocean, IMD issues a cyclone warning in how many stages?",
      optionA: "2 stages",
      optionB: "3 stages",
      optionC: "4 stages",
      optionD: "6 stages",
      correctOption: "C",
      difficulty: "MEDIUM",
      explanation:
        "IMD's four-stage warning comprises the Pre-Cyclone Watch (~72 h), Cyclone Alert (~48 h), Cyclone Warning (~24 h) and the Post-landfall Outlook (~12 h before landfall).",
      competencyTag: "Cyclone warning services",
    },
    {
      question:
        "In the Dvorak analysis of tropical cyclones, the 'T-number' primarily indicates the storm's:",
      optionA: "Translation speed",
      optionB: "Current intensity",
      optionC: "Radius of maximum winds",
      optionD: "Direction of movement",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "The tropical (T) number, on a scale from T1.0 to T8.0, is mapped to intensity (maximum sustained wind / central pressure); higher T-numbers denote stronger systems.",
      competencyTag: "Cyclone intensity analysis",
    },
    {
      question:
        "According to IMD's classification, an 'Extremely Severe Cyclonic Storm' (ESCS) has maximum sustained surface winds in the range:",
      optionA: "88–117 km/h",
      optionB: "118–166 km/h",
      optionC: "167–221 km/h",
      optionD: "≥ 222 km/h",
      correctOption: "C",
      difficulty: "MEDIUM",
      explanation:
        "IMD defines an ESCS by maximum sustained winds of 167–221 km/h; ≥222 km/h is a Super Cyclonic Storm.",
      competencyTag: "Cyclone classification",
    },
    {
      question:
        "On a radar PPI display of a mature tropical cyclone, the near-circular echo-free region surrounded by a ring of intense reflectivity corresponds to the:",
      optionA: "Spiral rainbands and the eye",
      optionB: "Eye and the eyewall",
      optionC: "Outflow boundary",
      optionD: "Storm surge front",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "The calm, echo-free eye is ringed by the eyewall, the annulus of deep convection and strongest winds, which appears as a bright reflectivity ring on the PPI.",
      competencyTag: "Cyclone structure",
    },
    {
      question: "The height of a storm surge at the coast is most strongly governed by:",
      optionA: "The colour of the sea surface",
      optionB: "Cyclone intensity, coastal bathymetry and the astronomical tide",
      optionC: "The land surface albedo",
      optionD: "The stratospheric ozone amount",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "Surge height depends on wind stress (intensity and size), the shape and shallowness of the coastal bathymetry, the angle and speed of approach, and coincidence with high tide.",
      competencyTag: "Storm surge",
    },
  ],
  general: [
    {
      question:
        "According to the WMO, a 'day of rain' at a surface observatory is recorded when the 24-hour rainfall is at least:",
      optionA: "0.1 mm",
      optionB: "2.5 mm",
      optionC: "10 mm",
      optionD: "64.5 mm",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "IMD counts a rainy day when 24-hour accumulated rainfall is 2.5 mm or more at the station.",
      competencyTag: "Meteorological observations",
    },
    {
      question: "The standard height of a rain gauge orifice above the ground in the IMD network is:",
      optionA: "0.30 m",
      optionB: "1.25 m",
      optionC: "2.00 m",
      optionD: "3.05 m",
      correctOption: "A",
      difficulty: "MEDIUM",
      explanation:
        "The ordinary (non-recording) rain gauge is installed with its rim 30 cm above ground level to minimise in-splash and wind effects.",
      competencyTag: "Meteorological instruments",
    },
    {
      question:
        "IMD classifies rainfall of 64.5 mm to 115.5 mm in 24 hours at a station as:",
      optionA: "Light rain",
      optionB: "Moderate rain",
      optionC: "Heavy rain",
      optionD: "Very heavy rain",
      correctOption: "C",
      difficulty: "MEDIUM",
      explanation:
        "Per IMD categories, 64.5–115.5 mm/day is 'Heavy rain'; 115.6–204.4 mm is 'Very heavy' and above 204.4 mm is 'Extremely heavy'.",
      competencyTag: "Rainfall classification",
    },
    {
      question:
        "The onset of the southwest monsoon over Kerala is normally declared by IMD around:",
      optionA: "1 April",
      optionB: "1 June",
      optionC: "15 July",
      optionD: "1 September",
      correctOption: "B",
      difficulty: "EASY",
      explanation:
        "The normal date of monsoon onset over Kerala is 1 June, based on rainfall, wind field and outgoing longwave radiation criteria.",
      competencyTag: "Indian monsoon",
    },
    {
      question:
        "In a standard Stevenson screen, thermometers are exposed at a height above ground of approximately:",
      optionA: "0.5 m",
      optionB: "1.25 m",
      optionC: "3 m",
      optionD: "10 m",
      correctOption: "B",
      difficulty: "HARD",
      explanation:
        "The Stevenson screen houses the thermometers at about 1.25 m (roughly 1.2–1.5 m per WMO) to give a representative near-surface air temperature, shielded from radiation.",
      competencyTag: "Meteorological instruments",
    },
  ],
};

const BANK_ORDER: BankKey[] = [
  "radar",
  "nwp",
  "satellite",
  "agro",
  "cyclone",
  "general",
];

/**
 * Map a free-text topic to a question-bank domain via keyword matching.
 */
export function detectBankKey(topic: string): BankKey {
  const t = topic.toLowerCase();

  if (/\b(radar|doppler|dwr)\b/.test(t)) return "radar";
  if (/\b(wrf|nwp|gfs|ncum|assimilation)\b/.test(t)) return "nwp";
  if (/\b(insat|satellite)\b/.test(t)) return "satellite";
  if (/\b(damu|agromet|crop)\b/.test(t)) return "agro";
  if (/\b(cyclone|surge|warning)\b/.test(t)) return "cyclone";
  return "general";
}

/**
 * Deterministically pick `count` questions for a topic: the detected domain
 * bank first, then "general", then the remaining banks in fixed order. The
 * chosen questions' difficulties are relabelled to honour difficultyMix.
 * Stable and repeatable for identical inputs.
 */
export function pickBankQuestions(
  topic: string,
  count: number,
  mix: "balanced" | "easy" | "hard"
): GeneratedQuestion[] {
  const detected = detectBankKey(topic);

  // Build a fixed traversal order: detected, then general, then the rest.
  const order: BankKey[] = [];
  const pushKey = (k: BankKey) => {
    if (!order.includes(k)) order.push(k);
  };
  pushKey(detected);
  pushKey("general");
  for (const k of BANK_ORDER) pushKey(k);

  const picked: GeneratedQuestion[] = [];
  for (const key of order) {
    for (const q of QUESTION_BANK[key]) {
      if (picked.length >= count) break;
      // Copy so we never mutate the source bank.
      picked.push({ ...q });
    }
    if (picked.length >= count) break;
  }

  // Relabel difficulty to honour the requested mix counts.
  const counts = difficultyMix(picked.length, mix);
  let i = 0;
  for (let n = 0; n < counts.EASY; n++, i++) picked[i].difficulty = "EASY";
  for (let n = 0; n < counts.MEDIUM; n++, i++) picked[i].difficulty = "MEDIUM";
  for (let n = 0; n < counts.HARD; n++, i++) picked[i].difficulty = "HARD";

  return picked;
}
