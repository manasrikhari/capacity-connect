"use client";

import { useState, useTransition } from "react";
import { Check, X, Users } from "lucide-react";
import toast from "react-hot-toast";
import { saveAttendance } from "@/app/admin/meetings/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "ABSENT";

export type RosterStudent = { id: string; name: string | null; email: string };
export type ExistingAttendance = { studentId: string; status: AttendanceStatus };

export function AttendanceManager({
  meetingId,
  students,
  existing,
  onSaved,
}: {
  meetingId: string;
  students: RosterStudent[];
  existing: ExistingAttendance[];
  onSaved?: () => void;
}) {
  const existingMap = new Map(existing.map((r) => [r.studentId, r.status]));

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(
      students.map((s) => [s.id, existingMap.get(s.id) ?? "PRESENT"])
    )
  );
  const [saving, startTransition] = useTransition();

  function setStatus(studentId: string, status: AttendanceStatus) {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    setMarks(Object.fromEntries(students.map((s) => [s.id, "PRESENT" as const])));
  }

  function handleSave() {
    startTransition(async () => {
      const records = students.map((s) => ({
        studentId: s.id,
        status: marks[s.id] ?? "PRESENT",
      }));
      const result = await saveAttendance(meetingId, records);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Attendance saved");
      onSaved?.();
    });
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students to mark"
        description="No approved students are enrolled in this batch yet."
      />
    );
  }

  const presentCount = students.filter((s) => marks[s.id] === "PRESENT").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {presentCount}/{students.length} present
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={markAllPresent}>
          Mark all present
        </Button>
      </div>

      <ul className="divide-y divide-hair rounded-2xl border border-hair bg-paper">
        {students.map((s) => {
          const status = marks[s.id] ?? "PRESENT";
          return (
            <li key={s.id} className="flex items-center justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {s.name ?? "Unnamed student"}
                </p>
                <p className="truncate font-mono text-[11px] text-ink-300">{s.email}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-[10px] bg-sunken p-1">
                <button
                  type="button"
                  onClick={() => setStatus(s.id, "PRESENT")}
                  aria-pressed={status === "PRESENT"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    status === "PRESENT"
                      ? "bg-sage-100 text-sage-700"
                      : "text-ink-500 hover:text-ink-700"
                  )}
                >
                  <Check className="size-3.5" />
                  Present
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(s.id, "ABSENT")}
                  aria-pressed={status === "ABSENT"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    status === "ABSENT"
                      ? "bg-status-unpaid/12 text-status-unpaid"
                      : "text-ink-500 hover:text-ink-700"
                  )}
                >
                  <X className="size-3.5" />
                  Absent
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} loading={saving}>
          Save attendance
        </Button>
      </div>
    </div>
  );
}
