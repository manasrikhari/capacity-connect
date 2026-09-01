import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  ApprovalStatus,
  AttendanceStatus,
  MeetingStatus,
  Role,
} from "../app/generated/prisma/enums";
import { prisma } from "../lib/prisma";

const DAY = 24 * 60 * 60 * 1000;

/** A date `days` from now, pinned to `hour`:`minute` local time. */
function at(days: number, hour: number, minute = 0): Date {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  // Wipe all data in FK-safe order (children before parents)
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
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  All tables cleared.\n");

  const TOTAL_FEE = 5_000_000; // ₹50,000 in paise

  // ── Super-admins ────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "owner1@opengrapes.com",
      name: "Owner 1",
      password: await bcrypt.hash("Gr@pes!Own3r1", 10),
      role: Role.SUPER_ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "owner2@opengrapes.com",
      name: "Owner 2",
      password: await bcrypt.hash("Gr@pes!Own3r2", 10),
      role: Role.SUPER_ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  // ── Teachers ────────────────────────────────────────────────────────────
  const teacher1 = await prisma.user.create({
    data: {
      email: "teacher1@opengrapes.com",
      name: "Ms. Iyer",
      password: await bcrypt.hash("teacher1pass", 10),
      role: Role.ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "teacher2@opengrapes.com",
      name: "Mr. Deshpande",
      password: await bcrypt.hash("1234", 10), // demo login: "teacher" / 1234
      role: Role.ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  // ── Batches ─────────────────────────────────────────────────────────────
  const batch11A = await prisma.batch.create({
    data: { name: "11th-A", subject: "Physics", grade: "11th", teacherId: teacher1.id, joinCode: "AAAA-2222" },
  });
  const batch11B = await prisma.batch.create({
    data: { name: "11th-B", subject: "Chemistry", grade: "11th", teacherId: teacher1.id, joinCode: "BBBB-3333" },
  });
  const batch11C = await prisma.batch.create({
    data: { name: "11th-C", subject: "Physics", grade: "11th", teacherId: teacher2.id, joinCode: "CCCC-4444" },
  });
  const batch12A = await prisma.batch.create({
    data: { name: "12th-A", subject: "Physics", grade: "12th", teacherId: teacher2.id, joinCode: "DDDD-5555" },
  });

  // ── Students (dev passwords so every role can sign in locally) ──────────
  async function createStudent(email: string, name: string) {
    return prisma.user.create({
      data: {
        email,
        name,
        password: await bcrypt.hash("student123", 10),
        role: Role.STUDENT,
        status: ApprovalStatus.APPROVED,
        onboarded: true,
      },
    });
  }

  // 11th-A single-batch
  const aarav = await createStudent("aarav@test.com", "Aarav Sharma");
  const diya = await createStudent("diya@test.com", "Diya Patel");
  const rohan = await createStudent("rohan@test.com", "Rohan Mehta");

  // 11th-B single-batch
  const sneha = await createStudent("sneha@test.com", "Sneha Iyer");
  const vivaan = await createStudent("vivaan@test.com", "Vivaan Reddy");
  const tara = await createStudent("tara@test.com", "Tara Nair");

  // 11th-C single-batch
  const kabir = await createStudent("kabir@test.com", "Kabir Joshi");
  const ananya = await createStudent("ananya@test.com", "Ananya Rao");
  const dev = await createStudent("dev@test.com", "Dev Kulkarni");

  // 12th-A single-batch
  const ishaan = await createStudent("ishaan@test.com", "Ishaan Verma");
  const meera = await createStudent("meera@test.com", "Meera Desai");
  const arjun = await createStudent("arjun@test.com", "Arjun Kapoor");

  // Multi-batch students
  const riya = await createStudent("riya@test.com", "Riya Gupta");
  const karan = await createStudent("karan@test.com", "Karan Malhotra");
  const nisha = await createStudent("nisha@test.com", "Nisha Bhat");

  // ── Enrollments ─────────────────────────────────────────────────────────
  const byBatch: Record<string, { studentId: string }[]> = {
    [batch11A.id]: [aarav, diya, rohan, riya, nisha].map((s) => ({ studentId: s.id })),
    [batch11B.id]: [sneha, vivaan, tara, karan].map((s) => ({ studentId: s.id })),
    [batch11C.id]: [kabir, ananya, dev, riya].map((s) => ({ studentId: s.id })),
    [batch12A.id]: [ishaan, meera, arjun, karan, nisha].map((s) => ({ studentId: s.id })),
  };

  for (const [batchId, students] of Object.entries(byBatch)) {
    for (const { studentId } of students) {
      await prisma.enrollment.create({
        data: { studentId, batchId, status: ApprovalStatus.APPROVED },
      });
    }
  }

  // ── Fees + payments ─────────────────────────────────────────────────────
  // Every enrollment gets a ₹50,000 fee due mid-next-month; the first two
  // students of each batch have paid two ₹15,000 instalments, the third one.
  for (const [batchId, students] of Object.entries(byBatch)) {
    for (let i = 0; i < students.length; i++) {
      const { studentId } = students[i];
      await prisma.fee.create({
        data: { studentId, batchId, totalAmount: TOTAL_FEE, dueDate: at(14, 18) },
      });
      const instalments = i < 2 ? 2 : i === 2 ? 1 : 0;
      for (let p = 0; p < instalments; p++) {
        await prisma.payment.create({
          data: {
            studentId,
            batchId,
            amount: 1_500_000, // ₹15,000
            date: at(-60 + p * 30, 11),
            method: p === 0 ? "UPI" : "Bank Transfer",
            note: `Instalment ${p + 1}`,
          },
        });
      }
    }
  }

  // ── Meetings: a term of past classes + this week's schedule ─────────────
  type MeetingSeed = {
    title: string;
    description?: string;
    days: number;
    hour: number;
    minute?: number;
    durationMins: number;
  };

  const pastTopics11A: MeetingSeed[] = [
    { title: "Units & Measurement", days: -28, hour: 16, durationMins: 90 },
    { title: "Vectors & resolution", days: -24, hour: 16, durationMins: 60 },
    { title: "Kinematics: graphs", days: -21, hour: 10, durationMins: 90 },
    { title: "Laws of Motion I", days: -17, hour: 16, durationMins: 90 },
    { title: "Laws of Motion II", days: -14, hour: 16, durationMins: 60 },
    { title: "Free-body diagrams", days: -10, hour: 10, durationMins: 90 },
    { title: "Friction problems", days: -7, hour: 16, durationMins: 60 },
    { title: "Circular motion", days: -3, hour: 16, durationMins: 90 },
    { title: "Doubt clinic", days: -1, hour: 10, minute: 45, durationMins: 45 },
  ];

  const upcoming11A: MeetingSeed[] = [
    {
      title: "Moment of Inertia",
      description: "Ring & disc demo — bring the lab kit.",
      days: 2,
      hour: 16,
      durationMins: 90,
    },
    {
      title: "Revision: Kinematics",
      description: "Last year's paper, worked end to end.",
      days: 4,
      hour: 10,
      durationMins: 60,
    },
    { title: "Doubt session", description: "Optional.", days: 5, hour: 11, durationMins: 45 },
  ];

  const meetings11A: { id: string; days: number }[] = [];
  for (const m of pastTopics11A) {
    const created = await prisma.meeting.create({
      data: {
        batchId: batch11A.id,
        title: m.title,
        description: m.description,
        date: at(m.days, m.hour, m.minute ?? 0),
        durationMins: m.durationMins,
        link: "",
        status: MeetingStatus.ENDED,
      },
    });
    meetings11A.push({ id: created.id, days: m.days });
  }
  for (const m of upcoming11A) {
    await prisma.meeting.create({
      data: {
        batchId: batch11A.id,
        title: m.title,
        description: m.description,
        date: at(m.days, m.hour, m.minute ?? 0),
        durationMins: m.durationMins,
        link: "",
        status: MeetingStatus.UPCOMING,
      },
    });
  }

  // Other batches: two past classes + one upcoming each.
  const otherBatchMeetings: { batchId: string; title: string }[] = [
    { batchId: batch11B.id, title: "Organic Chemistry Basics" },
    { batchId: batch11C.id, title: "Thermodynamics Overview" },
    { batchId: batch12A.id, title: "Electrostatics Masterclass" },
  ];
  const pastMeetingsByBatch: Record<string, { id: string; days: number }[]> = {};
  for (const m of otherBatchMeetings) {
    pastMeetingsByBatch[m.batchId] = [];
    for (const days of [-8, -4]) {
      const created = await prisma.meeting.create({
        data: {
          batchId: m.batchId,
          title: `${m.title} ${days === -8 ? "I" : "II"}`,
          date: at(days, 17),
          durationMins: 60,
          link: "",
          status: MeetingStatus.ENDED,
        },
      });
      pastMeetingsByBatch[m.batchId].push({ id: created.id, days });
    }
    await prisma.meeting.create({
      data: {
        batchId: m.batchId,
        title: `${m.title}: next steps`,
        date: at(3, 17),
        durationMins: 90,
        link: "",
        status: MeetingStatus.UPCOMING,
      },
    });
  }

  // ── Attendance ──────────────────────────────────────────────────────────
  // 11th-A: Aarav misses three specific classes (matches the dashboard's
  // "missed" story); everyone else misses classes on a rotating pattern.
  const aaravMisses = new Set(["Free-body diagrams", "Friction problems", "Doubt clinic"]);
  const allPast11A = await prisma.meeting.findMany({
    where: { batchId: batch11A.id, status: MeetingStatus.ENDED },
  });
  const students11A = byBatch[batch11A.id];
  for (let mi = 0; mi < allPast11A.length; mi++) {
    const meeting = allPast11A[mi];
    for (let si = 0; si < students11A.length; si++) {
      const { studentId } = students11A[si];
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (studentId === aarav.id) {
        status = aaravMisses.has(meeting.title) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      } else if ((mi + si) % 5 === 0) {
        status = AttendanceStatus.ABSENT;
      }
      await prisma.attendance.create({
        data: { meetingId: meeting.id, studentId, batchId: batch11A.id, status },
      });
    }
  }
  for (const [batchId, past] of Object.entries(pastMeetingsByBatch)) {
    for (let mi = 0; mi < past.length; mi++) {
      const students = byBatch[batchId];
      for (let si = 0; si < students.length; si++) {
        await prisma.attendance.create({
          data: {
            meetingId: past[mi].id,
            studentId: students[si].studentId,
            batchId,
            status: (mi + si) % 4 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
          },
        });
      }
    }
  }

  // ── Notices ─────────────────────────────────────────────────────────────
  const notices: { batchId: string; teacherId: string; text: string; days: number }[] = [
    { batchId: batch11A.id, teacherId: teacher1.id, text: "Bring the lab kit on Thursday — ring, disc and the metre scale.", days: -1 },
    { batchId: batch11A.id, teacherId: teacher1.id, text: "Kinematics test closes Friday 6:00 PM sharp. One attempt.", days: -3 },
    { batchId: batch11A.id, teacherId: teacher1.id, text: "Extra doubt session Sunday 11:00 AM for anyone who wants it.", days: -5 },
    { batchId: batch11B.id, teacherId: teacher1.id, text: "Revise IUPAC naming before the next class.", days: -2 },
    { batchId: batch11C.id, teacherId: teacher2.id, text: "Carry your data books — we start numericals on entropy.", days: -2 },
    { batchId: batch12A.id, teacherId: teacher2.id, text: "Board exam mock schedule goes up next week.", days: -4 },
  ];
  for (const n of notices) {
    await prisma.notice.create({
      data: {
        batchId: n.batchId,
        teacherId: n.teacherId,
        text: n.text,
        createdAt: at(n.days, 9),
      },
    });
  }

  // ── Notes (2 per batch) ─────────────────────────────────────────────────
  const noteSeeds = [
    // 11th-A
    { batchId: batch11A.id, title: "Quadratic Equations", subject: "Mathematics", content: "# Quadratic Equations\n\nForm: **ax² + bx + c = 0**\n\nFormula: x = (-b ± √(b² - 4ac)) / 2a\n\nDiscriminant determines root nature:\n- D > 0 → two real roots\n- D = 0 → one repeated root\n- D < 0 → complex roots" },
    { batchId: batch11A.id, title: "Sets and Relations", subject: "Mathematics", content: "# Sets and Relations\n\n- **Union:** A ∪ B\n- **Intersection:** A ∩ B\n- **Complement:** A'\n\nRelations: reflexive, symmetric, transitive." },
    { batchId: batch11A.id, title: "Newton's laws — worked problems", subject: "Physics", content: "# Newton's Laws — Worked Problems\n\n1. Block on incline with friction\n2. Atwood machine\n3. Connected bodies on a table\n\nAlways draw the free-body diagram first." },
    { batchId: batch11A.id, title: "Vectors: resolution & components", subject: "Physics", content: "# Vectors\n\n- Resolution into components: Fx = F cos θ, Fy = F sin θ\n- Unit vectors î, ĵ, k̂\n- Dot and cross products." },
    { batchId: batch11A.id, title: "Formula sheet: Kinematics", subject: "Physics", content: "# Kinematics Formula Sheet\n\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as" },
    // 11th-B
    { batchId: batch11B.id, title: "Chemical Bonding", subject: "Chemistry", content: "# Chemical Bonding\n\nTypes: ionic, covalent, metallic, hydrogen.\n\nVSEPR theory predicts molecular geometry.\nHybridization: sp, sp², sp³." },
    { batchId: batch11B.id, title: "Periodic Table Trends", subject: "Chemistry", content: "# Periodic Table Trends\n\n- Atomic radius ↓ across period, ↑ down group\n- Ionization energy ↑ across period, ↓ down group\n- Electronegativity ↑ across period, ↓ down group" },
    // 11th-C
    { batchId: batch11C.id, title: "Laws of Thermodynamics", subject: "Physics", content: "# Laws of Thermodynamics\n\n1. Energy cannot be created or destroyed.\n2. Entropy of an isolated system always increases.\n3. Entropy approaches zero as temperature approaches absolute zero." },
    { batchId: batch11C.id, title: "Kinetic Theory of Gases", subject: "Physics", content: "# Kinetic Theory of Gases\n\n- PV = nRT (ideal gas law)\n- Average KE = (3/2)kT\n- Assumptions: elastic collisions, negligible volume, no intermolecular forces." },
    // 12th-A
    { batchId: batch12A.id, title: "Electrostatics", subject: "Physics", content: "# Electrostatics\n\nCoulomb's Law: F = kq₁q₂/r²\n\nElectric field E = F/q₀\nElectric potential V = kQ/r\n\nGauss's Law: ∮E·dA = Q/ε₀" },
    { batchId: batch12A.id, title: "Matrices and Determinants", subject: "Mathematics", content: "# Matrices and Determinants\n\n- Matrix multiplication is not commutative.\n- det(AB) = det(A)·det(B)\n- Inverse exists iff det ≠ 0\n- Cramer's rule for solving linear systems." },
  ];

  for (const n of noteSeeds) {
    await prisma.note.create({ data: n });
  }

  // ── Tests + Questions + Attempts ────────────────────────────────────────
  // Each batch gets graded (inactive, fully attempted) tests plus one open
  // test with a close time — so results, ranks, and the "open test" state all
  // have real data.
  type Q = { question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; marks: number };
  const bank: Record<string, Q[]> = {
    algebra: [
      { question: "Solve: 2x + 4 = 10", optionA: "2", optionB: "3", optionC: "4", optionD: "5", correctOption: "B", marks: 2 },
      { question: "Discriminant of x² - 4x + 4 = 0?", optionA: "0", optionB: "4", optionC: "-4", optionD: "16", correctOption: "A", marks: 2 },
      { question: "Simplify: (x+2)(x-2)", optionA: "x²-4", optionB: "x²+4", optionC: "x²-2x-4", optionD: "x²+2x-4", correctOption: "A", marks: 3 },
      { question: "If f(x)=3x-1, what is f(2)?", optionA: "4", optionB: "5", optionC: "6", optionD: "7", correctOption: "B", marks: 3 },
    ],
    vectors: [
      { question: "Magnitude of î + ĵ?", optionA: "1", optionB: "√2", optionC: "2", optionD: "√3", correctOption: "B", marks: 2 },
      { question: "Dot product of perpendicular vectors?", optionA: "1", optionB: "0", optionC: "-1", optionD: "Undefined", correctOption: "B", marks: 2 },
      { question: "A·B = |A||B|cosθ — θ between?", optionA: "Components", optionB: "The vectors", optionC: "Axes", optionD: "Planes", correctOption: "B", marks: 3 },
      { question: "Cross product of parallel vectors?", optionA: "Maximum", optionB: "Zero vector", optionC: "Unit vector", optionD: "Scalar", correctOption: "B", marks: 3 },
    ],
    laws: [
      { question: "Newton's first law is about?", optionA: "Force", optionB: "Inertia", optionC: "Action-reaction", optionD: "Momentum", correctOption: "B", marks: 2 },
      { question: "F = ma is Newton's ___ law?", optionA: "First", optionB: "Second", optionC: "Third", optionD: "Zeroth", correctOption: "B", marks: 2 },
      { question: "SI unit of force?", optionA: "Joule", optionB: "Newton", optionC: "Watt", optionD: "Pascal", correctOption: "B", marks: 3 },
      { question: "Friction force on a rolling wheel's contact point does?", optionA: "Positive work", optionB: "No work", optionC: "Negative work", optionD: "Infinite work", correctOption: "B", marks: 3 },
    ],
    kinematics: [
      { question: "Slope of a v–t graph gives?", optionA: "Displacement", optionB: "Acceleration", optionC: "Jerk", optionD: "Speed", correctOption: "B", marks: 2 },
      { question: "Area under a v–t graph gives?", optionA: "Acceleration", optionB: "Displacement", optionC: "Force", optionD: "Momentum", correctOption: "B", marks: 2 },
      { question: "v² = u² + 2as assumes?", optionA: "Variable a", optionB: "Constant a", optionC: "Zero a", optionD: "Circular path", correctOption: "B", marks: 3 },
      { question: "Projectile time of flight doubles when?", optionA: "u doubles (same θ)", optionB: "θ doubles", optionC: "g doubles", optionD: "Mass doubles", correctOption: "A", marks: 3 },
    ],
    chemistry: [
      { question: "Which bond is strongest?", optionA: "Ionic", optionB: "Covalent", optionC: "Hydrogen", optionD: "Van der Waals", correctOption: "B", marks: 2 },
      { question: "Hybridization of CH₄?", optionA: "sp", optionB: "sp²", optionC: "sp³", optionD: "sp³d", correctOption: "C", marks: 2 },
      { question: "VSEPR shape of BF₃?", optionA: "Linear", optionB: "Trigonal planar", optionC: "Tetrahedral", optionD: "Bent", correctOption: "B", marks: 3 },
      { question: "Which is a polar molecule?", optionA: "CO₂", optionB: "BF₃", optionC: "H₂O", optionD: "CH₄", correctOption: "C", marks: 3 },
    ],
    thermo: [
      { question: "First law of thermodynamics is about?", optionA: "Entropy", optionB: "Energy conservation", optionC: "Absolute zero", optionD: "Heat death", correctOption: "B", marks: 2 },
      { question: "SI unit of entropy?", optionA: "J/K", optionB: "J·K", optionC: "K/J", optionD: "W/K", correctOption: "A", marks: 2 },
      { question: "Isothermal process: which is constant?", optionA: "Pressure", optionB: "Volume", optionC: "Temperature", optionD: "Entropy", correctOption: "C", marks: 3 },
      { question: "Carnot efficiency depends on?", optionA: "Working substance", optionB: "Reservoir temperatures", optionC: "Pressure only", optionD: "Volume only", correctOption: "B", marks: 3 },
    ],
    electro: [
      { question: "Coulomb's law force is proportional to?", optionA: "r", optionB: "1/r", optionC: "1/r²", optionD: "r²", correctOption: "C", marks: 2 },
      { question: "Electric field inside a conductor?", optionA: "Maximum", optionB: "Zero", optionC: "Infinite", optionD: "Depends on shape", correctOption: "B", marks: 2 },
      { question: "Unit of electric potential?", optionA: "N/C", optionB: "V", optionC: "C", optionD: "J", correctOption: "B", marks: 3 },
      { question: "Gauss's law relates flux to?", optionA: "Magnetic field", optionB: "Enclosed charge", optionC: "Current", optionD: "Resistance", correctOption: "B", marks: 3 },
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
  }) {
    const test = await prisma.test.create({
      data: {
        batchId: opts.batchId,
        title: opts.title,
        subject: opts.subject,
        isActive: opts.isActive,
        closesAt: opts.closesAt,
        createdAt: at(-opts.createdDaysAgo, 9),
      },
    });
    for (let i = 0; i < opts.questions.length; i++) {
      await prisma.question.create({
        data: { ...opts.questions[i], testId: test.id, order: i + 1 },
      });
    }
    return test;
  }

  /** Record an attempt scoring `correct` of the test's questions (first `correct` right). */
  async function attempt(testId: string, studentId: string, batchId: string, correct: number, daysAgo: number) {
    const questions = await prisma.question.findMany({ where: { testId }, orderBy: { order: "asc" } });
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

  // 11th-A: three graded tests + one open test closing in 3 days.
  const graded11A = [
    { title: "Vectors Quiz", subject: "Physics", qs: bank.vectors, daysAgo: 8, scores: [3, 4, 2, 4, 1] },
    { title: "Laws of Motion", subject: "Physics", qs: bank.laws, daysAgo: 15, scores: [2, 3, 3, 1, 4] },
    { title: "Units & Measurement", subject: "Physics", qs: bank.algebra, daysAgo: 25, scores: [4, 2, 3, 3, 2] },
  ];
  for (const g of graded11A) {
    const t = await createTest({
      batchId: batch11A.id,
      title: g.title,
      subject: g.subject,
      questions: g.qs,
      isActive: false,
      createdDaysAgo: g.daysAgo + 2,
    });
    const students = byBatch[batch11A.id];
    for (let i = 0; i < students.length; i++) {
      await attempt(t.id, students[i].studentId, batch11A.id, g.scores[i % g.scores.length], g.daysAgo);
    }
  }
  await createTest({
    batchId: batch11A.id,
    title: "Kinematics Unit Test",
    subject: "Physics",
    questions: bank.kinematics,
    isActive: true,
    closesAt: at(3, 18),
    createdDaysAgo: 1,
  });

  // Other batches: one graded + one open test each.
  const otherTests = [
    { batchId: batch11B.id, graded: { title: "Periodic Trends Quiz", qs: bank.chemistry, subject: "Chemistry" }, open: { title: "Chemical Bonding Quiz", qs: bank.chemistry, subject: "Chemistry" } },
    { batchId: batch11C.id, graded: { title: "Heat & Work Quiz", qs: bank.thermo, subject: "Physics" }, open: { title: "Thermodynamics Quiz", qs: bank.thermo, subject: "Physics" } },
    { batchId: batch12A.id, graded: { title: "Field & Potential Quiz", qs: bank.electro, subject: "Physics" }, open: { title: "Electrostatics Quiz", qs: bank.electro, subject: "Physics" } },
  ];
  for (const o of otherTests) {
    const t = await createTest({
      batchId: o.batchId,
      title: o.graded.title,
      subject: o.graded.subject,
      questions: o.graded.qs,
      isActive: false,
      createdDaysAgo: 12,
    });
    const students = byBatch[o.batchId];
    for (let i = 0; i < students.length; i++) {
      await attempt(t.id, students[i].studentId, o.batchId, (i % 4) + 1, 10);
    }
    await createTest({
      batchId: o.batchId,
      title: o.open.title,
      subject: o.open.subject,
      questions: o.open.qs,
      isActive: true,
      closesAt: at(5, 18),
      createdDaysAgo: 1,
    });
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("✅ Seed completed successfully.\n");

  const allBatches = await prisma.batch.findMany({
    include: {
      teacher: { select: { email: true, name: true } },
      enrollments: { include: { student: { select: { email: true, name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│  Super-admins                                           │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  owner1@opengrapes.com / Gr@pes!Own3r1                 │");
  console.log("│  owner2@opengrapes.com / Gr@pes!Own3r2                 │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  Teachers                                               │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  teacher1@opengrapes.com / teacher1pass                │");
  console.log("│  teacher2@opengrapes.com / teacher2pass                │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  Students (all)              … / student123            │");
  console.log("└─────────────────────────────────────────────────────────┘\n");

  for (const b of allBatches) {
    console.log(`📦 ${b.name}  (joinCode: ${b.joinCode})  — teacher: ${b.teacher.email}`);
    for (const e of b.enrollments) {
      console.log(`   └─ ${e.student.email}  (${e.student.name})`);
  // Demo pair: "teacher" / 1234 (Mr. Deshpande) and "student" / 1234 (Ishaan,
  // already enrolled in his 12th-A). Bare usernames resolve in lib/auth.ts.
  await prisma.user.update({
    where: { email: "ishaan@test.com" },
    data: { password: await bcrypt.hash("1234", 10) },
  });
  console.log('Demo logins: "teacher" / 1234 and "student" / 1234 (same batch: 12th-A)');

    }
    console.log();
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
