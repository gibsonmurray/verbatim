import { type RefObject, type KeyboardEvent } from "react";
import { cn, meterClass } from "../lib/classNames";
import { medals, type MedalId } from "../lib/game";
import type { Settings } from "../lib/settings";
import type { MemorizeStats } from "../lib/stats";
import { Word } from "./Word";
import { CommandHints } from "./CommandHints";

type MemoryStageProps = {
  currentIndex: number;
  earnedMedals: MedalId[];
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
  xpGained: number | null;
};

export function MemoryStage({
  currentIndex,
  earnedMedals,
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
  xpGained,
}: MemoryStageProps) {
  const totalWords = sourceWords.length;
  const currentWordNumber = stats.isDone
    ? totalWords
    : Math.min(currentIndex + 1, totalWords);
  const remainingWords = stats.isDone
    ? 0
    : Math.max(totalWords - currentIndex, 0);
  const currentTypedWord = hasTrailingSpace ? "" : typedWords[currentIndex] ?? "";

  return (
    <section
      className="relative flex min-h-[min(620px,calc(100vh-260px))] flex-1 flex-col justify-center text-card-foreground outline-none min-[900px]:min-h-[min(660px,calc(100vh-250px))]"
      onClick={() => inputRef.current?.focus()}
      aria-label="typing area"
    >
      <div
        className={cn(
          meterClass,
          "mx-auto mb-7 flex w-full max-w-[1180px] items-center justify-center gap-5 text-center min-[900px]:mb-8",
        )}
      >
        <span>
          {totalWords ? `word ${currentWordNumber}/${totalWords}` : "no passage"}
        </span>
        <span aria-hidden="true">·</span>
        <span>{remainingWords} left</span>
        <span aria-hidden="true">·</span>
        <span className={stats.errors ? "text-destructive" : undefined}>
          {stats.errors ? `${stats.errors} errors` : "no errors"}
        </span>
      </div>

      <div
        className="mx-auto flex w-full max-w-[1580px] flex-wrap content-center justify-start gap-x-3 gap-y-2.5 font-mono leading-[1.55] text-muted-foreground select-none [letter-spacing:0] min-[900px]:gap-x-4 min-[900px]:gap-y-3.5"
        style={{ fontSize: "var(--word-size)" }}
        aria-live="polite"
      >
        {sourceWords.map((word, index) => {
          const finishedCount = hasTrailingSpace
            ? typedWords.length
            : stats.isDone
              ? sourceWords.length
              : Math.max(0, typedWords.length - 1);
          const isComplete = index < finishedCount;
          const typed = isComplete
            ? typedWords[index] ?? ""
            : index === currentIndex
              ? currentTypedWord
              : "";
          const hasActiveTabHints = wordHintIndexes.some(
            (hintIndex) => hintIndex >= currentIndex,
          );
          const isRevealed =
            index <= revealThrough ||
            (settings.autoRevealCurrentWord && index === currentIndex) ||
            (index === currentIndex && hasActiveTabHints) ||
            (index >= currentIndex && wordHintIndexes.includes(index)) ||
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
          className="mx-auto mt-9 flex w-fit flex-wrap items-center justify-center gap-2 rounded-xl bg-card/70 px-3 py-2 font-mono text-xs font-bold text-primary"
          role="status"
        >
          <span>locked in</span>
          {xpGained === null ? null : <span>+{xpGained} XP</span>}
          {earnedMedals.map((medalId) => (
            <span
              className="rounded-md bg-muted px-2 py-0.5 text-foreground"
              key={medalId}
              title={medals[medalId].description}
            >
              {medals[medalId].label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
