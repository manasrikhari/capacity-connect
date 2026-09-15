"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { upsertTraineeSkillAction } from "@/app/student/competency/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

export function DeclareSkillForm({ skills }: { skills: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(upsertTraineeSkillAction, initialActionState);

  useEffect(() => {
    if (state?.success) toast.success("Competency updated");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-ink-500">
        Skill
        <Select name="skillId" defaultValue={skills[0]?.id}>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        Level
        <Select name="proficiency" defaultValue="3" className="w-20">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </label>
      <Button type="submit" loading={pending}>
        Declare
      </Button>
    </form>
  );
}
