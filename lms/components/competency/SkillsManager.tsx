"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createSkillAction, deleteSkillAction } from "@/app/platform/skills/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { SKILL_CATEGORIES } from "@/lib/taxonomy";

type Skill = { id: string; name: string; category: string; description: string | null };

export function SkillsManager({ skills }: { skills: Skill[] }) {
  const [state, formAction, pending] = useActionState(createSkillAction, initialActionState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state?.success) toast.success("Skill added");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  const byCategory = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    items: skills.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <form action={formAction} className="grid gap-3 rounded-2xl border border-hair bg-paper p-5 sm:grid-cols-2">
        <FormField label="Skill name" htmlFor="skill-name" error={state?.fieldErrors?.name?.[0]}>
          <Input id="skill-name" name="name" placeholder="e.g. Radar Velocity De-aliasing" required />
        </FormField>
        <FormField label="Category" htmlFor="skill-category" error={state?.fieldErrors?.category?.[0]}>
          <Select id="skill-category" name="category" defaultValue={SKILL_CATEGORIES[0]}>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Description" htmlFor="skill-desc">
            <Textarea id="skill-desc" name="description" rows={2} />
          </FormField>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" loading={pending}>
            Add skill
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {byCategory.map((g) => (
          <div key={g.category}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {g.category}
            </p>
            <ul className="divide-y divide-hair rounded-2xl border border-hair bg-paper">
              {g.items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{s.name}</p>
                    {s.description && <p className="truncate text-xs text-ink-500">{s.description}</p>}
                  </div>
                  <button
                    disabled={deleting}
                    onClick={() =>
                      startDelete(async () => {
                        const res = await deleteSkillAction(s.id);
                        if (res?.error) toast.error(res.error);
                      })
                    }
                    className="shrink-0 rounded-full p-1.5 text-ink-300 hover:bg-sunken hover:text-status-unpaid"
                    aria-label="Delete skill"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
