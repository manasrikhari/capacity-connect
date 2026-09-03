import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Qualification } from "@/lib/validations/profile";

export type ProfileSummaryData = {
  name: string;
  designation: string;
  department: string;
  organisation: string;
  postingLocation: string;
  bio: string;
  yearsExperience: number;
  interests: string[];
  qualifications: Qualification[];
  governmentIdType: string;
  governmentIdNum: string;
};

/** Mask a government ID down to its last four characters. */
function maskId(num: string): string {
  const trimmed = num.trim();
  if (!trimmed) return "";
  const last4 = trimmed.slice(-4);
  return `•••• ${last4}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{label}</span>
      <span className="text-sm text-ink-900">{value || "—"}</span>
    </div>
  );
}

export function ProfileSummary({ profile }: { profile: ProfileSummaryData }) {
  const maskedId = maskId(profile.governmentIdNum);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.name || "Your profile"}</CardTitle>
        {profile.designation && <Badge color="violet">{profile.designation}</Badge>}
      </CardHeader>

      {profile.bio && <p className="mb-5 text-sm text-ink-700">{profile.bio}</p>}

      {/* Identity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Department" value={profile.department} />
        <Row label="Organisation" value={profile.organisation} />
        <Row label="Posting" value={profile.postingLocation} />
        <Row label="Experience" value={`${profile.yearsExperience} yrs`} />
        <Row
          label="Government ID"
          value={
            maskedId
              ? `${profile.governmentIdType ? `${profile.governmentIdType} · ` : ""}${maskedId}`
              : ""
          }
        />
      </div>

      {/* Qualifications */}
      <div className="mt-5 border-t border-hair pt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          Qualifications
        </p>
        {profile.qualifications.length === 0 ? (
          <p className="text-sm text-ink-500">No qualifications listed.</p>
        ) : (
          <ul className="space-y-1.5">
            {profile.qualifications.map((q, i) => (
              <li key={`${q.degree}-${i}`} className="text-sm text-ink-700">
                <span className="text-ink-900">{q.degree}</span>
                {q.institution && <span className="text-ink-500"> · {q.institution}</span>}
                {q.year != null && (
                  <span className="font-mono text-xs tabular-nums text-ink-500"> · {q.year}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Interests */}
      {profile.interests.length > 0 && (
        <div className="mt-5 border-t border-hair pt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            Interests
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((tag) => (
              <Badge key={tag} color="slate">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
