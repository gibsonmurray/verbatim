import type { PlaceholderStyle } from "../lib/settings";
import { clamp } from "../lib/text";

type PlaceholderWordProps = {
  expected: string;
  style: PlaceholderStyle;
};

export function PlaceholderWord({ expected, style }: PlaceholderWordProps) {
  const width = `${clamp(expected.length, 2, 18)}ch`;
  const dotCount = clamp(expected.length, 2, 10);

  if (style === "dots") {
    return (
      <span
        className="relative inline-flex min-h-[1.45em] items-center gap-1.5 whitespace-pre"
        aria-label={`${expected.length} hidden letters`}
      >
        {Array.from({ length: dotCount }, (_, index) => (
          <span
            className="size-[0.32em] rounded-full bg-muted"
            key={index}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex min-h-[1.45em] items-center whitespace-pre"
      aria-label={`${expected.length} hidden letters`}
    >
      <span
        className={
          style === "letters"
            ? "h-[0.22em] border-b-2 border-muted"
            : "h-[0.54em] rounded bg-muted opacity-95"
        }
        style={{ width }}
      />
    </span>
  );
}
