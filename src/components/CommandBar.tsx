import {
  SparklesIcon,
  TimerIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "../lib/classNames";
import {
  defaultGameProfile,
  getLevel,
  getLevelProgress,
  type GameProfile,
} from "../lib/game";
import { formatElapsedTime, type BestRun } from "../lib/records";
import type { MemorizeStats } from "../lib/stats";

type StatItemProps = {
  label: string;
  value: string;
  minWidth?: string;
};

type CommandBarProps = {
  bestRun: BestRun | null;
  elapsedMs: number;
  gameProfile: GameProfile;
  isNewBest: boolean;
  isTimerRunning: boolean;
  score: number;
  stats: MemorizeStats;
};

function StatItem({ label, value, minWidth }: StatItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-sans text-xs font-semibold leading-none text-muted-foreground">
        {label}
      </span>
      <span
        className="text-xs font-semibold leading-none text-foreground tabular-nums"
        style={minWidth ? { minWidth } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function CommandBar({
  bestRun,
  elapsedMs,
  gameProfile = defaultGameProfile,
  isNewBest,
  isTimerRunning,
  score,
  stats,
}: CommandBarProps) {
  const level = getLevel(gameProfile.totalXp);
  const levelProgress = getLevelProgress(gameProfile.totalXp);

  return (
    <section
      className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 rounded-xl bg-card/70 px-3 py-2 font-mono text-card-foreground"
      aria-label="practice status"
    >
      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <TimerIcon className={isTimerRunning ? "size-3.5 text-primary" : "size-3.5"} />
        </div>
        <StatItem label="time" value={formatElapsedTime(elapsedMs)} minWidth="6ch" />
        <StatItem
          label="pb"
          value={bestRun ? formatElapsedTime(bestRun.elapsedMs) : "--"}
          minWidth="6ch"
        />
        <span
          className={cn(
            "rounded-md bg-primary/15 px-2 py-1 text-xs font-bold text-primary",
            !isNewBest && "invisible",
          )}
          aria-hidden={!isNewBest}
        >
          new pb
        </span>
      </div>

      <div className="h-4 w-px bg-border/70" />

      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <TrophyIcon className="size-3.5" />
        </div>
        <StatItem label="done" value={`${stats.complete}%`} minWidth="4ch" />
        <StatItem label="acc" value={`${stats.accuracy}%`} minWidth="4ch" />
        <StatItem label="hints" value={`${stats.hints}`} minWidth="2ch" />
      </div>

      <div className="h-4 w-px bg-border/70" />

      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <SparklesIcon className="size-3.5" />
        </div>
        <StatItem label="pts" value={`${score}`} minWidth="4ch" />
        <StatItem label="lvl" value={`${level}`} minWidth="2ch" />
        <StatItem label="streak" value={`${gameProfile.streak}`} minWidth="2ch" />
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${(levelProgress / 1000) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
