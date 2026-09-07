/**
 * Phase 5/6 seed — competencies, forecast-drill cases, passport evidence, and
 * the upcoming training calendar.
 *
 * Kept separate from `seed.ts` so the base fixtures stay untouched, and written
 * to be idempotent: every row is keyed on something stable (a competency code, a
 * case title, a course slug) so re-running only updates.
 *
 * Run on its own with `npm run db:seed:phase5`, or as the tail of `db:seed`.
 */
import type { PrismaClient } from "../app/generated/prisma/client";

/** The five WMO public-weather-service competencies (WMO-No. 1209, 2019). */
const WMO_COMPETENCIES = [
  {
    code: "WMO-PWS-1",
    name: "Analyse and monitor the evolving meteorological situation",
    category: "WMO BIP-M Core",
    description:
      "Continuously assess observations, satellite and radar imagery and NWP guidance to build an accurate picture of the current and developing situation.",
  },
  {
    code: "WMO-PWS-2",
    name: "Forecast meteorological phenomena and parameters",
    category: "NWP Modeling",
    description:
      "Produce forecasts of weather elements over the required ranges, selecting and adjusting model guidance against observed behaviour.",
  },
  {
    code: "WMO-PWS-3",
    name: "Warn of hazardous meteorological phenomena",
    category: "Disaster Warning",
    description:
      "Detect hazardous conditions and issue timely, correctly graded warnings against published impact thresholds.",
  },
  {
    code: "WMO-PWS-4",
    name: "Communicate meteorological information and impacts",
    category: "WMO BIP-M Core",
    description:
      "Deliver briefings and provide consultation to internal and external users, conveying uncertainty and likely impact in terms the audience can act on.",
  },
  {
    code: "WMO-PWS-5",
    name: "Ensure the quality of information and services",
    category: "WMO BIP-M Core",
    description:
      "Verify forecasts, contribute to case studies and post-event reviews, and mentor junior colleagues.",
  },
] as const;

/**
 * Forecast-drill cases. Each is a *briefing* — the synoptic situation and the
 * guidance available at issue time — and never states the observed rainfall,
 * because that is the answer the trainee is being asked for.
 *
 * The scenarios are modelled on documented Indian events, but the figures are
 * training values chosen to sit unambiguously inside one IMD colour band; they
 * are not transcribed from the archived bulletins.
 *
 * IMD 24-hour rainfall thresholds:
 *   GREEN  < 64.5 mm · YELLOW 64.5–115.5 · ORANGE 115.6–204.4 · RED >= 204.5
 */
const WEATHER_CASES = [
  {
    title: "Severe cyclonic storm approaching the north Tamil Nadu coast",
    hazard: "Cyclone",
    region: "Chennai / Tiruvallur, Tamil Nadu",
    correctColour: "RED",
    competencyCode: "WMO-PWS-3",
    description:
      "A severe cyclonic storm over the southwest Bay of Bengal is moving north-northwestwards, running roughly parallel to and close to the north Tamil Nadu coast. DWR Chennai shows a well-formed eye wall with deep convection banding over the coastal districts; the outer rain bands have already been training over the same catchments for nine hours. Ensemble guidance clusters tightly on extremely heavy falls continuing through the next 24 hours, with the heaviest totals over Chennai, Tiruvallur and Chengalpattu. Coastal stations report a steady pressure fall and gusts touching 65 kt. Issue the 24-hour rainfall warning for Chennai district.",
  },
  {
    title: "Offshore trough with a mid-tropospheric cyclonic circulation over the Konkan",
    hazard: "Heavy rain",
    region: "Mumbai / Thane, Maharashtra",
    correctColour: "RED",
    competencyCode: "WMO-PWS-3",
    description:
      "A strong offshore trough runs from south Gujarat to the north Kerala coast, with an embedded mid-tropospheric cyclonic circulation over the north Konkan. Low-level westerlies at 850 hPa are 40-45 kt over the Arabian Sea, feeding a near-stationary convergence line across the Mumbai metropolitan region. Satellite shows cloud tops colder than -80 degrees C persisting over the same area for six hours, with no steering to move the system on. High tide is due mid-afternoon, which will hold back drainage. Issue the 24-hour rainfall warning for Mumbai.",
  },
  {
    title: "Landfalling system over the Odisha coast near Puri",
    hazard: "Cyclone",
    region: "Puri / Khordha, Odisha",
    correctColour: "ORANGE",
    competencyCode: "WMO-PWS-3",
    description:
      "An extremely severe cyclonic storm is expected to cross the Odisha coast close to Puri in the next 12 hours, moving north-northeastwards at about 12 kt. The storm is compact, with a small radius of maximum wind, and is forecast to weaken steadily after landfall as it recurves inland. Radar shows the heaviest reflectivity confined to a narrow band around the centre rather than spread across the coastal plain, and the system's forward speed limits how long any one district stays under the core. Issue the 24-hour rainfall warning for Puri district.",
  },
  {
    title: "Monsoon break re-establishing over the Gangetic plain",
    hazard: "Heavy rain",
    region: "Kolkata / Howrah, West Bengal",
    correctColour: "YELLOW",
    competencyCode: "WMO-PWS-2",
    description:
      "The monsoon trough has shifted back to its normal position after a five-day break, with its eastern end passing close to Kolkata. A low-pressure area over the north Bay of Bengal is likely to move west-northwestwards but remain to the south of the city. Model guidance indicates a broad area of moderate rainfall with embedded convection, rather than an organised heavy-rain signature; 850 hPa moisture convergence is present but modest. No training echo is evident on radar. Issue the 24-hour rainfall warning for Kolkata.",
  },
  {
    title: "Western disturbance interacting with easterlies over the Himalayan foothills",
    hazard: "Heavy rain",
    region: "Rudraprayag / Chamoli, Uttarakhand",
    correctColour: "RED",
    competencyCode: "WMO-PWS-3",
    description:
      "An unusually deep western disturbance for the season is approaching the western Himalaya at the same time as a monsoon low over northwest Madhya Pradesh pushes moist easterlies against the foothills. The two circulations are forecast to merge over Uttarakhand. Orographic lift over the Alaknanda and Mandakini catchments is strongly favoured, soils in the catchment are already saturated from four days of rain, and guidance shows the convergence zone remaining anchored over the same valleys for over 24 hours. Issue the 24-hour rainfall warning for Rudraprayag district.",
  },
  {
    title: "Pre-monsoon thunderstorm activity over the Indo-Gangetic plain",
    hazard: "Thunderstorm",
    region: "Delhi NCR",
    correctColour: "GREEN",
    competencyCode: "WMO-PWS-2",
    description:
      "A feeble western disturbance lies over Jammu with an induced cyclonic circulation over west Rajasthan. Afternoon heating has produced scattered convection over Haryana, moving east-southeastwards. Cells are shallow and fast-moving, with weak mid-level moisture and dry air entrainment above 600 hPa limiting their lifetime to under an hour. Expect gusty winds and brief showers rather than sustained rainfall. Issue the 24-hour rainfall warning for Delhi.",
  },
  {
    title: "Depression crossing the north Andhra Pradesh coast",
    hazard: "Heavy rain",
    region: "Visakhapatnam / Vizianagaram, Andhra Pradesh",
    correctColour: "ORANGE",
    competencyCode: "WMO-PWS-3",
    description:
      "A depression over the west-central Bay of Bengal is moving northwestwards and is expected to cross the north Andhra Pradesh coast between Kakinada and Visakhapatnam within 18 hours. The system is not intensifying further, but its northern quadrant carries the deeper convection and will pass directly over the coastal districts. Guidance shows a 12-hour window of sustained heavy rainfall before the system moves inland and weakens. Issue the 24-hour rainfall warning for Visakhapatnam district.",
  },
  {
    title: "Northeast monsoon onset surge over coastal Andhra and Rayalaseema",
    hazard: "Heavy rain",
    region: "Nellore / Tirupati, Andhra Pradesh",
    correctColour: "YELLOW",
    competencyCode: "WMO-PWS-2",
    description:
      "The northeast monsoon has set in over south peninsular India, with fresh to strong northeasterlies over the southwest Bay of Bengal feeding moisture onto the coast. There is no organised low-pressure system; rainfall is being driven by onshore convergence and weak upper-air support. Guidance indicates widespread light to moderate rainfall with isolated heavier pockets over the Nellore coast, easing after 24 hours. Issue the 24-hour rainfall warning for Nellore district.",
  },
] as const;

/** Upcoming intakes, so the published training calendar is not empty. */
const UPCOMING_COURSES = [
  {
    slug: "nowcasting-severe-weather-radar-satellite",
    name: "Nowcasting of Severe Weather (Radar & Satellite)",
    subject: "Radar & Telemetry",
    grade: "Advanced",
    wmoTier: "Specialised",
    monthsAhead: 1,
    durationWeeks: 4,
    teacherEmail: "trainer.radar@imd.gov.in",
    description:
      "Short-range prediction of thunderstorms, hail and squall lines using DWR volume scans, INSAT-3DR rapid-scan imagery and blended nowcast products. Built around live case work on archived Indian events.",
    eligibility: {
      qualificationLabel: "Science graduate with Physics and Mathematics",
      requiredQualifications: ["Physics"],
      requiredCadre: "Met-A",
      minYearsExperience: 3,
    },
  },
  {
    slug: "impact-based-forecasting-warning-services",
    name: "Impact-Based Forecasting & Warning Services",
    subject: "Disaster Warning",
    grade: "Intermediate",
    wmoTier: "BIP-MT",
    monthsAhead: 2,
    durationWeeks: 6,
    teacherEmail: "trainer.hydro@imd.gov.in",
    description:
      "Moving from what the weather will be to what the weather will do. Colour-coded warning criteria, impact matrices, and communicating uncertainty to district administrations and the public.",
    eligibility: {
      qualificationLabel: "Graduate in any science discipline",
      minYearsExperience: 2,
    },
  },
  {
    slug: "satellite-meteorology-insat-3dr-products",
    name: "Satellite Meteorology: INSAT-3DR Products & Interpretation",
    subject: "Satellite Meteorology",
    grade: "Foundation",
    wmoTier: "BIP-M",
    monthsAhead: 3,
    durationWeeks: 5,
    teacherEmail: "trainer.sat@imd.gov.in",
    description:
      "Channel-by-channel interpretation of INSAT-3DR imagery, derived products including OLR, upper-tropospheric humidity and quantitative precipitation estimates, and their operational use in the forecast cycle.",
    eligibility: null,
  },
  {
    slug: "ensemble-prediction-probabilistic-forecasting",
    name: "Ensemble Prediction & Probabilistic Forecasting",
    subject: "NWP Modeling",
    grade: "Advanced",
    wmoTier: "Specialised",
    monthsAhead: 4,
    durationWeeks: 4,
    teacherEmail: "trainer.nwp@imd.gov.in",
    description:
      "Interpreting the NCMRWF and ECMWF ensembles, spread-skill relationships, extreme forecast indices, and how to turn ensemble output into a defensible deterministic warning decision.",
    eligibility: {
      qualificationLabel: "Post-graduate degree in Meteorology, Physics or Mathematics",
      requiredQualifications: ["M.Sc"],
      minYearsExperience: 5,
    },
  },
] as const;

/** Week scaffolding for courses seeded without any. */
const WEEK_PLANS: Record<string, { title: string; summary: string }[]> = {
  "cyclone-warning-radar-meteorology": [
    {
      title: "Tropical cyclone structure and classification",
      summary: "Genesis, the IMD intensity scale, and reading a cyclone on radar and satellite.",
    },
    {
      title: "Track and intensity forecasting",
      summary: "Steering flow, model consensus, and the RSMC New Delhi bulletin cycle.",
    },
    {
      title: "Storm surge and landfall impacts",
      summary: "Surge modelling, inundation mapping, and coastal district coordination.",
    },
    {
      title: "Warning dissemination and post-event review",
      summary: "Colour-coded bulletins, impact messaging, and verification after landfall.",
    },
  ],
  "agro-meteorology-advisory-damu": [
    {
      title: "The DAMU framework and the agromet advisory cycle",
      summary: "District Agromet Units, the Tuesday/Friday bulletin rhythm, and who consumes them.",
    },
    {
      title: "Crop-weather relationships",
      summary: "Phenology, critical growth stages, and weather thresholds that change advice.",
    },
    {
      title: "Building the advisory",
      summary: "Turning a five-day district forecast into crop-specific, actionable guidance.",
    },
  ],
};

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addWeeks(base: Date, weeks: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export async function seedPhase5(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  // ── 1. The WMO competency framework ────────────────────────────────────────
  const competencyByCode = new Map<string, string>();
  for (const c of WMO_COMPETENCIES) {
    const row = await prisma.competency.upsert({
      where: { code: c.code },
      create: { code: c.code, name: c.name, category: c.category, description: c.description },
      update: { name: c.name, category: c.category, description: c.description },
    });
    competencyByCode.set(c.code, row.id);
  }
  console.log(`  competencies: ${competencyByCode.size}`);

  // ── 2. National forecast-drill cases ───────────────────────────────────────
  // National (batchId null) so every trainee sees them regardless of enrolment.
  let caseCount = 0;
  for (const c of WEATHER_CASES) {
    const existing = await prisma.weatherCase.findFirst({
      where: { title: c.title },
      select: { id: true },
    });
    const data = {
      title: c.title,
      description: c.description,
      hazard: c.hazard,
      region: c.region,
      correctColour: c.correctColour,
      competencyCode: c.competencyCode,
      batchId: null,
    };
    if (existing) await prisma.weatherCase.update({ where: { id: existing.id }, data });
    else await prisma.weatherCase.create({ data });
    caseCount += 1;
  }
  console.log(`  weather cases: ${caseCount}`);

  // ── 3. Upcoming intakes for the training calendar ──────────────────────────
  let courseCount = 0;
  for (const c of UPCOMING_COURSES) {
    const teacher = await prisma.user.findUnique({
      where: { email: c.teacherEmail },
      select: { id: true },
    });
    if (!teacher) continue;

    const startDate = addMonths(now, c.monthsAhead);
    startDate.setDate(8);
    startDate.setHours(9, 0, 0, 0);

    const common = {
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      department: "IMD",
      wmoTier: c.wmoTier,
      description: c.description,
      startDate,
      endDate: addWeeks(startDate, c.durationWeeks),
      eligibility: c.eligibility ?? undefined,
      teacherId: teacher.id,
    };

    await prisma.batch.upsert({
      where: { slug: c.slug },
      create: {
        ...common,
        slug: c.slug,
        // Deterministic join code so re-seeding never collides with itself.
        joinCode: c.slug.replace(/[^a-z]/g, "").slice(0, 6).toUpperCase(),
      },
      update: common,
    });
    courseCount += 1;
  }
  console.log(`  upcoming courses: ${courseCount}`);

  // ── 4. Weeks for courses seeded without any ────────────────────────────────
  let weekCount = 0;
  for (const [slug, plan] of Object.entries(WEEK_PLANS)) {
    const batch = await prisma.batch.findUnique({
      where: { slug },
      select: { id: true, startDate: true },
    });
    if (!batch) continue;
    const base = batch.startDate ?? now;
    for (const [i, w] of plan.entries()) {
      await prisma.courseWeek.upsert({
        where: { batchId_index: { batchId: batch.id, index: i + 1 } },
        create: {
          batchId: batch.id,
          index: i + 1,
          title: w.title,
          summary: w.summary,
          opensAt: addWeeks(base, i),
        },
        update: { title: w.title, summary: w.summary },
      });
      weekCount += 1;
    }
  }
  console.log(`  course weeks: ${weekCount}`);

  // ── 5. Publish a couple of resources to the public homepage ────────────────
  const publishable = await prisma.libraryItem.findMany({
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true },
  });
  if (publishable.length > 0) {
    await prisma.libraryItem.updateMany({
      where: { id: { in: publishable.map((l) => l.id) } },
      data: { isPublic: true },
    });
  }
  console.log(`  published resources: ${publishable.length}`);

  // ── 6. Passport evidence for the demo trainees ─────────────────────────────
  // A deliberate spread: some competencies examiner-verified, some only claimed,
  // so the passport shows a real "N of M verified" rather than a full house.
  const evidencePlan: {
    email: string;
    verifierEmail: string;
    items: { code: string; level: number; source: string; verified: boolean; note: string }[];
  }[] = [
    {
      email: "trainee.sat@imd.gov.in",
      verifierEmail: "trainer.radar@imd.gov.in",
      items: [
        { code: "WMO-PWS-1", level: 4, source: "COURSE", verified: true, note: "Observed across the DWR calibration practicals." },
        { code: "WMO-PWS-2", level: 3, source: "ASSESSMENT", verified: true, note: "Written assessment, 78%." },
        { code: "WMO-PWS-4", level: 3, source: "COURSE", verified: false, note: "Delivered two shift briefings; awaiting examiner sign-off." },
      ],
    },
    {
      email: "trainee.radar@imd.gov.in",
      verifierEmail: "trainer.radar@imd.gov.in",
      items: [
        { code: "WMO-PWS-1", level: 5, source: "COURSE", verified: true, note: "Consistently accurate situational analysis on shift." },
        { code: "WMO-PWS-3", level: 4, source: "ASSESSMENT", verified: true, note: "Warning exercise against the 2023 cyclone case." },
        { code: "WMO-PWS-5", level: 2, source: "MANUAL", verified: false, note: "Contributed to one post-event review." },
      ],
    },
    {
      email: "trainee.nwp@imd.gov.in",
      verifierEmail: "trainer.nwp@imd.gov.in",
      items: [
        { code: "WMO-PWS-2", level: 4, source: "COURSE", verified: true, note: "WRF configuration and verification exercises." },
        { code: "WMO-PWS-1", level: 3, source: "ASSESSMENT", verified: false, note: "Model-guidance interpretation test." },
      ],
    },
    {
      email: "trainee.cyclone@imd.gov.in",
      verifierEmail: "trainer.hydro@imd.gov.in",
      items: [
        { code: "WMO-PWS-3", level: 5, source: "COURSE", verified: true, note: "Led the landfall warning exercise for the coastal districts." },
        { code: "WMO-PWS-4", level: 4, source: "COURSE", verified: true, note: "Briefed the district collector cell during the simulation." },
      ],
    },
    {
      email: "trainee.agro@imd.gov.in",
      verifierEmail: "trainer.sat@imd.gov.in",
      items: [
        { code: "WMO-PWS-4", level: 3, source: "COURSE", verified: true, note: "DAMU advisory drafting and farmer-facing communication." },
        { code: "WMO-PWS-2", level: 2, source: "ASSESSMENT", verified: false, note: "Crop-weather modelling assessment." },
      ],
    },
    {
      email: "trainee.hydro@imd.gov.in",
      verifierEmail: "trainer.hydro@imd.gov.in",
      items: [
        { code: "WMO-PWS-1", level: 3, source: "COURSE", verified: true, note: "Catchment monitoring during the monsoon exercise." },
        { code: "WMO-PWS-5", level: 3, source: "MANUAL", verified: true, note: "Ran the verification review for two events." },
      ],
    },
  ];

  let evidenceCount = 0;
  for (const plan of evidencePlan) {
    const [trainee, verifier] = await Promise.all([
      prisma.user.findUnique({ where: { email: plan.email }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: plan.verifierEmail }, select: { id: true } }),
    ]);
    if (!trainee) continue;

    for (const item of plan.items) {
      const competencyId = competencyByCode.get(item.code);
      if (!competencyId) continue;

      const existing = await prisma.competencyEvidence.findFirst({
        where: { traineeId: trainee.id, competencyId, source: item.source },
        select: { id: true },
      });
      const data = {
        level: item.level,
        note: item.note,
        verifiedById: item.verified ? (verifier?.id ?? null) : null,
        verifiedAt: item.verified ? new Date() : null,
      };
      if (existing) {
        await prisma.competencyEvidence.update({ where: { id: existing.id }, data });
      } else {
        await prisma.competencyEvidence.create({
          data: { traineeId: trainee.id, competencyId, source: item.source, ...data },
        });
      }
      evidenceCount += 1;
    }
  }
  console.log(`  competency evidence: ${evidenceCount}`);
}
