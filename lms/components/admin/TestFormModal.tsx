"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createTest, listAllSkills, updateTest } from "@/app/admin/tests/actions";
import type { Test } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";
import { toDatetimeLocalValue } from "@/lib/utils";

export function TestFormModal({
  open,
  onClose,
  test,
}: {
  open: boolean;
  onClose: () => void;
  test?: Test | null;
}) {
  const action = test ? updateTest.bind(null, test.id) : createTest;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);

  // Skills are loaded lazily so this modal stays self-contained wherever it is
  // rendered (the detail manager mounts it without a skills prop).
  useEffect(() => {
    if (!open) return;
    let active = true;
    listAllSkills()
      .then((rows) => {
        if (active) setSkills(rows);
      })
      .catch(() => {
        /* non-fatal: the skill select simply stays empty */
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      toast.success("Test updated");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open={open} onClose={onClose} title={test ? "Edit test" : "Create test"}>
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
          <Input id="title" name="title" defaultValue={test?.title} placeholder="e.g. Algebra Basics Quiz" />
        </FormField>
        <FormField label="Subject" htmlFor="subject" error={state?.fieldErrors?.subject?.[0]}>
          <Input id="subject" name="subject" defaultValue={test?.subject} placeholder="e.g. Mathematics" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Duration (min)"
            htmlFor="durationMins"
            error={state?.fieldErrors?.durationMins?.[0]}
          >
            <Input
              id="durationMins"
              name="durationMins"
              type="number"
              min={5}
              max={180}
              defaultValue={test?.durationMins ?? ""}
              placeholder="Untimed"
            />
          </FormField>
          <FormField
            label="Pass %"
            htmlFor="passPercent"
            error={state?.fieldErrors?.passPercent?.[0]}
          >
            <Input
              id="passPercent"
              name="passPercent"
              type="number"
              min={1}
              max={100}
              defaultValue={test?.passPercent ?? 50}
            />
          </FormField>
        </div>
        <FormField label="Competency (optional)" htmlFor="skillId" error={state?.fieldErrors?.skillId?.[0]}>
          <Select id="skillId" name="skillId" defaultValue={test?.skillId ?? ""}>
            <option value="">No competency</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-ink-300">
            Passing this test updates the trainee&apos;s proficiency in this competency.
          </p>
        </FormField>
        <FormField
          label="Closes at (optional)"
          htmlFor="closesAt"
          error={state?.fieldErrors?.closesAt?.[0]}
        >
          <Input
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            defaultValue={test?.closesAt ? toDatetimeLocalValue(test.closesAt) : ""}
          />
          <p className="mt-1 text-xs text-ink-300">
            Leave empty to keep the test open until you deactivate it.
          </p>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {test ? "Save changes" : "Create test"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
