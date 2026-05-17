import { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cx, meterClass } from "../lib/classNames";

type SourcePanelProps = {
  charCount: number;
  onApplySource: (event: FormEvent) => void;
  onResetAttempt: () => void;
  onSourceDraftChange: (value: string) => void;
  sourceDraft: string;
  wordCount: number;
};

export function SourcePanel({
  charCount,
  onApplySource,
  onResetAttempt,
  onSourceDraftChange,
  sourceDraft,
  wordCount,
}: SourcePanelProps) {
  return (
    <div aria-label="source text">
      <div className={cx(meterClass, "mb-3 flex items-center justify-between gap-3")}>
        <span>source text</span>
        <Button
          variant="ghost"
          size="xs"
          type="button"
          onClick={onResetAttempt}
        >
          reset
        </Button>
      </div>
      <form className="grid gap-3" onSubmit={onApplySource}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="source-draft">Text to memorize</FieldLabel>
            <Textarea
              id="source-draft"
              className="min-h-[150px] resize-y font-mono text-sm leading-7 text-[var(--text)] caret-[var(--accent)] min-[900px]:min-h-[250px]"
              value={sourceDraft}
              onChange={(event) => onSourceDraftChange(event.target.value)}
              spellCheck={false}
            />
            <FieldDescription>
              Replace the passage and load it into the memorization stage.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full">
          load text
        </Button>
      </form>
      <div className={cx(meterClass, "mt-3 flex items-center justify-between gap-3")}>
        <Badge variant="outline">{wordCount} words</Badge>
        <Badge variant="outline">{charCount} chars</Badge>
      </div>
    </div>
  );
}
