import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
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
  onRenameSavedSource: (id: string, title: string) => void;
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
  onRenameSavedSource,
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
  const [renamingSourceId, setRenamingSourceId] = useState("");
  const [renamingTitle, setRenamingTitle] = useState("");

  const startRenamingSource = (entry: SavedSourceEntry) => {
    setRenamingSourceId(entry.id);
    setRenamingTitle(entry.title);
  };

  const stopRenamingSource = () => {
    setRenamingSourceId("");
    setRenamingTitle("");
  };

  const submitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!renamingSourceId) return;

    onRenameSavedSource(renamingSourceId, renamingTitle);
    stopRenamingSource();
  };

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
              renamingSourceId === entry.id ? (
                <form
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2"
                  key={entry.id}
                  onSubmit={submitRename}
                >
                  <input
                    className="h-9 min-w-0 rounded-4xl border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition-[box-shadow,border-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    value={renamingTitle}
                    onChange={(event) => setRenamingTitle(event.target.value)}
                    aria-label={`Rename ${entry.title}`}
                    autoFocus
                  />
                  <Button variant="default" size="icon" type="submit">
                    <CheckIcon />
                    <span className="sr-only">save name</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={stopRenamingSource}
                  >
                    <XIcon />
                    <span className="sr-only">cancel rename</span>
                  </Button>
                </form>
              ) : (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2"
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
                    size="icon"
                    type="button"
                    onClick={() => startRenamingSource(entry)}
                  >
                    <PencilIcon />
                    <span className="sr-only">rename {entry.title}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => onDeleteSavedSource(entry.id)}
                  >
                    delete
                  </Button>
                </div>
              )
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
