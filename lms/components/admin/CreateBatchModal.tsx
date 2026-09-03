"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createBatchAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";
import { DOMAINS, LEVELS, DEPARTMENTS, WMO_TIERS } from "@/lib/taxonomy";

export function CreateBatchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createBatchAction,
    initialActionState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (open) formRef.current?.reset();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Create a new course">
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Course name" htmlFor="batch-name" error={state?.fieldErrors?.name?.[0]}>
          <Input
            id="batch-name"
            name="name"
            placeholder='e.g. "Doppler Weather Radar Calibration"'
            required
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Domain" htmlFor="batch-subject" error={state?.fieldErrors?.subject?.[0]}>
            <Select id="batch-subject" name="subject" defaultValue={DOMAINS[0]}>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Level" htmlFor="batch-grade">
            <Select id="batch-grade" name="grade" defaultValue="">
              <option value="">—</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Description" htmlFor="batch-description">
          <Textarea
            id="batch-description"
            name="description"
            rows={2}
            placeholder="One or two lines about the course."
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Department" htmlFor="batch-department">
            <Select id="batch-department" name="department" defaultValue="">
              <option value="">—</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="WMO tier" htmlFor="batch-wmoTier">
            <Select id="batch-wmoTier" name="wmoTier" defaultValue="">
              <option value="">—</option>
              {WMO_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date" htmlFor="batch-startDate">
            <Input id="batch-startDate" name="startDate" type="date" />
          </FormField>
          <FormField label="End date" htmlFor="batch-endDate">
            <Input id="batch-endDate" name="endDate" type="date" />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Create course
          </Button>
        </div>
      </form>
    </Modal>
  );
}
