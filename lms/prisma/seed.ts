import "dotenv/config";
import bcrypt from "bcryptjs";
import { ApprovalStatus, MeetingStatus, Role } from "../app/generated/prisma/enums";
import { prisma } from "../lib/prisma";

async function main() {
  // Wipe all data in FK-safe order (children before parents)
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

  const now = Date.now();
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
      name: "Teacher 1",
      password: await bcrypt.hash("teacher1pass", 10),
      role: Role.ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "teacher2@opengrapes.com",
      name: "Teacher 2",
      password: await bcrypt.hash("teacher2pass", 10),
      role: Role.ADMIN,
      status: ApprovalStatus.APPROVED,
      onboarded: true,
    },
  });

  // ── Batches ─────────────────────────────────────────────────────────────
  const batch11A = await prisma.batch.create({
    data: { name: "11th-A", grade: "11th", teacherId: teacher1.id, joinCode: "AAAA-2222" },
  });
  const batch11B = await prisma.batch.create({
    data: { name: "11th-B", grade: "11th", teacherId: teacher1.id, joinCode: "BBBB-3333" },
  });
  const batch11C = await prisma.batch.create({
    data: { name: "11th-C", grade: "11th", teacherId: teacher2.id, joinCode: "CCCC-4444" },
  });
  const batch12A = await prisma.batch.create({
    data: { name: "12th-A", grade: "12th", teacherId: teacher2.id, joinCode: "DDDD-5555" },
  });

  // ── Students ────────────────────────────────────────────────────────────
  async function createStudent(email: string, name: string) {
    return prisma.user.create({
      data: {
        email,
        name,
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
  const enrollments: { studentId: string; batchId: string }[] = [
    // 11th-A
    { studentId: aarav.id, batchId: batch11A.id },
    { studentId: diya.id, batchId: batch11A.id },
    { studentId: rohan.id, batchId: batch11A.id },
    { studentId: riya.id, batchId: batch11A.id },
    { studentId: nisha.id, batchId: batch11A.id },
    // 11th-B
    { studentId: sneha.id, batchId: batch11B.id },
    { studentId: vivaan.id, batchId: batch11B.id },
    { studentId: tara.id, batchId: batch11B.id },
    { studentId: karan.id, batchId: batch11B.id },
    // 11th-C
    { studentId: kabir.id, batchId: batch11C.id },
    { studentId: ananya.id, batchId: batch11C.id },
    { studentId: dev.id, batchId: batch11C.id },
    { studentId: riya.id, batchId: batch11C.id },
    // 12th-A
    { studentId: ishaan.id, batchId: batch12A.id },
    { studentId: meera.id, batchId: batch12A.id },
    { studentId: arjun.id, batchId: batch12A.id },
    { studentId: karan.id, batchId: batch12A.id },
    { studentId: nisha.id, batchId: batch12A.id },
  ];

  for (const e of enrollments) {
    await prisma.enrollment.create({
      data: { ...e, status: ApprovalStatus.APPROVED },
    });
  }

  // ── Fees (one per enrollment) ───────────────────────────────────────────
  for (const e of enrollments) {
    await prisma.fee.create({
      data: { studentId: e.studentId, batchId: e.batchId, totalAmount: TOTAL_FEE },
    });
  }

  // ── Meetings (1 upcoming per batch) ─────────────────────────────────────
  const meetingSeeds = [
    { batchId: batch11A.id, title: "Algebra Revision Session", description: "Quadratic equations and factoring techniques.", link: "https://meet.google.com/11a-algebra" },
    { batchId: batch11B.id, title: "Organic Chemistry Basics", description: "Introduction to hydrocarbons and IUPAC naming.", link: "https://meet.google.com/11b-chem" },
    { batchId: batch11C.id, title: "Thermodynamics Overview", description: "First and second laws, enthalpy and entropy.", link: "https://meet.google.com/11c-thermo" },
    { batchId: batch12A.id, title: "Electrostatics Masterclass", description: "Coulomb's law, electric field and potential.", link: "https://meet.google.com/12a-electro" },
  ];

  for (const m of meetingSeeds) {
    await prisma.meeting.create({
      data: { ...m, date: new Date(now + 3 * 24 * 60 * 60 * 1000), status: MeetingStatus.UPCOMING },
    });
  }

  // ── Notes (2 per batch) ─────────────────────────────────────────────────
  const noteSeeds = [
    // 11th-A
    { batchId: batch11A.id, title: "Quadratic Equations", subject: "Mathematics", content: "# Quadratic Equations\n\nForm: **ax² + bx + c = 0**\n\nFormula: x = (-b ± √(b² - 4ac)) / 2a\n\nDiscriminant determines root nature:\n- D > 0 → two real roots\n- D = 0 → one repeated root\n- D < 0 → complex roots" },
    { batchId: batch11A.id, title: "Sets and Relations", subject: "Mathematics", content: "# Sets and Relations\n\n- **Union:** A ∪ B\n- **Intersection:** A ∩ B\n- **Complement:** A'\n\nRelations: reflexive, symmetric, transitive." },
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

  // ── Tests + Questions (1 active test per batch, 4 questions each) ───────
  const testData = [
    {
      batch: batch11A,
      title: "Algebra Basics Quiz",
      subject: "Mathematics",
      questions: [
        { question: "Solve: 2x + 4 = 10", optionA: "2", optionB: "3", optionC: "4", optionD: "5", correctOption: "B", marks: 2 },
        { question: "Discriminant of x² - 4x + 4 = 0?", optionA: "0", optionB: "4", optionC: "-4", optionD: "16", correctOption: "A", marks: 2 },
        { question: "Simplify: (x+2)(x-2)", optionA: "x²-4", optionB: "x²+4", optionC: "x²-2x-4", optionD: "x²+2x-4", correctOption: "A", marks: 3 },
        { question: "If f(x)=3x-1, what is f(2)?", optionA: "4", optionB: "5", optionC: "6", optionD: "7", correctOption: "B", marks: 3 },
      ],
    },
    {
      batch: batch11B,
      title: "Chemical Bonding Quiz",
      subject: "Chemistry",
      questions: [
        { question: "Which bond is strongest?", optionA: "Ionic", optionB: "Covalent", optionC: "Hydrogen", optionD: "Van der Waals", correctOption: "B", marks: 2 },
        { question: "Hybridization of CH₄?", optionA: "sp", optionB: "sp²", optionC: "sp³", optionD: "sp³d", correctOption: "C", marks: 2 },
        { question: "VSEPR shape of BF₃?", optionA: "Linear", optionB: "Trigonal planar", optionC: "Tetrahedral", optionD: "Bent", correctOption: "B", marks: 3 },
        { question: "Which is a polar molecule?", optionA: "CO₂", optionB: "BF₃", optionC: "H₂O", optionD: "CH₄", correctOption: "C", marks: 3 },
      ],
    },
    {
      batch: batch11C,
      title: "Thermodynamics Quiz",
      subject: "Physics",
      questions: [
        { question: "First law of thermodynamics is about?", optionA: "Entropy", optionB: "Energy conservation", optionC: "Absolute zero", optionD: "Heat death", correctOption: "B", marks: 2 },
        { question: "SI unit of entropy?", optionA: "J/K", optionB: "J·K", optionC: "K/J", optionD: "W/K", correctOption: "A", marks: 2 },
        { question: "Isothermal process: which is constant?", optionA: "Pressure", optionB: "Volume", optionC: "Temperature", optionD: "Entropy", correctOption: "C", marks: 3 },
        { question: "Carnot efficiency depends on?", optionA: "Working substance", optionB: "Hot and cold reservoir temps", optionC: "Pressure only", optionD: "Volume only", correctOption: "B", marks: 3 },
      ],
    },
    {
      batch: batch12A,
      title: "Electrostatics Quiz",
      subject: "Physics",
      questions: [
        { question: "Coulomb's law force is proportional to?", optionA: "r", optionB: "1/r", optionC: "1/r²", optionD: "r²", correctOption: "C", marks: 2 },
        { question: "Electric field inside a conductor?", optionA: "Maximum", optionB: "Zero", optionC: "Infinite", optionD: "Depends on shape", correctOption: "B", marks: 2 },
        { question: "Unit of electric potential?", optionA: "N/C", optionB: "V", optionC: "C", optionD: "J", correctOption: "B", marks: 3 },
        { question: "Gauss's law relates flux to?", optionA: "Magnetic field", optionB: "Enclosed charge", optionC: "Current", optionD: "Resistance", correctOption: "B", marks: 3 },
        { question: "Equipotential surfaces are ___ to field lines?", optionA: "Parallel", optionB: "Perpendicular", optionC: "At 45°", optionD: "Tangential", correctOption: "B", marks: 2 },
      ],
    },
  ];

  for (const t of testData) {
    const test = await prisma.test.create({
      data: { batchId: t.batch.id, title: t.title, subject: t.subject, isActive: true },
    });
    for (let i = 0; i < t.questions.length; i++) {
      await prisma.question.create({
        data: { ...t.questions[i], testId: test.id, order: i + 1 },
      });
    }
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
  console.log("└─────────────────────────────────────────────────────────┘\n");

  for (const b of allBatches) {
    console.log(`📦 ${b.name}  (joinCode: ${b.joinCode})  — teacher: ${b.teacher.email}`);
    for (const e of b.enrollments) {
      console.log(`   └─ ${e.student.email}  (${e.student.name})`);
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
