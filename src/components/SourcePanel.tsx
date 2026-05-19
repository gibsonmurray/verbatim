import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn, meterClass } from "../lib/classNames";
import type { SavedSourceEntry } from "../lib/settings";

type SourcePanelProps = {
  charCount: number;
  onDeleteSavedSource: (id: string) => void;
  onResetAttempt: () => void;
  onSaveSourceEntry: () => void;
  onSelectSavedSource: (id: string) => void;
  onSourceDraftChange: (value: string) => void;
  savedSourceEntries: SavedSourceEntry[];
  selectedSavedSourceId: string;
  sourceDraft: string;
  wordCount: number;
};

export function SourcePanel({
  charCount,
  onDeleteSavedSource,
  onResetAttempt,
  onSaveSourceEntry,
  onSelectSavedSource,
  onSourceDraftChange,
  savedSourceEntries,
  selectedSavedSourceId,
  sourceDraft,
  wordCount,
}: SourcePanelProps) {
  const hasSavedSources = savedSourceEntries.length > 0;

  return (
    <div className="grid gap-4" aria-label="source text">
      <div className={cn(meterClass, "mb-3 flex items-center justify-between gap-3")}>
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

      <Field>
        <FieldLabel>saved passages</FieldLabel>
        {hasSavedSources ? (
          <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
            {savedSourceEntries.map((entry) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                key={entry.id}
              >
                <Button
                  variant={
                    entry.id === selectedSavedSourceId ? "default" : "secondary"
                  }
                  type="button"
                  className="justify-start truncate"
                  title={entry.title}
                  onClick={() => onSelectSavedSource(entry.id)}
                >
                  {entry.title}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => onDeleteSavedSource(entry.id)}
                >
                  delete
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            No saved passages yet.
          </p>
        )}
        <FieldDescription>
          Saved passages stay in this browser.
        </FieldDescription>
      </Field>

      <div className="grid gap-3">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="source-draft">Text to memorize</FieldLabel>
            <Textarea
              id="source-draft"
              className="min-h-[150px] resize-y font-mono leading-7 caret-primary min-[900px]:min-h-[250px]"
              value={sourceDraft}
              onChange={(event) => onSourceDraftChange(event.target.value)}
              spellCheck={false}
            />
            <FieldDescription>
              Replace the passage and load it into the memorization stage.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <Button variant="secondary" type="button" onClick={onSaveSourceEntry}>
          save entry
        </Button>
      </div>
      <div className={cn(meterClass, "flex items-center justify-between gap-3")}>
        <Badge variant="outline">{wordCount} words</Badge>
        <Badge variant="outline">{charCount} chars</Badge>
      </div>
    </div>
  );
}
