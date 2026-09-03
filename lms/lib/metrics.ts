export type MetricsRows = {
  attendance: { status: "PRESENT" | "ABSENT"; count: number }[];
  approvedEnrollments: number;
  certifiedTrainees: number;
  attempts: { score: number; totalMarks: number }[];
  departments: { department: string; trainees: number; certified: number }[];
  domains: { domain: string; trainees: number; batches: number }[];
};

export type CapacityMetrics = {
  attendancePercent: number | null;
  completionPercent: number | null;
  certifiedCount: number;
  passRatePercent: number | null;
  totals: { attendanceMarks: number; enrollments: number; attempts: number };
  byDepartment: {
    department: string;
    trainees: number;
    certified: number;
    completionPercent: number | null;
  }[];
  byDomain: { domain: string; trainees: number; batches: number }[];
};

/** Round to one decimal place, guarding against NaN denominators. */
function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function computeCapacityMetrics(rows: MetricsRows): CapacityMetrics {
  const present = rows.attendance
    .filter((a) => a.status === "PRESENT")
    .reduce((sum, a) => sum + a.count, 0);
  const absent = rows.attendance
    .filter((a) => a.status === "ABSENT")
    .reduce((sum, a) => sum + a.count, 0);
  const attendanceMarks = present + absent;

  const passed = rows.attempts.filter(
    (a) => a.totalMarks > 0 && a.score / a.totalMarks >= 0.5
  ).length;

  const byDepartment = rows.departments
    .map((d) => ({
      department: d.department,
      trainees: d.trainees,
      certified: d.certified,
      completionPercent: pct(d.certified, d.trainees),
    }))
    .sort((a, b) => b.trainees - a.trainees);

  const byDomain = [...rows.domains].sort((a, b) => b.trainees - a.trainees);

  return {
    attendancePercent: pct(present, attendanceMarks),
    completionPercent: pct(rows.certifiedTrainees, rows.approvedEnrollments),
    certifiedCount: rows.certifiedTrainees,
    passRatePercent: pct(passed, rows.attempts.length),
    totals: {
      attendanceMarks,
      enrollments: rows.approvedEnrollments,
      attempts: rows.attempts.length,
    },
    byDepartment,
    byDomain,
  };
}
