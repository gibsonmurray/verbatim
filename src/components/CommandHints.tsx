import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cx, meterClass } from "../lib/classNames";

export function CommandHints() {
  return (
    <div
      className={cx(
        meterClass,
        "mt-14 flex flex-wrap items-center justify-start gap-x-6 gap-y-3.5",
      )}
      aria-label="keyboard shortcuts"
    >
      <span>
        <Kbd className="mr-1.5 text-[var(--accent)]">tab</Kbd>
        next word
      </span>
      <span>
        <KbdGroup className="mr-1.5">
          <Kbd className="text-[var(--accent)]">shift</Kbd>
          <Kbd className="text-[var(--accent)]">tab</Kbd>
        </KbdGroup>
        reveal rest
      </span>
      <span>
        <Kbd className="mr-1.5 text-[var(--accent)]">esc</Kbd>
        reset
      </span>
    </div>
  );
}
