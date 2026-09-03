/** Initials for the plum-sphere avatar — shared by Sidebar and ProfileDrawer. */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

/** The plum sphere: shared inline background for avatar / logo discs. */
export const plumSphere = {
  background: "radial-gradient(circle at 30% 28%, var(--plum-300), var(--plum-700) 78%)",
} as const;
