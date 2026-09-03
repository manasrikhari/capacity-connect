"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  generateQuestionsAction,
  type GenerateQuestionsState,
} from "@/app/actions/assessment-generator";
import { GeneratedQuestionsPreview } from "@/components/admin/GeneratedQuestionsPreview";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";

const initial: GenerateQuestionsState = null;

export function GenerateQuestionsForm({ testId }: { testId: string }) {
  const [state, formAction, pending] = useActionState(generateQuestionsAction, initial);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-6">
      <Card>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="testId" value={testId} />

          <FormField label="Topic" htmlFor="topic" error={state?.fieldErrors?.topic?.[0]}>
            <Input
              id="topic"
              name="topic"
              placeholder="e.g. Doppler weather radar principles"
              defaultValue=""
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="How many" htmlFor="count" error={state?.fieldErrors?.count?.[0]}>
              <Input id="count" name="count" type="number" min={5} max={20} defaultValue={5} />
            </FormField>
            <FormField
              label="Difficulty mix"
              htmlFor="difficultyMix"
              error={state?.fieldErrors?.difficultyMix?.[0]}
            >
              <Select id="difficultyMix" name="difficultyMix" defaultValue="balanced">
                <option value="balanced">Balanced</option>
                <option value="easy">Mostly easy</option>
                <option value="hard">Mostly hard</option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Syllabus or notes (optional)"
            htmlFor="sourceText"
            error={state?.fieldErrors?.sourceText?.[0]}
          >
            <Textarea
              id="sourceText"
              name="sourceText"
              placeholder="Paste any source material the questions should be based on."
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="useNotes" className="accent-plum-600" />
            Use this course&apos;s notes as source material
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              <Sparkles className="size-4" /> Generate
            </Button>
          </div>
        </form>
      </Card>

      {state?.data && (
        <GeneratedQuestionsPreview
          key={`${state.data.source}-${state.data.questions.length}`}
          testId={state.data.testId}
          source={state.data.source}
          questions={state.data.questions}
        />
      )}
    </div>
  );
}
