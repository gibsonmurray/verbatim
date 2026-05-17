import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";

const sampleText =
  "The mind is not a vessel to be filled, but a fire to be kindled.";

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const toWords = (value: string) => {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
};

const typedWordsFrom = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/) : [];
};

const endsWithSpace = (value: string) => /\s$/.test(value);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type MemorizeStats = {
  accuracy: number;
  complete: number;
  errors: number;
  hints: number;
  isDone: boolean;
};

type WordProps = {
  expected: string;
  typed: string;
  index: number;
  currentIndex: number;
  isComplete: boolean;
  isRevealed: boolean;
};

function getStats(
  sourceWords: string[],
  typedText: string,
  revealThrough: number,
  revealRest: boolean,
): MemorizeStats {
  const typedWords = typedWordsFrom(typedText);
  const finishedWords = endsWithSpace(typedText) ? typedWords : typedWords.slice(0, -1);
  const checkedWords = finishedWords.slice(0, sourceWords.length);
  const errors = checkedWords.filter((word, index) => word !== sourceWords[index]).length;
  const correct = checkedWords.length - errors;
  const accuracy = checkedWords.length
    ? Math.round((correct / checkedWords.length) * 100)
    : 100;
  const complete = sourceWords.length
    ? Math.round((checkedWords.length / sourceWords.length) * 100)
    : 0;
  const visibleHintCount =
    Math.max(0, Math.min(revealThrough + 1, sourceWords.length)) +
    (revealRest ? Math.max(0, sourceWords.length - Math.max(0, revealThrough + 1)) : 0);

  return {
    accuracy,
    complete,
    errors,
    hints: visibleHintCount,
    isDone:
      normalizeText(typedText) === sourceWords.join(" ") &&
      sourceWords.length > 0 &&
      errors === 0,
  };
}

function Word({
  expected,
  typed,
  index,
  currentIndex,
  isComplete,
  isRevealed,
}: WordProps) {
  if (index > currentIndex && !isComplete && !isRevealed) {
    return (
      <span className="word placeholder" aria-label={`${expected.length} hidden letters`}>
        <span style={{ width: `${clamp(expected.length, 2, 18)}ch` }} />
      </span>
    );
  }

  if (index > currentIndex && isRevealed) {
    return <span className="word revealed">{expected}</span>;
  }

  if (isComplete) {
    const isCorrect = typed === expected;
    return <span className={`word ${isCorrect ? "correct" : "wrong"}`}>{typed}</span>;
  }

  if (index !== currentIndex) {
    return <span className="word placeholder" />;
  }

  const characters = expected.split("");
  const extraCharacters = typed.slice(expected.length).split("");

  return (
    <span className="word current">
      {characters.map((character, characterIndex) => {
        const typedCharacter = typed[characterIndex];
        const className =
          typedCharacter === undefined
            ? isRevealed
              ? "char hint"
              : "char empty"
            : typedCharacter === character
              ? "char right"
              : "char bad";

        return (
          <span className={className} key={`${character}-${characterIndex}`}>
            {typedCharacter ?? character}
          </span>
        );
      })}
      {extraCharacters.map((character, characterIndex) => (
        <span className="char bad extra" key={`extra-${character}-${characterIndex}`}>
          {character}
        </span>
      ))}
    </span>
  );
}

export default function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sourceDraft, setSourceDraft] = useState(sampleText);
  const [sourceText, setSourceText] = useState(sampleText);
  const [typedText, setTypedText] = useState("");
  const [revealThrough, setRevealThrough] = useState(-1);
  const [revealRest, setRevealRest] = useState(false);

  const sourceWords = useMemo(() => toWords(sourceText), [sourceText]);
  const typedWords = useMemo(() => typedWordsFrom(typedText), [typedText]);
  const hasTrailingSpace = endsWithSpace(typedText);
  const currentIndex = clamp(
    hasTrailingSpace ? typedWords.length : typedWords.length - 1,
    0,
    Math.max(0, sourceWords.length - 1),
  );
  const currentTypedWord = hasTrailingSpace ? "" : typedWords[currentIndex] ?? "";
  const stats = useMemo(
    () => getStats(sourceWords, typedText, revealThrough, revealRest),
    [revealRest, revealThrough, sourceWords, typedText],
  );

  const applySource = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeText(sourceDraft);

    if (!normalized) return;

    setSourceText(normalized);
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const resetAttempt = () => {
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();

      if (event.shiftKey) {
        setRevealRest(true);
        setRevealThrough((previous) => Math.max(previous, currentIndex));
      } else {
        setRevealThrough((previous) => Math.max(previous + 1, currentIndex));
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      resetAttempt();
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="verbatim home">
          <span className="brand-mark">v</span>
          <span>verbatim</span>
        </div>
        <div className="meters" aria-label="session stats">
          <span>{stats.complete}% done</span>
          <span>{stats.accuracy}% acc</span>
          <span>{stats.hints} hints</span>
        </div>
      </header>

      <section className="workspace" aria-label="memorization workspace">
        <aside className="source-panel" aria-label="source text">
          <div className="panel-title">
            <span>source</span>
            <button type="button" onClick={resetAttempt}>
              reset
            </button>
          </div>
          <form onSubmit={applySource}>
            <textarea
              value={sourceDraft}
              onChange={(event) => setSourceDraft(event.target.value)}
              spellCheck={false}
              aria-label="Text to memorize"
            />
            <button className="primary-action" type="submit">
              load text
            </button>
          </form>
          <div className="source-meta">
            <span>{sourceWords.length} words</span>
            <span>{sourceText.length} chars</span>
          </div>
        </aside>

        <section
          className={`memory-stage ${stats.isDone ? "is-done" : ""}`}
          onClick={() => inputRef.current?.focus()}
          aria-label="typing area"
        >
          <div className="stage-header">
            <span>{stats.errors ? `${stats.errors} errors` : "clean"}</span>
            <span>{currentTypedWord || "ready"}</span>
          </div>

          <div className="word-field" aria-live="polite">
            {sourceWords.map((word, index) => {
              const finishedCount = hasTrailingSpace
                ? typedWords.length
                : Math.max(0, typedWords.length - 1);
              const isComplete = index < finishedCount;
              const typed = isComplete
                ? typedWords[index] ?? ""
                : index === currentIndex
                  ? currentTypedWord
                  : "";
              const isRevealed =
                index <= revealThrough || (revealRest && index >= currentIndex);

              return (
                <Word
                  currentIndex={currentIndex}
                  expected={word}
                  index={index}
                  isComplete={isComplete}
                  isRevealed={isRevealed}
                  key={`${word}-${index}`}
                  typed={typed}
                />
              );
            })}
          </div>

          <textarea
            ref={inputRef}
            className="typing-input"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Type the text from memory"
          />

          <div className="command-row" aria-label="keyboard shortcuts">
            <span>
              <kbd>tab</kbd> next word
            </span>
            <span>
              <kbd>shift</kbd> <kbd>tab</kbd> reveal rest
            </span>
            <span>
              <kbd>esc</kbd> reset
            </span>
          </div>

          {stats.isDone ? (
            <div className="done-banner" role="status">
              locked in
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
