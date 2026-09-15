import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  ApprovalStatus,
  AttendanceStatus,
  CertificateStatus,
  Difficulty,
  LibraryItemType,
  MeetingStatus,
  Role,
} from "../app/generated/prisma/enums";
import { Prisma } from "../app/generated/prisma/client";
import { seedPhase5 } from "./seed-phase5";
import { prisma } from "../lib/prisma";
import {
  computeVerificationHash,
  generateCertificateNumber,
} from "../lib/certificate";
import {
  KNOWLEDGE_NODES,
  KNOWLEDGE_RELATIONS,
} from "../lib/knowledge-graph-data";

// ═══════════════════════════════════════════════════════════════════════════
// CAPACITY CONNECT — SIH 2026 (PS 26075) — MoES / IMD Capacity Building Portal
//
// The tenant unit (Batch) models an IMD training course; SUPER_ADMIN = MoES
// training cell, ADMIN users are IMD trainers, STUDENT users are trainees
// (forecasters, scientists, field staff). Seed data is drawn from real MoES/IMD
// operational meteorology (DWR, NWP, satellite, agromet, cyclone warning) and is
// wired to the competency recommender, GraphRAG and certificate subsystems.
// ═══════════════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;

/** A date `days` from now, pinned to `hour`:`minute` local time. */
function at(days: number, hour: number, minute = 0): Date {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** kebab-case an announcement title into a slug. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  // ── Wipe all data in FK-safe order (children before parents) ───────────────
  await prisma.knowledgeRelation.deleteMany();
  await prisma.knowledgeNode.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.libraryItem.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.traineeSkill.deleteMany();
  await prisma.trainerSkill.deleteMany();
  await prisma.batchSkillRequirement.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.doubt.deleteMany();
  await prisma.meetingMinutes.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.note.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  All tables cleared.\n");

  // ── Hash each distinct password once ───────────────────────────────────────
  const pwAdmin = await bcrypt.hash("Admin@2026", 10);
  const pw1234 = await bcrypt.hash("1234", 10);
  const pwTrainer = await bcrypt.hash("trainer123", 10);
  const pwTrainee = await bcrypt.hash("trainee123", 10);

  type Qual = { degree: string; institution: string; year: number };
  type ProfileSeed = {
    designation?: string;
    department?: string;
    organisation?: string;
    postingLocation?: string;
    yearsExperience?: number;
    interests?: string[];
    qualifications?: Qual[];
    governmentIdType?: string;
    governmentIdNum?: string;
  };

  async function makeUser(opts: {
    email: string;
    name: string;
    password: string;
    role: Role;
    status?: ApprovalStatus;
    onboarded?: boolean;
    profile: ProfileSeed;
  }) {
    return prisma.user.create({
      data: {
        email: opts.email,
        name: opts.name,
        password: opts.password,
        role: opts.role,
        status: opts.status ?? ApprovalStatus.APPROVED,
        onboarded: opts.onboarded ?? true,
        profile: {
          create: {
            designation: opts.profile.designation,
            department: opts.profile.department,
            organisation: opts.profile.organisation ?? "IMD",
            postingLocation: opts.profile.postingLocation,
            yearsExperience: opts.profile.yearsExperience ?? 0,
            interests: opts.profile.interests ?? [],
            qualifications: opts.profile.qualifications ?? [],
            governmentIdType: opts.profile.governmentIdType ?? "Employee ID",
            governmentIdNum: opts.profile.governmentIdNum,
          },
        },
      },
    });
  }

  // ── SUPER_ADMIN (MoES training cell — author of all announcements) ─────────
  const admin = await makeUser({
    email: "admin@moes.gov.in",
    name: "MoES Training Cell",
    password: pwAdmin,
    role: Role.SUPER_ADMIN,
    profile: {
      designation: "Director (Training)",
      department: "Capacity Building Cell",
      organisation: "MoES",
      postingLocation: "Prithvi Bhavan, New Delhi",
      yearsExperience: 24,
      interests: ["Capacity Building", "WMO Competency", "Training Policy"],
      qualifications: [
        { degree: "Ph.D. Earth Sciences", institution: "IIT Delhi", year: 2001 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "MOES-2001-0042",
    },
  });

  // ── Trainers (ADMIN) ───────────────────────────────────────────────────────
  const trRadar = await makeUser({
    email: "trainer.radar@imd.gov.in",
    name: "Dr. S. Balachandran",
    password: pw1234, // demo alias: "trainer" / "teacher" → 1234
    role: Role.ADMIN,
    profile: {
      designation: "Scientist-F",
      department: "Radar & Telemetry",
      organisation: "IMD",
      postingLocation: "DWR Chennai",
      yearsExperience: 22,
      interests: ["Doppler Radar", "Dual-Pol", "Cyclone Nowcasting"],
      qualifications: [
        { degree: "Ph.D. Atmospheric Science", institution: "IIT Delhi", year: 2004 },
        { degree: "M.Sc. Physics", institution: "University of Madras", year: 1998 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2004-0187",
    },
  });

  const trNwp = await makeUser({
    email: "trainer.nwp@imd.gov.in",
    name: "Dr. Ananya Bhattacharya",
    password: pwTrainer,
    role: Role.ADMIN,
    profile: {
      designation: "Scientist-E",
      department: "NWP Division",
      organisation: "IMD",
      postingLocation: "IMD Pune",
      yearsExperience: 16,
      interests: ["WRF", "Data Assimilation", "Ensembles"],
      qualifications: [
        { degree: "Ph.D. Meteorology", institution: "IISc Bengaluru", year: 2009 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2010-0342",
    },
  });

  const trSat = await makeUser({
    email: "trainer.sat@imd.gov.in",
    name: "Dr. R. K. Giri",
    password: pwTrainer,
    role: Role.ADMIN,
    profile: {
      designation: "Scientist-D",
      department: "Satellite Met & Agromet",
      organisation: "IMD",
      postingLocation: "IMD New Delhi",
      yearsExperience: 13,
      interests: ["INSAT-3D", "Agromet Advisory", "Nowcasting"],
      qualifications: [
        { degree: "Ph.D. Space Physics", institution: "Delhi University", year: 2012 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2012-0511",
    },
  });

  // PENDING trainer — populates the MoES admin approval queue (not referenced later).
  await makeUser({
    email: "trainer.hydro@imd.gov.in",
    name: "Dr. Vandana Rao",
    password: pwTrainer,
    role: Role.ADMIN,
    status: ApprovalStatus.PENDING, // approval-queue demo
    profile: {
      designation: "Scientist-C",
      department: "Hydromet",
      organisation: "IMD",
      postingLocation: "IMD Hyderabad",
      yearsExperience: 9,
      interests: ["Flood Meteorology", "QPE", "Hydrology"],
      qualifications: [
        { degree: "M.Tech Hydrology", institution: "IIT Roorkee", year: 2015 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2016-0733",
    },
  });

  // ── Trainees (STUDENT) ─────────────────────────────────────────────────────
  const uPriya = await makeUser({
    email: "trainee.sat@imd.gov.in",
    name: "Priya Raghavan",
    password: pw1234, // demo alias: "trainee" / "student" → 1234
    role: Role.STUDENT,
    profile: {
      designation: "Scientist-B",
      department: "Satellite Meteorology",
      organisation: "IMD",
      postingLocation: "IMD New Delhi",
      yearsExperience: 6,
      interests: ["INSAT-3D", "Radar", "Nowcasting"],
      qualifications: [
        { degree: "M.Sc. Physics", institution: "University of Hyderabad", year: 2018 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2019-1204",
    },
  });

  const uArjun = await makeUser({
    email: "trainee.radar@imd.gov.in",
    name: "Arjun Nair",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Meteorologist Gr-II",
      department: "Radar & Telemetry",
      organisation: "IMD",
      postingLocation: "DWR Machilipatnam",
      yearsExperience: 4,
      interests: ["Doppler Radar", "Cyclone Nowcasting"],
      qualifications: [
        { degree: "M.Sc. Meteorology", institution: "Andhra University", year: 2020 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2021-1533",
    },
  });

  const uKavya = await makeUser({
    email: "trainee.nwp@imd.gov.in",
    name: "Kavya Menon",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Scientist-B",
      department: "NWP Division",
      organisation: "IMD",
      postingLocation: "IMD Pune",
      yearsExperience: 5,
      interests: ["WRF", "Ensemble Forecasting", "Python"],
      qualifications: [
        { degree: "M.Tech Atmospheric Science", institution: "IIT Kharagpur", year: 2019 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2020-1341",
    },
  });

  const uRamesh = await makeUser({
    email: "trainee.agro@imd.gov.in",
    name: "Ramesh Patil",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Agromet Observer",
      department: "Agricultural Meteorology",
      organisation: "IMD",
      postingLocation: "DAMU KVK Baramati",
      yearsExperience: 8,
      interests: ["Crop-Weather", "District Advisories", "Monsoon"],
      qualifications: [
        { degree: "M.Sc. Agro-Meteorology", institution: "MPKV Rahuri", year: 2015 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2016-0988",
    },
  });

  const uSneha = await makeUser({
    email: "trainee.cyclone@imd.gov.in",
    name: "Sneha Das",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Meteorologist Gr-II",
      department: "Cyclone Warning",
      organisation: "IMD",
      postingLocation: "RMC Chennai",
      yearsExperience: 7,
      interests: ["Cyclone Track", "Impact-Based Warning", "Radar"],
      qualifications: [
        { degree: "M.Sc. Meteorology", institution: "Cochin University", year: 2017 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2018-1102",
    },
  });

  const uVikram = await makeUser({
    email: "trainee.hydro@imd.gov.in",
    name: "Vikram Singh",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Scientific Assistant",
      department: "Hydromet",
      organisation: "IMD",
      postingLocation: "FMO Patna",
      yearsExperience: 5,
      interests: ["Flood Forecasting", "QPE", "Rainfall"],
      qualifications: [
        { degree: "M.Sc. Physics", institution: "Patna University", year: 2019 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2020-1420",
    },
  });

  const uMeenakshi = await makeUser({
    email: "trainee.obs@imd.gov.in",
    name: "Meenakshi Iyer",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Meteorologist Gr-II",
      department: "Surface Observations",
      organisation: "IMD",
      postingLocation: "MC Thiruvananthapuram",
      yearsExperience: 9,
      interests: ["Radar Products", "Surface Instruments", "QC"],
      qualifications: [
        { degree: "M.Sc. Meteorology", institution: "Cochin University", year: 2013 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2014-0855",
    },
  });

  const uFarhan = await makeUser({
    email: "trainee.avi@imd.gov.in",
    name: "Farhan Sheikh",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Meteorologist Gr-II",
      department: "Aviation Meteorology",
      organisation: "IMD",
      postingLocation: "AMO Mumbai",
      yearsExperience: 6,
      interests: ["Aviation Forecasting", "Radar", "Cyclone"],
      qualifications: [
        { degree: "M.Sc. Meteorology", institution: "University of Mumbai", year: 2017 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "IMD-2018-1067",
    },
  });

  const uDeepa = await makeUser({
    email: "trainee.ocean@incois.gov.in",
    name: "Deepa Krishnan",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Scientist-B",
      department: "Ocean Forecasting",
      organisation: "INCOIS",
      postingLocation: "INCOIS Hyderabad",
      yearsExperience: 7,
      interests: ["Storm Surge", "Ocean State", "Cyclone"],
      qualifications: [
        { degree: "M.Tech Ocean Technology", institution: "IIT Madras", year: 2016 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "INCOIS-2017-0421",
    },
  });

  const uAnil = await makeUser({
    email: "trainee.ncmrwf@ncmrwf.gov.in",
    name: "Anil Kumar",
    password: pwTrainee,
    role: Role.STUDENT,
    profile: {
      designation: "Scientist-C",
      department: "Global Modelling",
      organisation: "NCMRWF",
      postingLocation: "NCMRWF Noida",
      yearsExperience: 11,
      interests: ["NCUM", "Data Assimilation", "GFS"],
      qualifications: [
        { degree: "Ph.D. Atmospheric Science", institution: "IIT Bombay", year: 2013 },
      ],
      governmentIdType: "Employee ID",
      governmentIdNum: "NCMRWF-2013-0209",
    },
  });

  // ── Courses (Batch) ────────────────────────────────────────────────────────
  const nwp = await prisma.batch.create({
    data: {
      name: "Advanced NWP Modeling (WRF / GFS-T1534 / NCUM)",
      subject: "NWP Modeling",
      grade: "Advanced",
      teacherId: trNwp.id,
      joinCode: "NWP-2026",
      department: "IMD",
      wmoTier: "BIP-M",
      description:
        "Hands-on operational numerical weather prediction: configuring WRF, running GFS-T1534/NCUM guidance, and variational data assimilation for the Indian region.",
      startDate: at(-14, 9),
      endDate: at(28, 17),
    },
  });

  const dwr = await prisma.batch.create({
    data: {
      name: "Doppler Weather Radar Calibration & Products",
      subject: "Radar & Telemetry",
      grade: "Intermediate",
      teacherId: trRadar.id,
      joinCode: "DWR-2026",
      department: "IMD",
      wmoTier: "BIP-M",
      description:
        "Operation, calibration and product interpretation of S-band DWR — reflectivity, radial velocity de-aliasing, dual-pol variables and QPE.",
      startDate: at(-21, 9),
      endDate: at(21, 17),
    },
  });

  const agro = await prisma.batch.create({
    data: {
      name: "Agro-Meteorology Advisory (DAMU)",
      subject: "Agro-Meteorology",
      grade: "Foundation",
      teacherId: trSat.id,
      joinCode: "AGRO-2026",
      department: "IMD",
      wmoTier: "BIP-MT",
      description:
        "Preparing district and block-level crop-weather advisories under the GKMS scheme, integrating medium-range forecasts and INSAT-3D products.",
      startDate: at(-7, 9),
      endDate: at(35, 17),
    },
  });

  const cyc = await prisma.batch.create({
    data: {
      name: "Cyclone Warning & Radar Meteorology",
      subject: "Disaster Warning",
      grade: "Advanced",
      teacherId: trRadar.id,
      joinCode: "CYC-2025",
      department: "IMD",
      wmoTier: "BIP-M",
      description:
        "IMD's four-stage cyclone warning system, radar and satellite signatures of tropical cyclones, and impact-based warning communication.",
      startDate: at(-75, 9),
      endDate: at(-10, 17), // completed cohort; status kept ACTIVE
    },
  });

  // ── Enrollments ────────────────────────────────────────────────────────────
  const A = ApprovalStatus.APPROVED;
  const P = ApprovalStatus.PENDING;
  const enrollPlan: {
    batch: { id: string };
    trainee: { id: string };
    status: ApprovalStatus;
  }[] = [
    // nwp
    { batch: nwp, trainee: uKavya, status: A },
    { batch: nwp, trainee: uAnil, status: A },
    { batch: nwp, trainee: uDeepa, status: A },
    { batch: nwp, trainee: uVikram, status: A },
    { batch: nwp, trainee: uPriya, status: A },
    // dwr
    { batch: dwr, trainee: uArjun, status: A },
    { batch: dwr, trainee: uMeenakshi, status: A },
    { batch: dwr, trainee: uSneha, status: A },
    { batch: dwr, trainee: uFarhan, status: A },
    { batch: dwr, trainee: uPriya, status: A },
    { batch: dwr, trainee: uVikram, status: P }, // approval-queue demo
    // agro
    { batch: agro, trainee: uRamesh, status: A },
    { batch: agro, trainee: uVikram, status: A },
    { batch: agro, trainee: uMeenakshi, status: A },
    { batch: agro, trainee: uDeepa, status: A },
    // cyc
    { batch: cyc, trainee: uSneha, status: A },
    { batch: cyc, trainee: uArjun, status: A },
    { batch: cyc, trainee: uFarhan, status: A },
    { batch: cyc, trainee: uPriya, status: A },
  ];
  for (const e of enrollPlan) {
    await prisma.enrollment.create({
      data: { studentId: e.trainee.id, batchId: e.batch.id, status: e.status },
    });
  }
  // Approved-only roster per batch (in enrollment order) for attendance/attempts.
  const approvedByBatch: Record<string, string[]> = {};
  for (const e of enrollPlan) {
    if (e.status !== A) continue;
    (approvedByBatch[e.batch.id] ??= []).push(e.trainee.id);
  }

  // ── Competency taxonomy (16 skills) ────────────────────────────────────────
  const skillDefs: { name: string; category: string; description: string }[] = [
    { name: "Doppler Radar Principles", category: "Radar & Telemetry", description: "Beam geometry, reflectivity, radial velocity and the Doppler measurement chain of an S-band DWR." },
    { name: "Radar Velocity De-aliasing", category: "Radar & Telemetry", description: "Recognising and unfolding aliased Doppler velocities beyond the Nyquist co-interval." },
    { name: "Z-R Relationship & QPE", category: "Radar & Telemetry", description: "Applying Z–R power laws (e.g. Marshall–Palmer) and polarimetric methods for rainfall estimation." },
    { name: "Radar Calibration & Maintenance", category: "Radar & Telemetry", description: "Sun-tracking, solar scans and engineering checks that keep radar measurements accurate." },
    { name: "WRF Model Configuration", category: "NWP Modeling", description: "Setting up WRF domains, nesting and physics suites for regional forecasts over India." },
    { name: "GFS-T1534 / NCUM Operations", category: "NWP Modeling", description: "Running and interpreting global model guidance from GFS-T1534 and the NCUM unified model." },
    { name: "Data Assimilation (3D-Var/4D-Var)", category: "NWP Modeling", description: "Ingesting radar, satellite and in-situ observations into the model initial state via variational methods." },
    { name: "Model Verification & Bias Correction", category: "NWP Modeling", description: "Verifying forecasts against observations and applying statistical bias correction." },
    { name: "INSAT-3D/3DR Product Interpretation", category: "Satellite Meteorology", description: "Reading multi-spectral imager/sounder products from INSAT-3D and INSAT-3DR." },
    { name: "Satellite Nowcasting", category: "Satellite Meteorology", description: "Very short-range severe-weather nowcasting from geostationary satellite imagery." },
    { name: "Agromet Advisory Preparation", category: "Agro-Meteorology", description: "Translating the medium-range forecast into actionable crop-stage advisory bulletins." },
    { name: "Crop-Weather Modelling", category: "Agro-Meteorology", description: "Linking crop phenology to weather thresholds using crop-weather calendars and models." },
    { name: "Cyclone Track & Intensity Forecasting", category: "Disaster Warning", description: "Predicting cyclone movement and intensity from synoptic analysis and NWP/ensemble guidance." },
    { name: "Impact-Based Warning Communication", category: "Disaster Warning", description: "Communicating hazard impacts to enable disaster response under IMD's warning framework." },
    { name: "WMO BIP-M Core Meteorology", category: "WMO BIP-M Core", description: "Core competencies of the WMO Basic Instruction Package for Meteorologists (BIP-M)." },
    { name: "Python for Meteorological Data", category: "WMO BIP-M Core", description: "Using Python (xarray, MetPy, Matplotlib) to process and visualise meteorological datasets." },
  ];
  const skillArr: { id: string; name: string }[] = [];
  const skillByName: Record<string, { id: string }> = {};
  for (const s of skillDefs) {
    const created = await prisma.skill.create({ data: s });
    skillArr.push(created);
    skillByName[s.name] = created;
  }
  /** 1-based skill id accessor: sk(2) → "Radar Velocity De-aliasing". */
  const sk = (n: number) => skillArr[n - 1].id;

  // ── Batch skill requirements (demand matrix) ───────────────────────────────
  const reqSeed: [{ id: string }, number, number, number, boolean][] = [
    [nwp, 5, 4, 1.5, true], [nwp, 6, 4, 1.5, true], [nwp, 7, 3, 1, true],
    [nwp, 8, 3, 1, false], [nwp, 15, 3, 0.5, true], [nwp, 16, 3, 0.5, false],
    [dwr, 1, 4, 1.5, true], [dwr, 2, 4, 1.5, true], [dwr, 3, 3, 1, true],
    [dwr, 4, 4, 1, true], [dwr, 15, 3, 0.5, true],
    [agro, 11, 4, 1.5, true], [agro, 12, 3, 1, true], [agro, 9, 3, 1, false],
    [agro, 15, 2, 0.5, true],
    [cyc, 13, 4, 1.5, true], [cyc, 1, 3, 1, true], [cyc, 2, 3, 1, false],
    [cyc, 14, 3, 1, true], [cyc, 9, 3, 0.5, false], [cyc, 15, 3, 0.5, true],
  ];
  for (const [batch, n, min, weight, mandatory] of reqSeed) {
    await prisma.batchSkillRequirement.create({
      data: {
        batchId: batch.id,
        skillId: sk(n),
        minProficiency: min,
        weight,
        isMandatory: mandatory,
      },
    });
  }

  // ── Trainer verified proficiencies ─────────────────────────────────────────
  const trainerSkillSeed: [{ id: string }, number, number, number, boolean][] = [
    [trRadar, 1, 5, 15, true], [trRadar, 2, 5, 12, true], [trRadar, 3, 4, 10, true],
    [trRadar, 4, 5, 15, true], [trRadar, 13, 4, 8, true], [trRadar, 15, 5, 18, true],
    [trNwp, 5, 5, 10, true], [trNwp, 6, 5, 8, true], [trNwp, 7, 4, 6, true],
    [trNwp, 8, 4, 6, false], [trNwp, 15, 4, 12, true], [trNwp, 16, 5, 9, true],
    [trSat, 9, 5, 11, true], [trSat, 10, 4, 7, true], [trSat, 11, 4, 6, false],
    [trSat, 12, 3, 4, false], [trSat, 15, 4, 12, true], [trSat, 13, 2, 2, false],
  ];
  for (const [trainer, n, prof, yrs, verified] of trainerSkillSeed) {
    await prisma.trainerSkill.create({
      data: {
        trainerId: trainer.id,
        skillId: sk(n),
        proficiency: prof,
        yearsExperience: yrs,
        isVerified: verified,
      },
    });
  }

  // ── Assessments: MCQ banks (correct/marks/difficulty/explanation) ──────────
  type Q = {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
    difficulty?: Difficulty;
    explanation?: string;
  };
  const E = Difficulty.EASY;
  const M = Difficulty.MEDIUM;
  const H = Difficulty.HARD;

  const bank: Record<string, Q[]> = {
    dealias: [
      { question: "The Nyquist (maximum unambiguous) velocity of a Doppler radar is:", optionA: "v = λ·PRF/4", optionB: "v = λ·PRF/2", optionC: "v = c/(2·PRF)", optionD: "v = PRF/λ", correctOption: "A", marks: 4, difficulty: M, explanation: "v_max = λ·PRF/4; a higher PRF widens the unambiguous velocity interval." },
      { question: "On a radial-velocity display, velocity folding (aliasing) appears as:", optionA: "A smooth inbound-to-outbound gradient through zero", optionB: "An abrupt jump from strong outbound to strong inbound with no zero isodop between", optionC: "A melting-layer bright band", optionD: "Uniform zero velocity", correctOption: "B", marks: 5, difficulty: H, explanation: "Folding shows extreme opposite-sign velocities adjacent, with no intervening zero line." },
      { question: "The dual-PRF technique is used mainly to:", optionA: "Extend the unambiguous (Nyquist) velocity interval", optionB: "Calibrate reflectivity", optionC: "Remove ground clutter", optionD: "Estimate ZDR", correctOption: "A", marks: 3, difficulty: E, explanation: "Alternating two PRFs raises the effective Nyquist velocity." },
      { question: "The 'Doppler dilemma' is the trade-off between the unambiguous limits of:", optionA: "Range and velocity (r_max·v_max = cλ/8)", optionB: "Reflectivity and velocity", optionC: "Beam width and antenna gain", optionD: "ZDR and KDP", correctOption: "A", marks: 4, difficulty: H, explanation: "Raising one of unambiguous range or velocity lowers the other; r_max·v_max = cλ/8." },
      { question: "A mesocyclone is identified on radial velocity as:", optionA: "A gate-to-gate couplet of adjacent inbound and outbound maxima", optionB: "Uniform outbound flow", optionC: "High ρHV alone", optionD: "A three-body scatter spike", correctOption: "A", marks: 4, difficulty: M, explanation: "A rotational couplet (adjacent inbound/outbound peaks) marks a mesocyclone." },
    ],
    zr: [
      { question: "The Marshall–Palmer Z–R relation is:", optionA: "Z = 200 R^1.6", optionB: "Z = 300 R^1.4", optionC: "R = 200 Z^1.6", optionD: "Z = 100 R", correctOption: "A", marks: 3, difficulty: E, explanation: "Marshall–Palmer: Z = 200 R^{1.6} (Z in mm⁶ m⁻³, R in mm h⁻¹)." },
      { question: "For a fixed reflectivity Z, increasing the coefficient a in Z = aR^b gives an inferred rain rate that is:", optionA: "Lower", optionB: "Higher", optionC: "Unchanged", optionD: "Negative", correctOption: "A", marks: 4, difficulty: M, explanation: "R = (Z/a)^{1/b}; a larger a implies a smaller inferred R." },
      { question: "Polarimetric QPE improves rainfall estimation mainly because KDP is:", optionA: "Immune to attenuation and calibration errors", optionB: "A velocity product", optionC: "Only valid for snow", optionD: "Independent of rainfall", correctOption: "A", marks: 4, difficulty: M, explanation: "KDP is a phase measurement, unaffected by attenuation or absolute calibration." },
      { question: "The radar bright band typically causes Z–R QPE to:", optionA: "Overestimate the surface rain rate", optionB: "Underestimate it always", optionC: "Introduce no bias", optionD: "Return zero", correctOption: "A", marks: 4, difficulty: H, explanation: "Melting-layer enhancement inflates Z, overestimating R." },
    ],
    radarProducts: [
      { question: "ρHV (correlation coefficient) values below ~0.85 usually indicate:", optionA: "Non-meteorological or mixed-phase targets", optionB: "Pure light rain", optionC: "Perfect calibration", optionD: "A high PRF", correctOption: "A", marks: 4, difficulty: M, explanation: "Low ρHV flags clutter, biota or mixed hydrometeors." },
      { question: "Radar calibration by sun-tracking (solar scan) primarily checks:", optionA: "Antenna pointing and receiver gain", optionB: "Rain rate", optionC: "Nyquist velocity", optionD: "ZDR of rain", correctOption: "A", marks: 4, difficulty: M, explanation: "The sun is a known radiometric/positional reference for pointing and gain." },
      { question: "ZDR near 0 dB corresponds to hydrometeors that are:", optionA: "Small and near-spherical", optionB: "Large and oblate", optionC: "Tumbling hail only", optionD: "Aliased", correctOption: "A", marks: 3, difficulty: E, explanation: "Spherical drops scatter equally in H and V, so ZDR ≈ 0 dB." },
      { question: "KDP is derived from the range derivative of:", optionA: "Differential propagation phase (ΦDP)", optionB: "Reflectivity", optionC: "Radial velocity", optionD: "Spectrum width", correctOption: "A", marks: 4, difficulty: H, explanation: "KDP = ½ d(ΦDP)/dr." },
    ],
    wrf: [
      { question: "A common WRF two-way nesting ratio (parent_grid_ratio) is:", optionA: "3:1", optionB: "10:1", optionC: "1:1", optionD: "7:2", correctOption: "A", marks: 3, difficulty: E, explanation: "Odd ratios such as 3:1 and 5:1 are standard; 3:1 is most common." },
      { question: "The PBL scheme in WRF parameterises:", optionA: "Boundary-layer turbulence and vertical mixing", optionB: "Cloud microphysics", optionC: "Longwave radiation only", optionD: "Ocean currents", correctOption: "A", marks: 4, difficulty: M, explanation: "The planetary boundary-layer scheme handles sub-grid turbulent fluxes." },
      { question: "GFS-T1534 output is typically supplied to WRF as:", optionA: "Initial and lateral boundary conditions", optionB: "Radar assimilation input", optionC: "Post-processing only", optionD: "Verification truth", correctOption: "A", marks: 4, difficulty: M, explanation: "Global model fields drive WRF's IC/LBCs." },
      { question: "Cumulus parameterisation is usually switched OFF at grid spacing:", optionA: "≲ 4 km (convection-permitting)", optionB: "> 50 km", optionC: "Exactly 12 km", optionD: "Any resolution", correctOption: "A", marks: 4, difficulty: H, explanation: "At convection-permitting scales deep convection is resolved explicitly." },
    ],
    da: [
      { question: "In 3D-Var, the background error covariance matrix is denoted:", optionA: "B", optionB: "R", optionC: "H", optionD: "K", correctOption: "A", marks: 3, difficulty: E, explanation: "B weights the background; R weights the observations." },
      { question: "4D-Var differs from 3D-Var by:", optionA: "Assimilating observations at their correct time within a window", optionB: "Ignoring the forecast model", optionC: "Using only radar data", optionD: "Being non-variational", correctOption: "A", marks: 4, difficulty: M, explanation: "4D-Var uses the model as a strong/weak constraint over an assimilation window." },
      { question: "The observation operator H maps:", optionA: "Model state into observation space", optionB: "Observations onto the model grid only", optionC: "Time into space", optionD: "Nothing", correctOption: "A", marks: 4, difficulty: M, explanation: "H(x) lets model and observations be compared consistently." },
      { question: "Assimilating radar radial velocity most improves the analysis of:", optionA: "The wind field / convective-scale dynamics", optionB: "Soil type", optionC: "Land-use category", optionD: "Station metadata", correctOption: "A", marks: 4, difficulty: H, explanation: "Radial velocity constrains the flow, aiding storm-scale initialisation." },
    ],
    damu: [
      { question: "Under the GKMS scheme, DAMUs issue agromet advisories:", optionA: "Twice a week (bi-weekly)", optionB: "Every hour", optionC: "Once a year", optionD: "Never", correctOption: "A", marks: 3, difficulty: E, explanation: "Advisories are issued twice weekly (typically Tuesday and Friday)." },
      { question: "A crop-weather calendar links weather thresholds to:", optionA: "Crop phenological stages", optionB: "Radar PRF", optionC: "Satellite channels", optionD: "Arbitrary calendar dates", correctOption: "A", marks: 4, difficulty: M, explanation: "Advisories map forecasts to each growth stage's sensitivity." },
      { question: "The core deliverable of DAMUs at district/block level is:", optionA: "Actionable agromet advisory bulletins", optionB: "Cyclone warnings", optionC: "Aviation forecasts", optionD: "Radar calibration reports", correctOption: "A", marks: 4, difficulty: E, explanation: "DAMUs translate forecasts into farm-level guidance." },
      { question: "The medium-range forecast used in agromet advisories typically spans about:", optionA: "5 days", optionB: "6 hours", optionC: "3 months", optionD: "1 year", correctOption: "A", marks: 4, difficulty: M, explanation: "GKMS advisories rest on ~5-day medium-range guidance." },
    ],
    insatAgro: [
      { question: "Which INSAT-3D product is most useful for monsoon/agromet monitoring:", optionA: "Outgoing Longwave Radiation (OLR) and rainfall proxies", optionB: "Radial velocity", optionC: "ZDR", optionD: "Nyquist velocity", correctOption: "A", marks: 4, difficulty: M, explanation: "OLR is a proxy for deep convection and monsoon activity." },
      { question: "Cloud-top temperature from INSAT-3D IR imagery gauges:", optionA: "Convective intensity", optionB: "Soil salinity", optionC: "Velocity aliasing", optionD: "Antenna gain", correctOption: "A", marks: 3, difficulty: E, explanation: "Colder tops indicate deeper, more intense convection." },
      { question: "INSAT-3DR complements INSAT-3D by:", optionA: "Extending imager/sounder coverage as a follow-on satellite", optionB: "Replacing ground radar", optionC: "Measuring KDP", optionD: "Running data assimilation", correctOption: "A", marks: 4, difficulty: M, explanation: "INSAT-3DR is the follow-on, improving temporal/spatial coverage." },
      { question: "Region-wide OLR below ~200 W/m² indicates:", optionA: "Deep convection / active monsoon", optionB: "Clear dry skies", optionC: "Strong subsidence", optionD: "An instrument fault", correctOption: "A", marks: 4, difficulty: H, explanation: "Low OLR means high, cold cloud tops — deep convection." },
    ],
    cycStages: [
      { question: "IMD's first-stage bulletin, issued ~72 h ahead, is the:", optionA: "Pre-Cyclone Watch", optionB: "Cyclone Alert", optionC: "Cyclone Warning", optionD: "Post-Landfall Outlook", correctOption: "A", marks: 4, difficulty: E, explanation: "Stage 1: Pre-Cyclone Watch, issued 72 hours in advance." },
      { question: "The Cyclone Alert (stage 2) is issued about ___ before expected adverse weather:", optionA: "48 hours", optionB: "6 hours", optionC: "1 week", optionD: "After landfall", correctOption: "A", marks: 4, difficulty: M, explanation: "Stage 2: Cyclone Alert, ~48 hours ahead." },
      { question: "The Cyclone Warning (stage 3) is issued about:", optionA: "24 hours before adverse weather", optionB: "72 hours before", optionC: "12 hours after landfall", optionD: "5 days before", correctOption: "A", marks: 4, difficulty: M, explanation: "Stage 3: Cyclone Warning, ~24 hours ahead." },
      { question: "The Post-Landfall Outlook (stage 4) is issued about:", optionA: "12 hours before expected landfall", optionB: "1 month before", optionC: "Only after the season", optionD: "10 days before", correctOption: "A", marks: 4, difficulty: M, explanation: "Stage 4: Post-Landfall Outlook, issued ~12 hours before landfall." },
      { question: "IMD tropical-cyclone bulletins for the North Indian Ocean are issued by:", optionA: "Area Cyclone Warning Centres / RSMC New Delhi", optionB: "NCMRWF only", optionC: "INCOIS only", optionD: "IITM Pune", correctOption: "A", marks: 4, difficulty: E, explanation: "RSMC New Delhi and ACWCs are the designated warning authorities." },
    ],
    cycRadar: [
      { question: "On radar reflectivity, a mature tropical cyclone's eye appears as:", optionA: "An echo-free region ringed by an eyewall", optionB: "A melting-layer bright band", optionC: "Uniform ZDR", optionD: "A velocity couplet only", correctOption: "A", marks: 4, difficulty: M, explanation: "The calm eye returns little echo, surrounded by the intense eyewall." },
      { question: "Spiral bands on reflectivity indicate:", optionA: "Organised convective rainbands around the centre", optionB: "Ground clutter", optionC: "Second-trip echoes", optionD: "Beam blockage", correctOption: "A", marks: 3, difficulty: E, explanation: "Spiral rainbands are a hallmark of cyclone structure." },
      { question: "Radial velocity across a cyclone centre shows:", optionA: "An inbound/outbound couplet indicating rotation", optionB: "Zero velocity everywhere", optionC: "Only outbound flow", optionD: "Only inbound flow", correctOption: "A", marks: 4, difficulty: M, explanation: "Cyclonic rotation produces a velocity couplet about the centre." },
      { question: "Radar-based cyclone centre fixing is limited mainly by:", optionA: "Radar range (~a few hundred km) and beam geometry", optionB: "Nothing", optionC: "OLR availability", optionD: "Soil moisture", correctOption: "A", marks: 4, difficulty: H, explanation: "Beyond radar range, satellite (Dvorak) fixing takes over." },
    ],
  };

  async function createTest(opts: {
    batchId: string;
    title: string;
    subject: string;
    questions: Q[];
    isActive: boolean;
    closesAt?: Date;
    createdDaysAgo: number;
    durationMins?: number;
    skillName?: string;
    passPercent?: number;
  }) {
    const test = await prisma.test.create({
      data: {
        batchId: opts.batchId,
        title: opts.title,
        subject: opts.subject,
        isActive: opts.isActive,
        closesAt: opts.closesAt,
        durationMins: opts.durationMins,
        passPercent: opts.passPercent ?? 50,
        skillId: opts.skillName ? skillByName[opts.skillName].id : undefined,
        createdAt: at(-opts.createdDaysAgo, 9),
      },
    });
    for (let i = 0; i < opts.questions.length; i++) {
      const q = opts.questions[i];
      await prisma.question.create({
        data: {
          testId: test.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          marks: q.marks,
          order: i + 1,
          difficulty: q.difficulty,
          explanation: q.explanation,
          skillId: opts.skillName ? skillByName[opts.skillName].id : undefined,
        },
      });
    }
    return test;
  }

  /** Record an attempt scoring the first `correct` questions right. */
  async function attempt(
    testId: string,
    studentId: string,
    batchId: string,
    correct: number,
    daysAgo: number,
  ) {
    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: "asc" },
    });
    const answers: Record<string, string> = {};
    let score = 0;
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    questions.forEach((q, i) => {
      if (i < correct) {
        answers[q.id] = q.correctOption;
        score += q.marks;
      } else {
        answers[q.id] = q.correctOption === "A" ? "B" : "A";
      }
    });
    await prisma.testAttempt.create({
      data: {
        testId,
        studentId,
        batchId,
        answers: JSON.stringify(answers),
        score,
        totalMarks,
        submittedAt: at(-daysAgo, 18),
      },
    });
  }

  const skillNames = skillDefs.map((s) => s.name);
  const nameOf = (n: number) => skillNames[n - 1];

  // dwr — Radar Velocity De-aliasing (graded). Arjun (index 0) → 2 correct = 9/20 = 45%.
  const dwrRoster = approvedByBatch[dwr.id]; // [uArjun, uMeenakshi, uSneha, uFarhan, uPriya]
  const dealiasTest = await createTest({
    batchId: dwr.id,
    title: "Radar Velocity De-aliasing",
    subject: dwr.subject!,
    questions: bank.dealias,
    isActive: false,
    createdDaysAgo: 6,
    durationMins: 20,
    skillName: nameOf(2),
    passPercent: 50,
  });
  {
    const scores = [2, 4, 5, 3, 4]; // Arjun, Meenakshi, Sneha, Farhan, Priya
    for (let i = 0; i < dwrRoster.length; i++) {
      await attempt(dealiasTest.id, dwrRoster[i], dwr.id, scores[i], 5);
    }
  }
  // Arjun's failed de-aliasing test → verified low proficiency on skill#2.
  await prisma.traineeSkill.upsert({
    where: { traineeId_skillId: { traineeId: uArjun.id, skillId: sk(2) } },
    update: { proficiency: 1, source: `TEST:${dealiasTest.id}` },
    create: {
      traineeId: uArjun.id,
      skillId: sk(2),
      proficiency: 1,
      source: `TEST:${dealiasTest.id}`,
    },
  });

  // dwr — Z-R Relation & QPE Basics (graded)
  const zrTest = await createTest({
    batchId: dwr.id,
    title: "Z-R Relation & QPE Basics",
    subject: dwr.subject!,
    questions: bank.zr,
    isActive: false,
    createdDaysAgo: 13,
    durationMins: 20,
    skillName: nameOf(3),
  });
  {
    const scores = [2, 3, 4, 2, 3];
    for (let i = 0; i < dwrRoster.length; i++) {
      await attempt(zrTest.id, dwrRoster[i], dwr.id, scores[i], 12);
    }
  }
  // dwr — Radar Products & Calibration Quiz (open)
  await createTest({
    batchId: dwr.id,
    title: "Radar Products & Calibration Quiz",
    subject: dwr.subject!,
    questions: bank.radarProducts,
    isActive: true,
    closesAt: at(3, 18),
    createdDaysAgo: 1,
    durationMins: 25,
    skillName: nameOf(4),
  });

  // nwp — WRF Nesting & Physics (graded)
  const nwpRoster = approvedByBatch[nwp.id]; // [uKavya, uAnil, uDeepa, uVikram, uPriya]
  const wrfTest = await createTest({
    batchId: nwp.id,
    title: "WRF Nesting & Physics",
    subject: nwp.subject!,
    questions: bank.wrf,
    isActive: false,
    createdDaysAgo: 5,
    durationMins: 25,
    skillName: nameOf(5),
  });
  {
    const scores = [3, 4, 2, 2, 3];
    for (let i = 0; i < nwpRoster.length; i++) {
      await attempt(wrfTest.id, nwpRoster[i], nwp.id, scores[i], 4);
    }
  }
  // nwp — Data Assimilation Fundamentals (open)
  await createTest({
    batchId: nwp.id,
    title: "Data Assimilation Fundamentals",
    subject: nwp.subject!,
    questions: bank.da,
    isActive: true,
    closesAt: at(4, 18),
    createdDaysAgo: 1,
    durationMins: 30,
    skillName: nameOf(7),
  });

  // agro — DAMU Advisory Fundamentals (graded)
  const agroRoster = approvedByBatch[agro.id]; // [uRamesh, uVikram, uMeenakshi, uDeepa]
  const damuTest = await createTest({
    batchId: agro.id,
    title: "DAMU Advisory Fundamentals",
    subject: agro.subject!,
    questions: bank.damu,
    isActive: false,
    createdDaysAgo: 3,
    durationMins: 20,
    skillName: nameOf(11),
  });
  {
    const scores = [3, 2, 3, 2];
    for (let i = 0; i < agroRoster.length; i++) {
      await attempt(damuTest.id, agroRoster[i], agro.id, scores[i], 2);
    }
  }
  // agro — INSAT-3D for Agromet (open)
  await createTest({
    batchId: agro.id,
    title: "INSAT-3D for Agromet",
    subject: agro.subject!,
    questions: bank.insatAgro,
    isActive: true,
    closesAt: at(6, 18),
    createdDaysAgo: 1,
    durationMins: 20,
    skillName: nameOf(9),
  });

  // cyc — Cyclone Warning Stages (graded)
  const cycRoster = approvedByBatch[cyc.id]; // [uSneha, uArjun, uFarhan, uPriya]
  const cycStagesTest = await createTest({
    batchId: cyc.id,
    title: "Cyclone Warning Stages",
    subject: cyc.subject!,
    questions: bank.cycStages,
    isActive: false,
    createdDaysAgo: 30,
    durationMins: 25,
    skillName: nameOf(13),
  });
  {
    const scores = [5, 3, 4, 4];
    for (let i = 0; i < cycRoster.length; i++) {
      await attempt(cycStagesTest.id, cycRoster[i], cyc.id, scores[i], 28);
    }
  }
  // cyc — Radar Signatures of Tropical Cyclones (graded)
  const cycRadarTest = await createTest({
    batchId: cyc.id,
    title: "Radar Signatures of Tropical Cyclones",
    subject: cyc.subject!,
    questions: bank.cycRadar,
    isActive: false,
    createdDaysAgo: 20,
    durationMins: 20,
    skillName: nameOf(1),
  });
  {
    const scores = [4, 2, 3, 3];
    for (let i = 0; i < cycRoster.length; i++) {
      await attempt(cycRadarTest.id, cycRoster[i], cyc.id, scores[i], 18);
    }
  }

  // ── Trainee self-declared skills + keyed rows ──────────────────────────────
  const SELF = "SELF_DECLARED";
  const traineeSkillSeed: {
    trainee: { id: string };
    n: number;
    prof: number;
    source: string;
  }[] = [
    // Keyed: Arjun (skill#2 already upserted from the failed test above)
    { trainee: uArjun, n: 1, prof: 3, source: SELF },
    { trainee: uArjun, n: 3, prof: 2, source: SELF },
    // Keyed: Sneha (certified on cyc)
    { trainee: uSneha, n: 13, prof: 3, source: SELF },
    { trainee: uSneha, n: 14, prof: 4, source: `CERTIFICATE:${cyc.id}` },
    // Keyed: Priya
    { trainee: uPriya, n: 9, prof: 4, source: SELF },
    { trainee: uPriya, n: 10, prof: 3, source: SELF },
    { trainee: uPriya, n: 1, prof: 2, source: SELF },
    // Self-declared for several other trainees
    { trainee: uKavya, n: 5, prof: 3, source: SELF },
    { trainee: uKavya, n: 6, prof: 2, source: SELF },
    { trainee: uKavya, n: 7, prof: 2, source: SELF },
    { trainee: uKavya, n: 16, prof: 3, source: SELF },
    { trainee: uRamesh, n: 11, prof: 3, source: SELF },
    { trainee: uRamesh, n: 12, prof: 2, source: SELF },
    { trainee: uRamesh, n: 9, prof: 1, source: SELF },
    { trainee: uMeenakshi, n: 1, prof: 2, source: SELF },
    { trainee: uMeenakshi, n: 3, prof: 2, source: SELF },
    { trainee: uMeenakshi, n: 15, prof: 2, source: SELF },
    { trainee: uFarhan, n: 1, prof: 2, source: SELF },
    { trainee: uFarhan, n: 13, prof: 2, source: SELF },
    { trainee: uFarhan, n: 14, prof: 3, source: SELF },
    { trainee: uAnil, n: 5, prof: 3, source: SELF },
    { trainee: uAnil, n: 6, prof: 3, source: SELF },
    { trainee: uAnil, n: 7, prof: 2, source: SELF },
    { trainee: uAnil, n: 8, prof: 2, source: SELF },
    { trainee: uDeepa, n: 13, prof: 2, source: SELF },
    { trainee: uDeepa, n: 9, prof: 2, source: SELF },
    { trainee: uDeepa, n: 15, prof: 2, source: SELF },
    { trainee: uVikram, n: 1, prof: 2, source: SELF },
    { trainee: uVikram, n: 4, prof: 2, source: SELF },
    { trainee: uVikram, n: 15, prof: 1, source: SELF },
  ];
  for (const t of traineeSkillSeed) {
    await prisma.traineeSkill.upsert({
      where: { traineeId_skillId: { traineeId: t.trainee.id, skillId: sk(t.n) } },
      update: { proficiency: t.prof, source: t.source },
      create: {
        traineeId: t.trainee.id,
        skillId: sk(t.n),
        proficiency: t.prof,
        source: t.source,
      },
    });
  }

  // ── Training sessions (Meetings) ───────────────────────────────────────────
  type MeetingSeed = { title: string; description?: string; days: number; hour: number; durationMins: number };

  const pastDwr: MeetingSeed[] = [
    { title: "DWR system overview & site visit", days: -20, hour: 10, durationMins: 90 },
    { title: "Reflectivity, dBZ and beam geometry", days: -18, hour: 10, durationMins: 60 },
    { title: "Radial velocity & Nyquist limits", days: -16, hour: 10, durationMins: 90 },
    { title: "Velocity de-aliasing lab", days: -14, hour: 10, durationMins: 90 },
    { title: "Nyquist folding worked examples", days: -11, hour: 10, durationMins: 60 },
    { title: "Z-R relations for Indian rainfall regimes", days: -9, hour: 10, durationMins: 60 },
    { title: "QPE product QA", days: -6, hour: 10, durationMins: 90 },
    { title: "Calibration: sun-tracking & solar scan", days: -4, hour: 10, durationMins: 90 },
    { title: "Doubt clinic", days: -2, hour: 11, durationMins: 45 },
  ];
  const upcomingDwr: MeetingSeed[] = [
    { title: "Dual-pol variables (ZDR, KDP, ρHV)", description: "Hydrometeor classification decision tree.", days: 2, hour: 10, durationMins: 90 },
    { title: "Radar product suite for RMC ops", description: "Operational product walkthrough.", days: 4, hour: 10, durationMins: 60 },
    { title: "Doubt session", description: "Optional.", days: 6, hour: 11, durationMins: 45 },
  ];
  for (const m of pastDwr) {
    await prisma.meeting.create({
      data: { batchId: dwr.id, title: m.title, description: m.description, date: at(m.days, m.hour), durationMins: m.durationMins, link: "", status: MeetingStatus.ENDED },
    });
  }
  for (const m of upcomingDwr) {
    await prisma.meeting.create({
      data: { batchId: dwr.id, title: m.title, description: m.description, date: at(m.days, m.hour), durationMins: m.durationMins, link: "", status: MeetingStatus.UPCOMING },
    });
  }

  // Other courses: two past + one upcoming each.
  const otherMeetings: { batch: { id: string }; past: [string, number][]; upcoming: [string, number] }[] = [
    { batch: nwp, past: [["WRF domain setup & nesting", -12], ["Physics suites & namelist tuning", -6]], upcoming: ["Data assimilation lab: 3D-Var", 3] },
    { batch: agro, past: [["DAMU advisory workflow & GKMS", -6], ["Reading INSAT-3D for agromet", -3]], upcoming: ["Crop-weather calendar drill", 5] },
    { batch: cyc, past: [["Four-stage cyclone warning system", -28], ["Radar signatures of tropical cyclones", -18]], upcoming: ["Impact-based warning communication", 3] },
  ];
  const pastMeetingIdsByBatch: Record<string, string[]> = {};
  for (const c of otherMeetings) {
    pastMeetingIdsByBatch[c.batch.id] = [];
    for (const [title, days] of c.past) {
      const created = await prisma.meeting.create({
        data: { batchId: c.batch.id, title, date: at(days, 15), durationMins: 60, link: "", status: MeetingStatus.ENDED },
      });
      pastMeetingIdsByBatch[c.batch.id].push(created.id);
    }
    await prisma.meeting.create({
      data: { batchId: c.batch.id, title: c.upcoming[0], date: at(c.upcoming[1], 15), durationMins: 90, link: "", status: MeetingStatus.UPCOMING },
    });
  }

  // ── Attendance ─────────────────────────────────────────────────────────────
  const arjunAbsent = new Set([
    "Velocity de-aliasing lab",
    "Nyquist folding worked examples",
    "QPE product QA",
  ]);
  const pastDwrMeetings = await prisma.meeting.findMany({
    where: { batchId: dwr.id, status: MeetingStatus.ENDED },
    orderBy: { date: "asc" },
  });
  for (let mi = 0; mi < pastDwrMeetings.length; mi++) {
    const meeting = pastDwrMeetings[mi];
    for (let si = 0; si < dwrRoster.length; si++) {
      const studentId = dwrRoster[si];
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (studentId === uArjun.id) {
        status = arjunAbsent.has(meeting.title) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      } else if ((mi + si) % 6 === 0) {
        status = AttendanceStatus.ABSENT;
      }
      await prisma.attendance.create({
        data: { meetingId: meeting.id, studentId, batchId: dwr.id, status },
      });
    }
  }
  for (const [batchId, meetingIds] of Object.entries(pastMeetingIdsByBatch)) {
    const roster = approvedByBatch[batchId];
    for (let mi = 0; mi < meetingIds.length; mi++) {
      for (let si = 0; si < roster.length; si++) {
        await prisma.attendance.create({
          data: {
            meetingId: meetingIds[mi],
            studentId: roster[si],
            batchId,
            status: (mi + si) % 4 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
          },
        });
      }
    }
  }

  // ── Notices (course trainer-authored) ──────────────────────────────────────
  const noticeSeed: { batch: { id: string; teacherId: string }; text: string; days: number }[] = [
    { batch: dwr, text: "Carry the DWR calibration log for Machilipatnam — we review PRF and dual-PRF settings in the calibration session.", days: -3 },
    { batch: dwr, text: "The Radar Velocity De-aliasing assessment is graded and single-attempt. Revise Nyquist folding before you sit it.", days: -6 },
    { batch: nwp, text: "Bring your namelist.input — we tune the physics suite and nesting ratios live during the DA lab.", days: -2 },
    { batch: agro, text: "Revise the Kharif crop-weather calendar before the next GKMS advisory drill.", days: -2 },
    { batch: cyc, text: "Post-cohort: certificates for the completed batch have been issued. Verify yours from the portal.", days: -9 },
  ];
  for (const n of noticeSeed) {
    await prisma.notice.create({
      data: { batchId: n.batch.id, teacherId: n.batch.teacherId, text: n.text, createdAt: at(n.days, 9) },
    });
  }

  // ── Notes (Markdown + LaTeX) ───────────────────────────────────────────────
  const noteSeed: { batch: { id: string; subject: string | null }; title: string; content: string }[] = [
    {
      batch: dwr,
      title: "Doppler velocity & de-aliasing",
      content:
        "# Doppler Velocity & De-Aliasing\n\nThe **Nyquist velocity** is $v_{N} = \\dfrac{\\lambda \\cdot \\text{PRF}}{4}$.\n\nVelocities beyond $\\pm v_{N}$ **fold** (alias). De-aliasing adds or subtracts $2 v_{N}$ to restore continuity across the radial velocity field.\n\n- Watch for sharp $2 v_{N}$ discontinuities with no intervening zero isodop.\n- **Dual-PRF** widens the unambiguous interval.\n- The *Doppler dilemma*: $r_{max} \\cdot v_{max} = \\dfrac{c\\lambda}{8}$.",
    },
    {
      batch: dwr,
      title: "Z–R relations & QPE",
      content:
        "# Quantitative Precipitation Estimation\n\nMarshall–Palmer: $Z = 200 R^{1.6}$ (with $Z$ in $\\text{mm}^6\\,\\text{m}^{-3}$ and $R$ in $\\text{mm h}^{-1}$).\n\nInverting, $R = \\left(\\dfrac{Z}{a}\\right)^{1/b}$. Polarimetric QPE blends $R(K_{DP})$ and $R(Z, Z_{DR})$ for better accuracy in heavy rain, and the **bright band** must be masked to avoid overestimation.",
    },
    {
      batch: nwp,
      title: "WRF nesting & physics",
      content:
        "# WRF Configuration\n\nNesting uses `parent_grid_ratio` (commonly **3:1**). A convection-permitting nest ($\\lesssim 4$ km) runs with cumulus parameterisation **off**.\n\nKey physics options in `namelist.input`:\n- `mp_physics` — microphysics\n- `cu_physics` — cumulus\n- `bl_pbl_physics` — boundary layer\n\nInitial and boundary conditions come from **GFS-T1534** or **NCUM**.",
    },
    {
      batch: nwp,
      title: "Variational data assimilation",
      content:
        "# 3D-Var / 4D-Var\n\n3D-Var minimises\n$$J(x) = \\tfrac{1}{2}(x - x_b)^T B^{-1}(x - x_b) + \\tfrac{1}{2}(y - Hx)^T R^{-1}(y - Hx).$$\n\n- $B$ — background error covariance\n- $R$ — observation error covariance\n- $H$ — observation operator\n\n**4D-Var** extends the cost function over an assimilation window, using the model as a constraint.",
    },
    {
      batch: agro,
      title: "INSAT-3D channels for agromet",
      content:
        "# INSAT-3D for Agromet\n\nThe INSAT-3D imager carries six channels — VIS, SWIR, MIR, WV and two TIR bands.\n\n- **TIR (10.8 µm)** → cloud-top temperature, a proxy for convective intensity.\n- **OLR** below $\\sim 200\\ \\text{W m}^{-2}$ marks deep convection / active monsoon.\n\nDAMUs use these alongside the ~5-day medium-range forecast to frame **bi-weekly** advisories.",
    },
    {
      batch: agro,
      title: "Crop-weather calendars & GKMS",
      content:
        "# Crop-Weather Calendars\n\nUnder **GKMS**, DAMUs map weather thresholds to each **phenological stage** (sowing → germination → flowering → maturity).\n\nAdvisory bulletins are issued **twice a week** (Tuesday/Friday) integrating the medium-range forecast, and translate hazards into farm-level action.",
    },
    {
      batch: cyc,
      title: "IMD four-stage cyclone warning",
      content:
        "# IMD Four-Stage Warning\n\n1. **Pre-Cyclone Watch** — issued ~72 h ahead.\n2. **Cyclone Alert** — ~48 h ahead.\n3. **Cyclone Warning** — ~24 h ahead.\n4. **Post-Landfall Outlook** — ~12 h before landfall.\n\nBulletins for the North Indian Ocean are issued by **RSMC New Delhi** and the Area Cyclone Warning Centres.",
    },
    {
      batch: cyc,
      title: "Radar & satellite signatures of TCs",
      content:
        "# Radar & Satellite Signatures\n\n- On reflectivity: an **echo-free eye** ringed by the **eyewall**, with **spiral rainbands**.\n- On radial velocity: an inbound/outbound **couplet** about the centre (rotation).\n- Beyond radar range, intensity is estimated by the **Dvorak technique** (T-number) from satellite cloud patterns.",
    },
  ];
  for (const n of noteSeed) {
    await prisma.note.create({
      data: { batchId: n.batch.id, title: n.title, subject: n.batch.subject ?? "", content: n.content },
    });
  }

  // ── GraphRAG Knowledge Graph (34 nodes + 45 relations) ─────────────────────
  const nodeByName: Record<string, { id: string }> = {};
  for (const n of KNOWLEDGE_NODES) {
    const created = await prisma.knowledgeNode.create({
      data: {
        name: n.name,
        type: n.type,
        category: n.category,
        description: n.description,
        metadata: n.metadata
          ? (n.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
        skillId: n.skillName ? skillByName[n.skillName].id : undefined,
      },
    });
    nodeByName[n.name] = created;
  }
  for (const r of KNOWLEDGE_RELATIONS) {
    await prisma.knowledgeRelation.create({
      data: {
        sourceId: nodeByName[r.source].id,
        targetId: nodeByName[r.target].id,
        relationType: r.relationType,
        weight: r.weight ?? 1.0,
      },
    });
  }

  // ── Certificates (on cyc; sequential IMD-CC-2026-000100..000102) ───────────
  const certSeed: { trainee: { id: string; name: string | null }; grade: string; scorePercent: number }[] = [
    { trainee: uSneha, grade: "Distinction", scorePercent: 92 },
    { trainee: uFarhan, grade: "Merit", scorePercent: 78 },
    { trainee: uPriya, grade: "Distinction", scorePercent: 88 },
  ];
  const certIssueDate = at(-10, 12);
  for (let i = 0; i < certSeed.length; i++) {
    const c = certSeed[i];
    const certificateNumber = generateCertificateNumber(new Date(), () => 100 + i);
    const verificationHash = computeVerificationHash({
      certificateNumber,
      traineeId: c.trainee.id,
      batchId: cyc.id,
      issueDate: certIssueDate,
    });
    await prisma.certificate.create({
      data: {
        certificateNumber,
        verificationHash,
        batchId: cyc.id,
        traineeId: c.trainee.id,
        grade: c.grade,
        scorePercent: c.scorePercent,
        issueDate: certIssueDate,
        status: CertificateStatus.VALID,
        metadata: {
          batchName: cyc.name,
          domain: cyc.subject,
          wmoTier: cyc.wmoTier,
          recipientName: c.trainee.name ?? "Trainee",
        },
      },
    });
  }

  // ── Feedback (respecting @@unique([batchId, traineeId])) ───────────────────
  const feedbackSeed: {
    batch: { id: string };
    trainee: { id: string };
    overall: number;
    content: number;
    trainer: number;
    infra: number;
    comments: string;
    suggestions?: string;
  }[] = [
    { batch: cyc, trainee: uSneha, overall: 5, content: 5, trainer: 5, infra: 4, comments: "The radar and satellite signature sessions mapped directly onto RMC Chennai cyclone-desk work.", suggestions: "Add a live storm-surge coupling demo with INCOIS." },
    { batch: cyc, trainee: uFarhan, overall: 4, content: 4, trainer: 4, infra: 4, comments: "Warning-stage drills were realistic and useful for aviation impact messaging.", suggestions: "More practice on TAF amendments during cyclones." },
    { batch: cyc, trainee: uPriya, overall: 5, content: 5, trainer: 5, infra: 5, comments: "Excellent blend of satellite and radar interpretation. Dvorak-to-radar handoff was very clear." },
    { batch: dwr, trainee: uMeenakshi, overall: 4, content: 4, trainer: 5, infra: 4, comments: "Strong coverage of calibration and dual-pol; the QPE QA session was a highlight." },
    { batch: dwr, trainee: uPriya, overall: 4, content: 4, trainer: 4, infra: 4, comments: "Good hands-on de-aliasing cases; pace was slightly fast on the Doppler dilemma." },
  ];
  for (const f of feedbackSeed) {
    await prisma.feedback.create({
      data: {
        batchId: f.batch.id,
        traineeId: f.trainee.id,
        overallRating: f.overall,
        contentRating: f.content,
        trainerRating: f.trainer,
        infrastructureRating: f.infra,
        comments: f.comments,
        suggestions: f.suggestions,
      },
    });
  }

  // ── Public CMS Announcements (author = MoES admin) ─────────────────────────
  const annSeed: {
    title: string;
    summary: string;
    content: string;
    category: string;
    isPublished: boolean;
    isFeatured: boolean;
    publishedDays: number | null;
    viewCount: number;
  }[] = [
    {
      title: "Registrations open: Advanced NWP Modeling, Batch 2026-03",
      summary: "Nominations invited for the WRF / GFS-T1534 / NCUM operational modelling course.",
      content:
        "The Ministry of Earth Sciences invites nominations for **Batch 2026-03** of *Advanced NWP Modeling (WRF / GFS-T1534 / NCUM)*, to be delivered by the IMD NWP Division at Pune.\n\nThe course covers WRF domain configuration and nesting, global-model guidance from GFS-T1534 and NCUM, and hands-on 3D-Var / 4D-Var data assimilation. Participants will work on live cases over the Indian region.\n\nRMCs, MCs and NCMRWF may nominate operational forecasters through the portal. Seats are limited and allocated against the WMO BIP-M competency framework.",
      category: "Training Calendar",
      isPublished: true,
      isFeatured: true,
      publishedDays: -2,
      viewCount: 312,
    },
    {
      title: "Ministry of Earth Sciences adopts WMO BIP-M aligned competency framework",
      summary: "All operational meteorologists to be mapped against BIP-M core competencies.",
      content:
        "In line with **WMO-No. 1083**, the Ministry has adopted a competency framework aligned to the Basic Instruction Package for Meteorologists (**BIP-M**).\n\nEvery training course on the portal now declares the skills it builds and the proficiency it targets, and each trainee's profile carries a live competency map drawn from assessments and certificates.\n\nHeads of divisions are requested to review their teams' competency gaps and nominate staff to the recommended courses accordingly.",
      category: "Policy",
      isPublished: true,
      isFeatured: false,
      publishedDays: -9,
      viewCount: 208,
    },
    {
      title: "DWR calibration workshop concludes at DWR Machilipatnam",
      summary: "Field workshop strengthens dual-PRF and solar-scan calibration practice on the east coast.",
      content:
        "A hands-on calibration workshop concluded at **DWR Machilipatnam**, covering sun-tracking, solar scans and dual-PRF configuration for the upgraded S-band radar.\n\nParticipants from east-coast radar stations worked through live velocity de-aliasing cases from recent cyclonic events, reinforcing QPE quality-assurance practice ahead of the cyclone season.\n\nThe workshop is part of the DWR Calibration & Products programme running on the portal.",
      category: "Achievement",
      isPublished: true,
      isFeatured: false,
      publishedDays: -15,
      viewCount: 156,
    },
    {
      title: "IMD 151st Foundation Day: capacity-building highlights",
      summary: "A look back at the year's training milestones across IMD institutes.",
      content:
        "On its **151st Foundation Day**, the India Meteorological Department marked a year of expanded capacity building across radar, NWP, satellite, agromet and cyclone-warning domains.\n\nOver the past year, forecasters and field staff completed structured, competency-mapped courses spanning DWR products, WRF modelling and the four-stage cyclone warning system, supported by the department's new digital training portal.\n\nThe Ministry thanked all trainers and mentoring scientists for their contribution to a weather-ready and climate-smart India.",
      category: "General",
      isPublished: true,
      isFeatured: false,
      publishedDays: -30,
      viewCount: 401,
    },
    {
      title: "Monsoon 2026 forecaster refresher: draft schedule",
      summary: "Internal draft — pre-monsoon refresher on ensembles and agromet advisories.",
      content:
        "Working draft of the **Monsoon 2026 forecaster refresher**, a short pre-monsoon programme on ensemble guidance, INSAT-3D interpretation and GKMS agromet advisories.\n\nThis schedule is under directorate review and is **not yet published**. Dates, venue and the nomination window will be confirmed before release.",
      category: "Training Calendar",
      isPublished: false,
      isFeatured: false,
      publishedDays: null,
      viewCount: 0,
    },
  ];
  for (const a of annSeed) {
    await prisma.announcement.create({
      data: {
        title: a.title,
        slug: slugify(a.title),
        summary: a.summary,
        content: a.content,
        category: a.category,
        isPublished: a.isPublished,
        isFeatured: a.isFeatured,
        publishedAt: a.publishedDays === null ? null : at(a.publishedDays, 10),
        viewCount: a.viewCount,
        authorId: admin.id,
        createdAt: at(a.publishedDays ?? 0, 9),
      },
    });
  }

  // ── Trainer Resource Library (8 items; uploader = course trainer) ──────────
  const libSeed: {
    batch: { id: string; subject: string | null; teacherId: string };
    title: string;
    type: LibraryItemType;
    skillNum: number;
    fileUrl: string;
    description: string;
    durationMins?: number;
    mimeType?: string;
    fileSizeBytes?: number;
  }[] = [
    { batch: dwr, title: "Recording: Velocity De-aliasing Walkthrough", type: LibraryItemType.RECORDED_LECTURE, skillNum: 2, durationMins: 58, fileUrl: "https://example.org/dwr-dealiasing.mp4", description: "Screencast unfolding a real Machilipatnam cyclone velocity field (sample media).", mimeType: "video/mp4" },
    { batch: dwr, title: "IMD Doppler Weather Radar Manual", type: LibraryItemType.MANUAL, skillNum: 4, fileUrl: "https://mausam.imd.gov.in/imd_latest/contents/index_radar.php", description: "Official IMD radar resources: DWR network, products and calibration references." },
    { batch: dwr, title: "Z–R Relationships & QPE (deck)", type: LibraryItemType.PRESENTATION, skillNum: 3, fileUrl: "https://example.org/zr-deck.pdf", description: "Slides on Marshall–Palmer, polarimetric QPE and bright-band masking (sample file).", mimeType: "application/pdf", fileSizeBytes: 3_400_000 },
    { batch: nwp, title: "WRF-ARW User Guide (v4)", type: LibraryItemType.MANUAL, skillNum: 5, fileUrl: "https://www2.mmm.ucar.edu/wrf/users/docs/user_guide_v4/contents.html", description: "Authoritative WRF-ARW configuration and namelist reference." },
    { batch: nwp, title: "Recording: Data Assimilation Primer", type: LibraryItemType.RECORDED_LECTURE, skillNum: 7, durationMins: 72, fileUrl: "https://example.org/da-primer.mp4", description: "3D-Var vs 4D-Var, the observation operator and radar assimilation (sample media).", mimeType: "video/mp4" },
    { batch: agro, title: "DAMU Agromet Advisory Template", type: LibraryItemType.DOCUMENT, skillNum: 11, fileUrl: "https://example.org/damu-template.docx", description: "Editable district advisory bulletin template for GKMS (sample file).", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileSizeBytes: 240_000 },
    { batch: cyc, title: "WMO-No. 1083: BIP-M Guidance", type: LibraryItemType.MANUAL, skillNum: 15, fileUrl: "https://library.wmo.int/idurl/4/57127", description: "WMO Basic Instruction Package for Meteorologists — competency reference." },
    { batch: cyc, title: "Cyclone Warning SOP (deck)", type: LibraryItemType.PRESENTATION, skillNum: 13, fileUrl: "https://example.org/cyclone-sop.pdf", description: "Four-stage warning workflow, timing and dissemination (sample file).", mimeType: "application/pdf", fileSizeBytes: 2_600_000 },
  ];
  for (const l of libSeed) {
    await prisma.libraryItem.create({
      data: {
        batchId: l.batch.id,
        uploaderId: l.batch.teacherId,
        title: l.title,
        description: l.description,
        type: l.type,
        fileUrl: l.fileUrl,
        mimeType: l.mimeType,
        fileSizeBytes: l.fileSizeBytes,
        durationMins: l.durationMins,
        subject: l.batch.subject,
        skillId: sk(l.skillNum),
      },
    });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("✅ Seed completed successfully.\n");

  console.log("┌──────────────────────────────────────────────────────────────┐");
  console.log("│  Capacity Connect (SIH 26075) — MoES / IMD                    │");
  console.log("├──────────────────────────────────────────────────────────────┤");
  console.log("│  SUPER_ADMIN  admin@moes.gov.in            / Admin@2026       │");
  console.log("│  Trainer      trainer.radar@imd.gov.in     / 1234            │");
  console.log("│  Trainer      trainer.nwp@imd.gov.in       / trainer123      │");
  console.log("│  Trainer      trainer.sat@imd.gov.in       / trainer123      │");
  console.log("│  Trainer      trainer.hydro@imd.gov.in     / trainer123 (PEND)│");
  console.log("│  Trainee      trainee.sat@imd.gov.in       / 1234            │");
  console.log("│  Trainees     trainee.*@imd/incois/ncmrwf  / trainee123      │");
  console.log("│  Demo aliases  admin/Admin@2026 · trainer/1234 · trainee/1234 │");
  console.log("└──────────────────────────────────────────────────────────────┘\n");

  const allBatches = await prisma.batch.findMany({
    include: {
      teacher: { select: { name: true } },
      enrollments: { include: { student: { select: { email: true, name: true } } } },
    },
    orderBy: { name: "asc" },
  });
  for (const b of allBatches) {
    console.log(`📚 ${b.name}  (${b.joinCode}, ${b.wmoTier})  — ${b.teacher.name}`);
    for (const e of b.enrollments) {
      console.log(`   └─ ${e.student.email}  (${e.student.name})  [${e.status}]`);
    }
    console.log();
  }

  const counts = {
    users: await prisma.user.count(),
    batches: await prisma.batch.count(),
    enrollments: await prisma.enrollment.count(),
    skills: await prisma.skill.count(),
    trainerSkills: await prisma.trainerSkill.count(),
    traineeSkills: await prisma.traineeSkill.count(),
    batchRequirements: await prisma.batchSkillRequirement.count(),
    tests: await prisma.test.count(),
    questions: await prisma.question.count(),
    attempts: await prisma.testAttempt.count(),
    meetings: await prisma.meeting.count(),
    attendance: await prisma.attendance.count(),
    notes: await prisma.note.count(),
    notices: await prisma.notice.count(),
    knowledgeNodes: await prisma.knowledgeNode.count(),
    knowledgeRelations: await prisma.knowledgeRelation.count(),
    certificates: await prisma.certificate.count(),
    feedback: await prisma.feedback.count(),
    libraryItems: await prisma.libraryItem.count(),
    announcements: await prisma.announcement.count(),
    profiles: await prisma.profile.count(),
  };
  console.log("📊 Capacity Connect data:", JSON.stringify(counts, null, 2));

  // Phase 5/6 fixtures live in their own module so this file stays as it was.
  console.log("🛰️  Phase 5/6 fixtures:");
  await seedPhase5(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
