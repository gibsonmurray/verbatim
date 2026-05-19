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
        className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[500px] overflow-auto sm:max-w-[500px] min-[760px]:max-h-[calc(100vh-40px)]"
      >
        <DialogHeader>
          <DialogTitle>
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
