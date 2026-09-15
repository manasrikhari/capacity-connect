"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  deleteTrainerSkillAction,
  upsertTrainerSkillAction,
} from "@/app/admin/competency/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

type SkillOption = { id: string; name: string };
type MySkill = {
  id: string;
  skillId: string;
  skillName: string;
  proficiency: number;
  yearsExperience: number;
  isVerified: boolean;
};

export function TrainerSkillsEditor({
  skills,
  mySkills,
}: {
  skills: SkillOption[];
  mySkills: MySkill[];
}) {
  const [state, formAction, pending] = useActionState(upsertTrainerSkillAction, initialActionState);
  const [deleting, startDelete] = useTransition();
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");

  useEffect(() => {
    if (state?.success) toast.success("Skill saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-4">
      {mySkills.length === 0 ? (
        <p className="text-sm text-ink-500">You haven&apos;t declared any skills yet.</p>
      ) : (
        <ul className="divide-y divide-hair">
          {mySkills.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-700">{s.skillName}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                  level {s.proficiency}/5 · {s.yearsExperience} yr
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {s.isVerified && <Badge color="green">Verified</Badge>}
                <button
                  disabled={deleting}
                  onClick={() =>
                    startDelete(async () => {
                      const res = await deleteTrainerSkillAction(s.id);
                      if (res?.error) toast.error(res.error);
                    })
                  }
                  className="rounded-full p-1.5 text-ink-300 hover:bg-sunken hover:text-status-unpaid"
                  aria-label="Remove skill"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-2 border-t border-hair pt-4">
        <label className="flex-1 text-xs text-ink-500">
          Skill
          <Select name="skillId" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs text-ink-500">
          Level
          <Select name="proficiency" defaultValue="3" className="w-20">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs text-ink-500">
          Years
          <input
            name="yearsExperience"
            type="number"
            min="0"
            max="50"
            defaultValue="1"
            className="w-20 rounded-[10px] border border-hair bg-paper px-2 py-2 text-sm"
          />
        </label>
        <Button type="submit" loading={pending}>
          Save
        </Button>
      </form>
      <p className="text-xs text-ink-300">
        Verification is granted by the MoES administrator.
      </p>
    </div>
  );
}
