"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { saveRequirementsAction } from "@/app/admin/competency/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

type SkillOption = { id: string; name: string; category: string };
type Row = { skillId: string; minProficiency: number; weight: number; isMandatory: boolean };

export function RequirementsEditor({
  skills,
  initial,
}: {
  skills: SkillOption[];
  initial: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [state, formAction, pending] = useActionState(saveRequirementsAction, initialActionState);

  useEffect(() => {
    if (state?.success) toast.success("Requirements saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  const used = new Set(rows.map((r) => r.skillId));
  const available = skills.filter((s) => !used.has(s.id));

  function addRow() {
    if (available.length === 0) return;
    setRows([...rows, { skillId: available[0].id, minProficiency: 3, weight: 1, isMandatory: true }]);
  }
  function update(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="requirements" value={JSON.stringify(rows)} />

      {rows.length === 0 && (
        <p className="text-sm text-ink-500">No required competencies yet. Add one below.</p>
      )}

      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-[10px] border border-hair bg-paper p-2">
          <Select
            value={r.skillId}
            onChange={(e) => update(i, { skillId: e.target.value })}
            className="min-w-[180px] flex-1"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id} disabled={used.has(s.id) && s.id !== r.skillId}>
                {s.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1 text-xs text-ink-500">
            min
            <Select
              value={r.minProficiency}
              onChange={(e) => update(i, { minProficiency: Number(e.target.value) })}
              className="w-16"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-1 text-xs text-ink-500">
            weight
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={r.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })}
              className="w-16 rounded-[8px] border border-hair bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={r.isMandatory}
              onChange={(e) => update(i, { isMandatory: e.target.checked })}
            />
            mandatory
          </label>
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-full p-1.5 text-ink-300 hover:bg-sunken hover:text-status-unpaid"
            aria-label="Remove"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={addRow} disabled={available.length === 0}>
          <Plus className="size-4" /> Add competency
        </Button>
        <Button type="submit" loading={pending}>
          Save requirements
        </Button>
      </div>
    </form>
  );
}
