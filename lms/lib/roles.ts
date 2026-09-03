import type { Role } from "@/app/generated/prisma/enums";

// Capacity Connect keeps the Role enum values unchanged and maps them to
// MoES/IMD-facing labels here. SUPER_ADMIN = platform Admin (MoES),
// ADMIN = Trainer (IMD, owns courses), STUDENT = Trainee.
export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Admin",
  ADMIN: "Trainer",
  STUDENT: "Trainee",
};

export const ROLE_LABEL_PLURAL: Record<Role, string> = {
  SUPER_ADMIN: "Admins",
  ADMIN: "Trainers",
  STUDENT: "Trainees",
};

// Badge component's legacy color keys.
export const ROLE_BADGE_COLOR: Record<Role, "amber" | "violet" | "blue"> = {
  SUPER_ADMIN: "amber",
  ADMIN: "violet",
  STUDENT: "blue",
};

export function roleLabel(role: Role | string | undefined, plural = false) {
  const table = plural ? ROLE_LABEL_PLURAL : ROLE_LABEL;
  return (role && table[role as Role]) ?? (plural ? "Users" : "User");
}

export const isPlatformAdmin = (r?: string) => r === "SUPER_ADMIN";
export const isTrainer = (r?: string) => r === "ADMIN";
export const isTrainee = (r?: string) => r === "STUDENT";

export const NOUN = {
  course: "Course",
  courses: "Courses",
  trainee: "Trainee",
  trainees: "Trainees",
  trainer: "Trainer",
  level: "Level",
  domain: "Domain",
} as const;

export const ROLE_DESCRIPTION: Record<Role, string> = {
  SUPER_ADMIN: "Approve trainers, map competencies, publish announcements, and track national capacity metrics.",
  ADMIN: "Build courses and assessments, upload resources, and monitor trainee progress.",
  STUDENT: "Enrol in courses, attempt assessments, track competencies, and earn verifiable certificates.",
};
