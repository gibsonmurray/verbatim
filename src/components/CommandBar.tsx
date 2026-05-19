import { FileTextIcon, RotateCcwIcon, SettingsIcon } from "lucide-react";
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
    <div className="flex flex-col gap-3 rounded-4xl bg-card p-2 text-card-foreground shadow-sm ring-1 ring-border/60 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant={activeOverlay === "source" ? "default" : "ghost"}
          size="sm"
          aria-pressed={activeOverlay === "source"}
          onClick={() => onToggleOverlay("source")}
        >
          <FileTextIcon data-icon="inline-start" />
          source
        </Button>
        <Button
          variant={activeOverlay === "settings" ? "default" : "ghost"}
          size="sm"
          aria-pressed={activeOverlay === "settings"}
          onClick={() => onToggleOverlay("settings")}
        >
          <SettingsIcon data-icon="inline-start" />
          settings
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetAttempt}>
          <RotateCcwIcon data-icon="inline-start" />
          reset
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-xs min-[720px]:justify-end">
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
