import { type RefObject, type KeyboardEvent } from "react";
import { cn, meterClass } from "../lib/classNames";
import { medals, type MedalId, type RunBreakdown } from "../lib/game";
import type { Settings } from "../lib/settings";
import type { MemorizeStats } from "../lib/stats";
import { normalizeForComparison } from "../lib/text";
import { Word } from "./Word";
import { CommandHints } from "./CommandHints";

type MemoryStageProps = {
  breakdown: RunBreakdown | null;
  currentIndex: number;
  earnedMedals: MedalId[];
  errorWordIndexes: Set<number>;
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
  breakdown,
  currentIndex,
  earnedMedals,
  errorWordIndexes,
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

      {settings.typewriterMode ? (
        <TypewriterDisplay
          currentIndex={currentIndex}
          currentTypedWord={currentTypedWord}
          errorWordIndexes={errorWordIndexes}
          hasTrailingSpace={hasTrailingSpace}
          revealRest={revealRest}
          revealThrough={revealThrough}
          settings={settings}
          sourceWords={sourceWords}
          stats={stats}
          typedWords={typedWords}
          wordHintIndexes={wordHintIndexes}
        />
      ) : (
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
                hadError={errorWordIndexes.has(index)}
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
      )}

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

      <div
        className={cn(
          "mx-auto mt-9 flex w-fit flex-wrap items-center justify-center gap-2 rounded-xl bg-card/70 px-3 py-2 font-mono text-xs font-bold text-primary",
          !stats.isDone && "invisible",
        )}
        role="status"
        aria-hidden={!stats.isDone}
      >
        <span>locked in</span>
        {xpGained === null ? null : (
          <span>+{xpGained.toLocaleString()} XP</span>
        )}
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

      {stats.isDone && breakdown !== null && (
        <ScoreBreakdown breakdown={breakdown} />
      )}
    </section>
  );
}

function ScoreBreakdown({ breakdown }: { breakdown: RunBreakdown }) {
  const {
    wordScore,
    speedBonus,
    cleanBonus,
    hintBonus,
    bestBonus,
    hintPenalty,
    errorPenalty,
    total,
  } = breakdown;

  const rows: { label: string; value: number; dim?: boolean }[] = [
    { label: "words", value: wordScore },
    ...(speedBonus > 0 ? [{ label: "speed", value: speedBonus }] : []),
    ...(cleanBonus > 0 ? [{ label: "clean run", value: cleanBonus }] : []),
    ...(hintBonus > 0 ? [{ label: "no hints", value: hintBonus }] : []),
    ...(bestBonus > 0 ? [{ label: "new best!", value: bestBonus }] : []),
    ...(hintPenalty > 0 ? [{ label: "hints", value: -hintPenalty, dim: true }] : []),
    ...(errorPenalty > 0 ? [{ label: "errors", value: -errorPenalty, dim: true }] : []),
  ];

  return (
    <div className="mx-auto mt-3 w-fit min-w-[200px] rounded-xl bg-card/70 px-4 py-3 font-mono text-xs">
      <div className="grid gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6">
            <span className={cn("text-muted-foreground", row.dim && "opacity-60")}>
              {row.label}
            </span>
            <span
              className={cn(
                "tabular-nums",
                row.value < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {row.value > 0 ? "+" : ""}
              {row.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-border/50 pt-2">
        <div className="flex items-baseline justify-between gap-6">
          <span className="font-bold text-foreground">total</span>
          <span className="font-bold tabular-nums text-primary">
            {total.toLocaleString()} XP
          </span>
        </div>
      </div>
    </div>
  );
}

type TypewriterDisplayProps = {
  currentIndex: number;
  currentTypedWord: string;
  errorWordIndexes: Set<number>;
  hasTrailingSpace: boolean;
  revealRest: boolean;
  revealThrough: number;
  settings: Settings;
  sourceWords: string[];
  stats: MemorizeStats;
  typedWords: string[];
  wordHintIndexes: number[];
};

function TypewriterDisplay({
  currentIndex,
  currentTypedWord,
  errorWordIndexes,
  hasTrailingSpace,
  revealRest,
  revealThrough,
  settings,
  sourceWords,
  stats,
  typedWords,
  wordHintIndexes,
}: TypewriterDisplayProps) {
  const completedCount = hasTrailingSpace
    ? typedWords.length
    : stats.isDone
      ? sourceWords.length
      : Math.max(0, typedWords.length - 1);

  const hasActiveTabHints = wordHintIndexes.some(
    (hintIndex) => hintIndex >= currentIndex,
  );

  // autoRevealCurrentWord intentionally excluded: it would immediately expand the
  // current word to full width on each new word, breaking the typewriter grow effect.
  // Tab / Shift-Tab remain available for explicit hints.
  const currentWordIsRevealed =
    currentIndex <= revealThrough ||
    hasActiveTabHints ||
    wordHintIndexes.includes(currentIndex) ||
    revealRest;

  const currentWord = stats.isDone ? "" : (sourceWords[currentIndex] ?? "");
  const hintChars = currentWordIsRevealed
    ? currentWord.slice(currentTypedWord.length)
    : "";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1580px] overflow-hidden font-mono leading-[1.55] text-muted-foreground select-none [letter-spacing:0]",
        stats.isDone
          ? "flex flex-wrap items-baseline justify-start gap-x-3 min-[900px]:gap-x-4"
          : "grid h-[1.55em] items-center [grid-template-columns:1fr_2px_1fr]",
      )}
      style={{ fontSize: "var(--word-size)" }}
      aria-live="polite"
    >
      {stats.isDone ? (
        sourceWords.map((word, index) => (
          <Word
            key={`${word}-${index}`}
            currentIndex={currentIndex}
            expected={word}
            hadError={errorWordIndexes.has(index)}
            index={index}
            isComplete={true}
            isRevealed={false}
            settings={settings}
            typed={typedWords[index] ?? ""}
          />
        ))
      ) : (
        <>
          {/* Left column: completed words + typed portion of current word */}
          <div className="flex min-w-0 items-center justify-end gap-x-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black)] min-[900px]:gap-x-4">
            {sourceWords.slice(0, completedCount).map((word, index) => (
              <Word
                key={`${word}-${index}`}
                currentIndex={currentIndex}
                expected={word}
                hadError={errorWordIndexes.has(index)}
                index={index}
                isComplete={true}
                isRevealed={false}
                settings={settings}
                typed={typedWords[index] ?? ""}
              />
            ))}
            <TypedWordChars
              expected={currentWord}
              settings={settings}
              typed={currentTypedWord}
            />
          </div>

          {/* Center column: cursor — always fixed at the midpoint */}
          <span
            className="h-[1em] self-start translate-y-[0.35em] animate-pulse rounded-full bg-primary"
            aria-hidden="true"
          />

          {/* Right column: Tab-revealed hint characters */}
          <div className="min-w-0 overflow-hidden">
            {hintChars ? (
              <span className="whitespace-pre opacity-[var(--hint-opacity)]">
                {hintChars}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

type TypedWordCharsProps = {
  expected: string;
  settings: Settings;
  typed: string;
};

function TypedWordChars({ expected, settings, typed }: TypedWordCharsProps) {
  return (
    <span className="inline-flex min-h-[1.45em] items-baseline whitespace-pre">
      {typed.slice(0, expected.length).split("").map((char, i) => {
        const expectedChar = expected[i] ?? "";
        const matches =
          normalizeForComparison(char, settings) ===
          normalizeForComparison(expectedChar, settings);
        return (
          <span key={i} className={matches ? "text-foreground" : "text-destructive"}>
            {char}
          </span>
        );
      })}
      {typed.slice(expected.length).split("").map((char, i) => (
        <span key={`e${i}`} className="text-destructive opacity-85">
          {char}
        </span>
      ))}
    </span>
  );
}
