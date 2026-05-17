import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OverlayPanelProps = {
  children: ReactNode;
  onClose: () => void;
  placement?: "end" | "center";
  title: string;
};

export function OverlayPanel({
  children,
  onClose,
  placement = "end",
  title,
}: OverlayPanelProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={
          placement === "center"
            ? "max-h-[calc(100vh-24px)] max-w-[460px] overflow-auto bg-[color-mix(in_srgb,var(--surface-deep)_96%,black)] p-4 text-[var(--text)] sm:max-w-[460px] min-[760px]:max-h-[calc(100vh-40px)]"
            : "top-auto right-3 bottom-3 left-auto max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[460px] translate-x-0 translate-y-0 overflow-auto bg-[color-mix(in_srgb,var(--surface-deep)_96%,black)] p-4 text-[var(--text)] sm:max-w-[460px] min-[760px]:right-5 min-[760px]:bottom-5 min-[760px]:max-h-[calc(100vh-40px)]"
        }
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-xs text-[var(--text-dim)]">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {title} controls
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
