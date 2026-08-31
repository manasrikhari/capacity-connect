/* One dataset for all three mocks, so a direction is judged on its layout and
   not on whichever version happened to get richer content. Everything here is
   plausible for a real Physics batch: the same student, teacher, marks, ledger
   and attendance record appear in every variant. */

export const BATCH = {
  subject: "Physics",
  name: "Batch A",
  teacher: "Ms. Iyer",
  student: "Anya Sharma",
  studentShort: "Anya",
  enrolled: 24,
  date: "Saturday, 29 August 2026",
  dateShort: "Saturday, 29 August",
};

export const LIVE = {
  title: "Rotational Motion",
  startedAt: "12:04",
  minutesIn: 42,
  present: 18,
  summary:
    "Ms. Iyer takes the class through torque before angular momentum, with eighteen of twenty-four present.",
  body: [
    "The lesson opened on the right-hand rule and stayed there longer than planned, after a question about whether r is measured to the axis or to the centre of mass. It is the axis.",
    "Angular momentum follows after the break. The ring-and-disc demonstration has moved to Thursday, so bring the lab kit to that session rather than this one.",
    "Torque was worked through twice — once with the wrench example and once on the rolling disc, where the friction force does no work because the contact point is instantaneously at rest.",
  ],
};

export const UPCOMING = [
  { title: "Moment of Inertia", when: "Thursday", time: "4:00 PM", mins: 90, note: "Ring & disc demo" },
  { title: "Revision: Kinematics", when: "Saturday", time: "10:00 AM", mins: 60, note: "Last year's paper" },
  { title: "Doubt session", when: "Sunday", time: "11:00 AM", mins: 45, note: "Optional" },
];

export const TESTS = {
  open: { title: "Kinematics Unit Test", closes: "Friday 6:00 PM", questions: 20 },
  graded: [
    { title: "Vectors Quiz", score: 17, outOf: 20, on: "22 Aug", rank: 6 },
    { title: "Laws of Motion", score: 14, outOf: 20, on: "12 Aug", rank: 11 },
    { title: "Units & Measurement", score: 18, outOf: 20, on: "2 Aug", rank: 3 },
    { title: "Diagnostic", score: 15, outOf: 20, on: "24 Jul", rank: 9 },
  ],
};

export const NOTES = [
  { title: "Rotational Motion", when: "2 hours ago", pages: 6 },
  { title: "Formula sheet: Kinematics", when: "3 days ago", pages: 2 },
  { title: "Lab report brief", when: "6 days ago", pages: 3 },
  { title: "Newton's laws — worked problems", when: "9 days ago", pages: 8 },
  { title: "Vectors: resolution & components", when: "13 days ago", pages: 5 },
];
export const NOTES_TOTAL = 12;

export const FEES = {
  total: 18000,
  paid: 12000,
  due: 6000,
  instalments: [
    { term: "Term 1", amount: 6000, status: "paid" as const, on: "12 Jun 2026", method: "UPI" },
    { term: "Term 2", amount: 6000, status: "paid" as const, on: "14 Jul 2026", method: "UPI" },
    { term: "Term 3", amount: 6000, status: "due" as const, on: "5 Sep 2026", method: "—" },
  ],
};

export const ATTENDANCE = {
  attended: 21,
  total: 24,
  percent: 88,
  missed: [
    { on: "26 Aug", topic: "Circular motion" },
    { on: "19 Aug", topic: "Friction problems" },
    { on: "8 Aug", topic: "Free-body diagrams" },
  ],
  /** Newest last — one mark per class held this term. */
  register: [
    1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
  ] as const,
};

export const NOTICES = [
  { from: "Ms. Iyer", at: "Yesterday", text: "Bring the lab kit on Thursday — ring, disc and the metre scale." },
  { from: "Ms. Iyer", at: "3 days ago", text: "Kinematics test moves to Friday. One attempt, closes 6:00 PM sharp." },
  { from: "Ms. Iyer", at: "5 days ago", text: "Extra doubt session Sunday 11:00 AM for anyone who wants it." },
];

export const DOUBTS = {
  thisMonth: 7,
  recent: [
    { q: "Why is r measured to the axis and not the centre of mass?", on: "Today", answered: true },
    { q: "Does friction do work on a rolling wheel?", on: "26 Aug", answered: true },
    { q: "When can I treat a rod as a point mass?", on: "21 Aug", answered: false },
  ],
};

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
