import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileEditIcon,
  RefreshIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MemorizeStats } from "../lib/stats";

type ActiveOverlay = "source" | "settings" | null;

type CommandBarProps = {
  activeOverlay: ActiveOverlay;
  onResetAttempt: () => void;
  onToggleOverlay: (overlay: Exclude<ActiveOverlay, null>) => void;
  stats: MemorizeStats;
};

export function CommandBar({
  activeOverlay,
  onResetAttempt,
  onToggleOverlay,
  stats,
}: CommandBarProps) {
  return (
    <div className="flex flex-col gap-3 border border-border bg-card/70 px-3 py-2.5 text-card-foreground min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant={activeOverlay === "source" ? "default" : "ghost"}
          size="sm"
          aria-pressed={activeOverlay === "source"}
          onClick={() => onToggleOverlay("source")}
        >
          <HugeiconsIcon icon={FileEditIcon} strokeWidth={2} data-icon="inline-start" />
          source
        </Button>
        <Button
          variant={activeOverlay === "settings" ? "default" : "ghost"}
          size="sm"
          aria-pressed={activeOverlay === "settings"}
          onClick={() => onToggleOverlay("settings")}
        >
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} data-icon="inline-start" />
          settings
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetAttempt}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
          reset
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <Badge variant="secondary">
          {stats.complete}% done
        </Badge>
        <Badge variant="secondary">
          {stats.accuracy}% acc
        </Badge>
        <Badge variant="secondary">
          {stats.hints} hints
        </Badge>
      </div>
    </div>
  );
}
