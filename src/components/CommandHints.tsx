import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn, meterClass } from "../lib/classNames";

export function CommandHints() {
  return (
    <div
      className={cn(
        meterClass,
        "mx-auto mt-16 flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 opacity-70",
      )}
      aria-label="keyboard shortcuts"
    >
      <span>
        <Kbd className="mr-1.5 text-primary">space</Kbd>
        next word
      </span>
      <span>
        <Kbd className="mr-1.5 text-primary">tab</Kbd>
        word hint
      </span>
      <span>
        <KbdGroup className="mr-1.5">
          <Kbd className="text-primary">shift</Kbd>
          <Kbd className="text-primary">tab</Kbd>
        </KbdGroup>
        reveal rest
      </span>
      <span>
        <Kbd className="mr-1.5 text-primary">esc</Kbd>
        reset
      </span>
    </div>
  );
}
