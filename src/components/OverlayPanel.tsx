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
  title: string;
};

export function OverlayPanel({
  children,
  onClose,
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
        className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[460px] overflow-auto bg-popover p-4 text-popover-foreground sm:max-w-[460px] min-[760px]:max-h-[calc(100vh-40px)]"
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-xs text-muted-foreground">
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
