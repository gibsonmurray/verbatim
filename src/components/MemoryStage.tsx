import { RefObject, KeyboardEvent } from "react";
import { cx, meterClass } from "../lib/classNames";
import type { Settings } from "../lib/settings";
import type { MemorizeStats } from "../lib/stats";
import { Word } from "./Word";
import { CommandHints } from "./CommandHints";

type MemoryStageProps = {
  currentIndex: number;
  currentTypedWord: string;
  hasTrailingSpace: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onTypedTextChange: (value: string) => void;
  revealRest: boolean;
  revealThrough: number;
  settings: Settings;
  sourceWords: string[];
  stats: MemorizeStats;
  typedText: string;
  typedWords: string[];
  wordHintIndexes: number[];
};

export function MemoryStage({
  currentIndex,
  currentTypedWord,
  hasTrailingSpace,
  inputRef,
  onKeyDown,
  onTypedTextChange,
  revealRest,
  revealThrough,
  settings,
  sourceWords,
  stats,
  typedText,
  typedWords,
  wordHintIndexes,
}: MemoryStageProps) {
  return (
    <section
      className="relative min-h-[430px] pt-5 outline-none min-[900px]:min-h-[530px] min-[900px]:pt-14"
      onClick={() => inputRef.current?.focus()}
      aria-label="typing area"
    >
      <div
        className={cx(
          meterClass,
          "mb-6 flex items-center justify-between gap-3 min-[900px]:mb-9",
        )}
      >
        <span>{stats.errors ? `${stats.errors} errors` : "clean"}</span>
        <span>{currentTypedWord || "ready"}</span>
      </div>

      <div
        className="flex min-h-[220px] flex-wrap content-start gap-x-3 gap-y-2.5 font-mono leading-[1.55] text-[min(var(--word-size),25px)] text-muted-foreground select-none [letter-spacing:0] min-[900px]:min-h-[260px] min-[900px]:gap-x-4 min-[900px]:gap-y-3.5 min-[900px]:text-[var(--word-size)]"
        aria-live="polite"
      >
        {sourceWords.map((word, index) => {
          const finishedCount = hasTrailingSpace
            ? typedWords.length
            : typedWords.length >= sourceWords.length
              ? sourceWords.length
              : Math.max(0, typedWords.length - 1);
          const isComplete = index < finishedCount;
          const typed = isComplete
            ? typedWords[index] ?? ""
            : index === currentIndex
              ? currentTypedWord
              : "";
          const isRevealed =
            index <= revealThrough ||
            (settings.autoRevealCurrentWord && index === currentIndex) ||
            (index > currentIndex && wordHintIndexes.includes(index)) ||
            (revealRest && index >= currentIndex);

          return (
            <Word
              currentIndex={currentIndex}
              expected={word}
              index={index}
              isComplete={isComplete}
              isRevealed={isRevealed}
              key={`${word}-${index}`}
              settings={settings}
              typed={typed}
            />
          );
        })}
      </div>

      <textarea
        ref={inputRef}
        className="fixed left-0 top-0 size-px resize-none overflow-hidden border-0 bg-transparent text-transparent opacity-0 caret-transparent outline-none"
        value={typedText}
        onChange={(event) => onTypedTextChange(event.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-label="Type the text from memory"
      />

      <CommandHints />

      {stats.isDone ? (
        <div
          className="absolute right-0 bottom-1.5 rounded-md bg-primary px-3 py-2 font-mono text-xs font-extrabold text-primary-foreground"
          role="status"
        >
          locked in
        </div>
      ) : null}
    </section>
  );
}
