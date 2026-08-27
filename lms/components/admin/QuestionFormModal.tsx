"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { addQuestion, updateQuestion } from "@/app/admin/tests/actions";
import type { Question } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";

export function QuestionFormModal({
  open,
  onClose,
  testId,
  question,
}: {
  open: boolean;
  onClose: () => void;
  testId: string;
  question?: Question | null;
}) {
  const action = question ? updateQuestion.bind(null, question.id) : addQuestion.bind(null, testId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(question ? "Question updated" : "Question added");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={question ? "Edit question" : "Add question"}
      className="max-w-xl"
    >
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Question" htmlFor="question" error={state?.fieldErrors?.question?.[0]}>
          <Textarea
            id="question"
            name="question"
            defaultValue={question?.question}
            placeholder="Enter the question text"
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Option A" htmlFor="optionA" error={state?.fieldErrors?.optionA?.[0]}>
            <Input id="optionA" name="optionA" defaultValue={question?.optionA} />
          </FormField>
          <FormField label="Option B" htmlFor="optionB" error={state?.fieldErrors?.optionB?.[0]}>
            <Input id="optionB" name="optionB" defaultValue={question?.optionB} />
          </FormField>
          <FormField label="Option C" htmlFor="optionC" error={state?.fieldErrors?.optionC?.[0]}>
            <Input id="optionC" name="optionC" defaultValue={question?.optionC} />
          </FormField>
          <FormField label="Option D" htmlFor="optionD" error={state?.fieldErrors?.optionD?.[0]}>
            <Input id="optionD" name="optionD" defaultValue={question?.optionD} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Correct option"
            htmlFor="correctOption"
            error={state?.fieldErrors?.correctOption?.[0]}
          >
            <Select id="correctOption" name="correctOption" defaultValue={question?.correctOption ?? "A"}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </Select>
          </FormField>
          <FormField label="Marks" htmlFor="marks" error={state?.fieldErrors?.marks?.[0]}>
            <Input id="marks" name="marks" type="number" min={1} max={100} defaultValue={question?.marks ?? 1} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {question ? "Save changes" : "Add question"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
