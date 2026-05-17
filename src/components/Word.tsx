import { cx } from "../lib/classNames";
import type { Settings } from "../lib/settings";
import { normalizeForComparison, wordsMatch } from "../lib/text";
import { PlaceholderWord } from "./PlaceholderWord";

type WordProps = {
  expected: string;
  typed: string;
  index: number;
  currentIndex: number;
  isComplete: boolean;
  isRevealed: boolean;
  settings: Settings;
};

function TextCursor() {
  return (
    <span
      className="mx-[1px] inline-block h-[1em] w-[2px] translate-y-[0.12em] animate-pulse rounded-full bg-[var(--accent)] align-baseline"
      aria-hidden="true"
    />
  );
}

export function Word({
  expected,
  typed,
  index,
  currentIndex,
  isComplete,
  isRevealed,
  settings,
}: WordProps) {
  if (index > currentIndex && !isComplete && !isRevealed) {
    return <PlaceholderWord expected={expected} style={settings.placeholderStyle} />;
  }

  if (index > currentIndex && isRevealed) {
    return (
      <span className="inline-flex min-h-[1.45em] items-baseline whitespace-pre text-[var(--text-soft)] opacity-[var(--hint-opacity)]">
        {expected}
      </span>
    );
  }

  if (isComplete) {
    const isCorrect = wordsMatch(typed, expected, settings);
    return (
      <span
        className={cx(
          "inline-flex min-h-[1.45em] items-baseline whitespace-pre",
          isCorrect
            ? "text-[var(--text)]"
            : "text-[#c06d67] underline decoration-2 underline-offset-[0.22em]",
        )}
      >
        {typed}
      </span>
    );
  }

  if (index !== currentIndex) {
    return <PlaceholderWord expected={expected} style={settings.placeholderStyle} />;
  }

  const characters = expected.split("");
  const extraCharacters = typed.slice(expected.length).split("");
  const cursorInsideExpected = typed.length <= expected.length;

  return (
    <span className="inline-flex min-h-[1.45em] items-baseline whitespace-pre text-[var(--text-soft)]">
      {characters.map((character, characterIndex) => {
        const typedCharacter = typed[characterIndex];
        const typedCharacterMatches =
          typedCharacter !== undefined &&
          normalizeForComparison(typedCharacter, settings) ===
            normalizeForComparison(character, settings);
        const className =
          typedCharacter === undefined
            ? isRevealed
              ? "text-[var(--text-soft)] opacity-[var(--hint-opacity)]"
              : "border-b-2 border-[var(--placeholder)] text-transparent"
            : typedCharacterMatches
              ? "text-[var(--text-strong)]"
              : "text-[#bd665f]";

        return (
          <span className="inline-flex items-baseline" key={`${character}-${characterIndex}`}>
            {cursorInsideExpected && typed.length === characterIndex ? <TextCursor /> : null}
            <span className={className}>{typedCharacter ?? character}</span>
          </span>
        );
      })}
      {extraCharacters.map((character, characterIndex) => (
        <span
          className="text-[#bd665f] opacity-85"
          key={`extra-${character}-${characterIndex}`}
        >
          {character}
        </span>
      ))}
      {typed.length >= expected.length ? <TextCursor /> : null}
    </span>
  );
}
