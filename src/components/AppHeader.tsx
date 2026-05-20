import { FileTextIcon, RotateCcwIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActiveOverlay = "source" | "settings" | null;

type AppHeaderProps = {
  activeOverlay: ActiveOverlay;
  onResetAttempt: () => void;
  onToggleOverlay: (overlay: Exclude<ActiveOverlay, null>) => void;
};

export function AppHeader({
  activeOverlay,
  onResetAttempt,
  onToggleOverlay,
}: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-4 text-sm leading-none text-muted-foreground min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
      <div
        className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-normal text-foreground"
        aria-label="verbatim home"
      >
        <img
          src="/verbatim-logo.svg"
          alt=""
          className="size-8 rounded-lg opacity-90"
          aria-hidden="true"
        />
        <span>Verbatim</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={activeOverlay === "source" ? "default" : "ghost"}
          size="icon-sm"
          aria-pressed={activeOverlay === "source"}
          title="Passage"
          onClick={() => onToggleOverlay("source")}
        >
          <FileTextIcon />
          <span className="sr-only">passage</span>
        </Button>
        <Button
          variant={activeOverlay === "settings" ? "default" : "ghost"}
          size="icon-sm"
          aria-pressed={activeOverlay === "settings"}
          title="Settings"
          onClick={() => onToggleOverlay("settings")}
        >
          <SettingsIcon />
          <span className="sr-only">settings</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Reset"
          onClick={onResetAttempt}
        >
          <RotateCcwIcon />
          <span className="sr-only">reset</span>
        </Button>
      </div>
    </header>
  );
}
