import { type RefObject, type KeyboardEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { cn, meterClass } from "../lib/classNames";
import { medals, type MedalId, type RunBreakdown } from "../lib/game";
import { formatElapsedTime } from "../lib/records";
import type { Settings } from "../lib/settings";
import type { MemorizeStats } from "../lib/stats";
import type { RoundAnalysis } from "../lib/analysis";
import { normalizeForComparison } from "../lib/text";
import { Word } from "./Word";
import { CommandHints } from "./CommandHints";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import { Separator } from "./ui/separator";

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
  latestRoundAnalysis: RoundAnalysis | null;
  roundAnalyses: RoundAnalysis[];
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
  latestRoundAnalysis,
  roundAnalyses,
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

      {stats.isDone && latestRoundAnalysis?.endReason === "completed" ? (
        <RoundAnalysisPanel
          analysis={latestRoundAnalysis}
          roundAnalyses={roundAnalyses}
        />
      ) : null}
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

const analysisChartConfig = {
  value: {
    label: "Score",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "var(--primary)",
  },
  pace: {
    label: "Pace",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
    : 0;

function RoundAnalysisPanel({
  analysis,
  roundAnalyses,
}: {
  analysis: RoundAnalysis;
  roundAnalyses: RoundAnalysis[];
}) {
  const paceScore = Math.min(
    100,
    Math.round((analysis.metrics.wordsPerMinute / 60) * 100),
  );
  const chartData = [
    { label: "progress", value: analysis.metrics.progress },
    { label: "accuracy", value: analysis.metrics.accuracy },
    { label: "pace", value: paceScore },
  ];
  const focusWords = analysis.focusWords.slice(0, 5);
  const completedAnalyses = roundAnalyses
    .filter((roundAnalysis) => roundAnalysis.endReason === "completed")
    .sort((first, second) => first.endedAt - second.endedAt);
  const trendRounds = completedAnalyses.slice(-8);
  const trendData = trendRounds.map((roundAnalysis, index) => ({
    accuracy: roundAnalysis.metrics.accuracy,
    pace: Math.min(100, Math.round((roundAnalysis.metrics.wordsPerMinute / 60) * 100)),
    round: `${completedAnalyses.length - trendRounds.length + index + 1}`,
  }));
  const recentCompleted = completedAnalyses.slice(-5);
  const previousCompleted = completedAnalyses.slice(-10, -5);
  const recentAccuracy = average(
    recentCompleted.map((roundAnalysis) => roundAnalysis.metrics.accuracy),
  );
  const previousAccuracy = average(
    previousCompleted.map((roundAnalysis) => roundAnalysis.metrics.accuracy),
  );
  const accuracyDelta =
    previousCompleted.length > 0 ? recentAccuracy - previousAccuracy : null;
  const resetCount = roundAnalyses.filter(
    (roundAnalysis) => roundAnalysis.endReason === "reset",
  ).length;
  const averageWpm = average(
    completedAnalyses.map((roundAnalysis) => roundAnalysis.metrics.wordsPerMinute),
  );

  return (
    <Card
      size="sm"
      className="mx-auto mt-6 w-full max-w-[860px] rounded-2xl bg-card/80 shadow-sm"
    >
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>round analysis</CardTitle>
          <Badge variant="secondary">completed</Badge>
          <Badge variant="outline">saved locally</Badge>
        </div>
        <CardDescription>{analysis.headline}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 min-[720px]:grid-cols-[1fr_220px]">
          <ChartContainer
            config={analysisChartConfig}
            className="h-[150px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 12 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                axisLine={false}
                dataKey="label"
                tickLine={false}
                tickMargin={8}
                type="category"
                width={64}
              />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={false}
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={5} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs min-[720px]:grid-cols-1">
            <AnalysisMetric label="time" value={formatElapsedTime(analysis.metrics.elapsedMs)} />
            <AnalysisMetric
              label="wpm"
              value={analysis.metrics.wordsPerMinute.toLocaleString()}
            />
            <AnalysisMetric
              label="hints"
              value={analysis.metrics.hints.toLocaleString()}
            />
            <AnalysisMetric
              label="misses"
              value={analysis.metrics.mistakes.toLocaleString()}
            />
          </div>
        </div>

        <Separator />
        <div className="grid gap-4 min-[720px]:grid-cols-[1fr_220px]">
          <ChartContainer config={trendChartConfig} className="h-[150px] w-full">
            <LineChart
              accessibilityLayer
              data={trendData}
              margin={{ left: 0, right: 12, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="round"
                tickLine={false}
                tickMargin={8}
              />
              <YAxis domain={[0, 100]} hide />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Line
                dataKey="accuracy"
                dot={false}
                stroke="var(--color-accuracy)"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="pace"
                dot={false}
                stroke="var(--color-pace)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs min-[720px]:grid-cols-1">
            <AnalysisMetric
              label="locks"
              value={completedAnalyses.length.toLocaleString()}
            />
            <AnalysisMetric label="resets" value={resetCount.toLocaleString()} />
            <AnalysisMetric label="avg acc" value={`${recentAccuracy}%`} />
            <AnalysisMetric
              label="trend"
              value={accuracyDelta === null ? "--" : `${accuracyDelta > 0 ? "+" : ""}${accuracyDelta}%`}
            />
            <AnalysisMetric label="avg wpm" value={averageWpm.toLocaleString()} />
          </div>
        </div>

        {focusWords.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {focusWords.map((word) => (
                <Badge
                  key={`${word.index}-${word.reason}`}
                  variant={word.reason === "missed" ? "destructive" : "outline"}
                  title={
                    word.typed
                      ? `typed: ${word.typed}`
                      : `word ${word.index + 1}`
                  }
                >
                  {word.expected}
                </Badge>
              ))}
            </div>
          </>
        ) : null}

        <Separator />
        <div className="grid gap-2 text-sm text-muted-foreground">
          {[...analysis.strengths, ...analysis.nextSteps].slice(0, 4).map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/45 px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold text-foreground tabular-nums">
        {value}
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
