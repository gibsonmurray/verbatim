import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import confetti from "canvas-confetti";
import { AppHeader } from "./components/AppHeader";
import { CommandBar } from "./components/CommandBar";
import { MemoryStage } from "./components/MemoryStage";
import { OverlayPanel } from "./components/OverlayPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { SourcePanel } from "./components/SourcePanel";
import { sampleText } from "./constants";
import {
  createSavedSourceEntry,
  defaultSettings,
  loadLocalSettings,
  loadLocalSavedSourceEntries,
  loadLocalSourceText,
  saveLocalSettings,
  saveLocalSavedSourceEntries,
  saveLocalSourceText,
  type Settings,
} from "./lib/settings";
import {
  defaultGameProfile,
  getStreakMultiplier,
  loadGameProfile,
  POINTS_PER_WORD,
  saveGameCompletion,
  type GameProfile,
  type MedalId,
  type RunBreakdown,
} from "./lib/game";
import {
  getBestRunKey,
  loadBestRun,
  saveCompletedRun,
  type BestRun,
} from "./lib/records";
import { cn } from "./lib/classNames";
import { getStats } from "./lib/stats";
import {
  endsWithSpace,
  completeCurrentWordFromSource,
  formatTypedTextCasingFromSourceWords,
  formatTypedTextFromSource,
  normalizeText,
  removeLastTypedCharacter,
  toWords,
  typedWordsFrom,
  wordsMatch,
} from "./lib/text";

type ActiveOverlay = "source" | "settings" | null;

const appendUnique = (indexes: number[], index: number) =>
  indexes.includes(index) ? indexes : [...indexes, index];

const getNextTabHintIndex = (
  visibleHintIndexes: number[],
  currentIndex: number,
  wordCount: number,
) => {
  if (currentIndex >= wordCount) return null;
  if (!visibleHintIndexes.includes(currentIndex)) return currentIndex;

  const highestHintedIndex = visibleHintIndexes.reduce(
    (highest, index) =>
      index >= currentIndex ? Math.max(highest, index) : highest,
    currentIndex - 1,
  );
  const nextHintIndex = highestHintedIndex + 1;

  return nextHintIndex < wordCount ? nextHintIndex : null;
};

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);

const getCompletedWordCount = (
  sourceWordCount: number,
  typedWordCount: number,
  hasTrailingSpace: boolean,
  isDone: boolean,
) =>
  Math.min(
    sourceWordCount,
    Math.max(0, isDone || hasTrailingSpace ? typedWordCount : typedWordCount - 1),
  );

export default function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasDoneRef = useRef(false);
  const prevCompletedCountRef = useRef(0);
  // Mirrors errorWordIndexes state for synchronous reads in effects
  const errorWordIndexesRef = useRef(new Set<number>());

  const [sourceDraft, setSourceDraft] = useState(
    () => loadLocalSourceText() ?? sampleText,
  );
  const [sourceText, setSourceText] = useState(
    () => loadLocalSourceText() ?? sampleText,
  );
  const [savedSourceEntries, setSavedSourceEntries] = useState(
    loadLocalSavedSourceEntries,
  );
  const [selectedSavedSourceId, setSelectedSavedSourceId] = useState("");
  const [typedText, setTypedText] = useState("");
  const [revealThrough, setRevealThrough] = useState(-1);
  const [revealRest, setRevealRest] = useState(false);
  const [wordHintIndexes, setWordHintIndexes] = useState<number[]>([]);
  const [hintedWordIndexes, setHintedWordIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [settings, setSettings] = useState<Settings>(
    () => loadLocalSettings() ?? defaultSettings,
  );
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [finishedElapsedMs, setFinishedElapsedMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bestRun, setBestRun] = useState<BestRun | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [gameProfile, setGameProfile] = useState<GameProfile>(defaultGameProfile);
  const [earnedMedals, setEarnedMedals] = useState<MedalId[]>([]);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [hadFullReveal, setHadFullReveal] = useState(false);
  const [fullRevealIndex, setFullRevealIndex] = useState<number | null>(null);
  const [errorWordIndexes, setErrorWordIndexes] = useState<Set<number>>(new Set());
  const [breakdown, setBreakdown] = useState<RunBreakdown | null>(null);

  const sourceWords = useMemo(() => toWords(sourceText), [sourceText]);
  const sourceDraftWords = useMemo(() => toWords(sourceDraft), [sourceDraft]);
  const typedWords = useMemo(() => typedWordsFrom(typedText), [typedText]);
  const bestRunKey = useMemo(
    () => getBestRunKey(sourceText, settings),
    [sourceText, settings],
  );
  const hasTrailingSpace = endsWithSpace(typedText);
  const currentIndex = Math.min(
    Math.max(hasTrailingSpace ? typedWords.length : typedWords.length - 1, 0),
    Math.max(0, sourceWords.length - 1),
  );
  const stats = useMemo(
    () =>
      getStats(
        sourceWords,
        typedText,
        Array.from(hintedWordIndexes),
        settings,
      ),
    [hintedWordIndexes, settings, sourceWords, typedText],
  );
  const elapsedMs =
    finishedElapsedMs ?? (runStartedAt ? Math.max(0, nowMs - runStartedAt) : 0);
  const isTimerRunning = runStartedAt !== null && !stats.isDone;
  const completedWordCount = getCompletedWordCount(
    sourceWords.length,
    typedWords.length,
    hasTrailingSpace,
    stats.isDone,
  );
  const roundScore = useMemo(() => {
    let wordScore = 0;
    let streak = 0;

    for (let index = 0; index < completedWordCount; index += 1) {
      const isCorrect = wordsMatch(
        typedWords[index] ?? "",
        sourceWords[index] ?? "",
        settings,
      );
      const wasHinted = hintedWordIndexes.has(index);
      const hadWrongCompletion = errorWordIndexes.has(index);
      const nextStreak =
        isCorrect && !wasHinted && !hadWrongCompletion ? streak + 1 : 0;

      if (isCorrect) {
        wordScore +=
          POINTS_PER_WORD *
          getStreakMultiplier(
            nextStreak,
            fullRevealIndex !== null && index >= fullRevealIndex,
          );
      }

      streak = nextStreak;
    }

    return { wordScore, wordStreak: streak };
  }, [
    completedWordCount,
    errorWordIndexes,
    fullRevealIndex,
    hintedWordIndexes,
    settings,
    sourceWords,
    typedWords,
  ]);

  // Keep refs in sync with state for synchronous reads in effects/handlers
  errorWordIndexesRef.current = errorWordIndexes;

  // Derived: hadMistake is true if any word was ever completed incorrectly.
  const hadMistake = errorWordIndexes.size > 0;
  const streakMultiplier = getStreakMultiplier(roundScore.wordStreak, hadFullReveal);

  const score = stats.isDone && xpGained !== null ? xpGained : roundScore.wordScore;

  useEffect(() => {
    if (activeOverlay !== null) return;

    let focusFrame = 0;

    const focusTypingInput = () => {
      if (document.activeElement === inputRef.current) return;

      if (focusFrame) {
        window.cancelAnimationFrame(focusFrame);
      }

      focusFrame = window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
        focusFrame = 0;
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target === inputRef.current) return;
      focusTypingInput();
    };

    const handlePointerUp = () => {
      focusTypingInput();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        focusTypingInput();
      }
    };

    focusTypingInput();
    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (focusFrame) {
        window.cancelAnimationFrame(focusFrame);
      }
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeOverlay]);

  useEffect(() => {
    setGameProfile(loadGameProfile());
  }, []);

  useEffect(() => {
    setBestRun(loadBestRun(bestRunKey));
    setIsNewBest(false);
  }, [bestRunKey]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const timerId = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(timerId);
  }, [isTimerRunning]);

  useEffect(() => {
    if (selectedSavedSourceId) return;
    const matchingEntry = savedSourceEntries.find(
      (entry) => entry.text === sourceText,
    );
    if (matchingEntry) setSelectedSavedSourceId(matchingEntry.id);
  }, [savedSourceEntries, selectedSavedSourceId, sourceText]);

  // Track words that were completed incorrectly at least once this round.
  useEffect(() => {
    if (!runStartedAt) {
      prevCompletedCountRef.current = completedWordCount;
      return;
    }

    const prevCompletedCount = prevCompletedCountRef.current;
    if (completedWordCount > prevCompletedCount) {
      const wrongIndexes = range(prevCompletedCount, completedWordCount).filter(
        (index) =>
          !wordsMatch(typedWords[index] ?? "", sourceWords[index] ?? "", settings),
      );

      if (wrongIndexes.length > 0) {
        setErrorWordIndexes((previous) => {
          const next = new Set(previous);
          wrongIndexes.forEach((index) => {
            if (index >= 0 && index < sourceWords.length) next.add(index);
          });
          return next;
        });
      }
    }

    prevCompletedCountRef.current = completedWordCount;
  }, [
    completedWordCount,
    runStartedAt,
    settings,
    sourceWords,
    typedWords,
  ]);

  useEffect(() => {
    if (stats.isDone && !wasDoneRef.current) {
      const finalElapsedMs = runStartedAt ? Math.max(0, Date.now() - runStartedAt) : 0;

      const completedRun = {
        completedAt: Date.now(),
        elapsedMs: finalElapsedMs,
        hints: stats.hints,
        wordCount: sourceWords.length,
      };
      const savedRun = saveCompletedRun(bestRunKey, completedRun);
      const savedGame = saveGameCompletion({
        elapsedMs: finalElapsedMs,
        errorWords: errorWordIndexesRef.current.size,
        hadMistake,
        hints: stats.hints,
        isNewBest: savedRun.isNewBest,
        wordScore: roundScore.wordScore,
        wordCount: sourceWords.length,
      });

      setFinishedElapsedMs(finalElapsedMs);
      setBestRun(savedRun.bestRun);
      setIsNewBest(savedRun.isNewBest);
      setGameProfile(savedGame.profile);
      setEarnedMedals(savedGame.earnedMedals);
      setXpGained(savedGame.xpGained);
      setBreakdown(savedGame.breakdown);
      confetti({
        angle: 60,
        disableForReducedMotion: true,
        origin: { x: 0, y: 0.75 },
        particleCount: 90,
        spread: 55,
        startVelocity: 48,
      });
      confetti({
        angle: 120,
        disableForReducedMotion: true,
        origin: { x: 1, y: 0.75 },
        particleCount: 90,
        spread: 55,
        startVelocity: 48,
      });
    }

    wasDoneRef.current = stats.isDone;
  }, [
    bestRunKey,
    hadFullReveal,
    hadMistake,
    roundScore.wordScore,
    runStartedAt,
    sourceWords.length,
    stats.hints,
    stats.isDone,
  ]);

  const startRun = () => {
    if (runStartedAt !== null || stats.isDone) return;

    const startedAt = Date.now();
    setRunStartedAt(startedAt);
    setNowMs(startedAt);
    setFinishedElapsedMs(null);
    setIsNewBest(false);
    setEarnedMedals([]);
    setXpGained(null);
    setErrorWordIndexes(new Set());
    setBreakdown(null);
    prevCompletedCountRef.current = 0;
  };

  const resetAttempt = (options: { focus?: boolean } = {}) => {
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    setWordHintIndexes([]);
    setHintedWordIndexes(new Set());
    setRunStartedAt(null);
    setFinishedElapsedMs(null);
    setNowMs(Date.now());
    setIsNewBest(false);
    setEarnedMedals([]);
    setXpGained(null);
    setHadFullReveal(false);
    setFullRevealIndex(null);
    setErrorWordIndexes(new Set());
    setBreakdown(null);
    prevCompletedCountRef.current = 0;

    if (options.focus ?? true) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const saveSavedSourceEntries = (
    getNextEntries: (entries: typeof savedSourceEntries) => typeof savedSourceEntries,
  ) => {
    setSavedSourceEntries((currentEntries) => {
      const nextEntries = getNextEntries(currentEntries).sort(
        (first, second) => second.updatedAt - first.updatedAt,
      );
      saveLocalSavedSourceEntries(nextEntries);
      return nextEntries;
    });
  };

  const saveSourceEntry = () => {
    const normalized = normalizeText(sourceDraft);
    if (!normalized) return;

    const existingEntry = savedSourceEntries.find(
      (entry) => entry.text === normalized,
    );

    if (existingEntry) {
      setSelectedSavedSourceId(existingEntry.id);
      setSourceDraft(existingEntry.text);
      setSourceText(existingEntry.text);
      saveLocalSourceText(existingEntry.text);
      resetAttempt({ focus: false });
      return;
    }

    const nextEntry = createSavedSourceEntry(normalized);
    saveSavedSourceEntries((entries) => [nextEntry, ...entries]);
    setSelectedSavedSourceId(nextEntry.id);
    setSourceDraft(normalized);
    setSourceText(normalized);
    saveLocalSourceText(normalized);
    resetAttempt({ focus: false });
  };

  const selectSavedSource = (id: string) => {
    const entry = savedSourceEntries.find((savedEntry) => savedEntry.id === id);
    if (!entry) return;

    setSelectedSavedSourceId(entry.id);
    setSourceDraft(entry.text);
    setSourceText(entry.text);
    saveLocalSourceText(entry.text);
    resetAttempt({ focus: false });
  };

  const deleteSavedSource = (id: string) => {
    saveSavedSourceEntries((entries) =>
      entries.filter((entry) => entry.id !== id),
    );
    if (selectedSavedSourceId === id) {
      setSelectedSavedSourceId("");
    }
  };

  const renameSavedSource = (id: string, title: string) => {
    const normalizedTitle = title.trim().replace(/\s+/g, " ");
    saveSavedSourceEntries((entries) =>
      entries.map((entry) =>
        entry.id === id
          ? { ...entry, title: normalizedTitle || entry.title, updatedAt: Date.now() }
          : entry,
      ),
    );
  };

  const updateSourceDraft = (value: string) => {
    setSourceDraft(value);
    setSourceText(value);
    saveLocalSourceText(value);
    setSelectedSavedSourceId("");
    resetAttempt({ focus: false });
  };

  const updateSetting = <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => {
    setSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, [key]: value };
      saveLocalSettings(nextSettings);
      return nextSettings;
    });
  };

  const restoreDefaults = () => {
    setSettings(defaultSettings);
    saveLocalSettings(defaultSettings);
  };

  const markWordHints = (indexes: number[]) => {
    if (indexes.length === 0) return;

    setHintedWordIndexes((previous) => {
      const next = new Set(previous);
        indexes.forEach((index) => {
          if (index >= 0 && index < sourceWords.length) next.add(index);
        });
        return next;
      });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.autoFillFormatting && event.key === "Backspace") {
      event.preventDefault();
      setTypedText((currentText) =>
        removeLastTypedCharacter(currentText, sourceText, {
          autoCapitalize: settings.autoCapitalize,
        }),
      );
      setWordHintIndexes([]);
      return;
    }

    const isSpaceKey =
      event.key === " " || event.key === "Space" || event.key === "Spacebar";

    if (!settings.autoFillFormatting && (isSpaceKey || event.code === "Space")) {
      event.preventDefault();

      const nextTypedText = completeCurrentWordFromSource(
        typedText,
        sourceWords,
        currentIndex,
        { autoCapitalize: settings.autoCapitalize },
      );

      setTypedText(nextTypedText);
      if (nextTypedText !== typedText) startRun();

      if (!settings.persistTabReveals && nextTypedText !== typedText) {
        setWordHintIndexes([]);
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();

      if (event.shiftKey) {
        // Full passage reveal: drops multiplier to 0.5× and takes longer to recover
        setRevealRest(true);
        setRevealThrough((previous) => Math.max(previous, currentIndex));
        markWordHints(range(currentIndex, sourceWords.length));
        setHadFullReveal(true);
        setFullRevealIndex((previous) => previous ?? currentIndex);
      } else {
        // Single-word hint: resets streak to 1×
        const nextHintIndex = getNextTabHintIndex(
          wordHintIndexes,
          currentIndex,
          sourceWords.length,
        );

        if (nextHintIndex !== null) {
          setWordHintIndexes((previous) =>
            settings.persistTabReveals
              ? appendUnique(previous, nextHintIndex)
              : [nextHintIndex],
          );
          markWordHints([nextHintIndex]);
        }
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      resetAttempt();
    }
  };

  const toggleOverlay = (overlay: Exclude<ActiveOverlay, null>) => {
    setActiveOverlay((currentOverlay) =>
      currentOverlay === overlay ? null : overlay,
    );
  };

  const updateTypedText = (value: string) => {
    const nextTypedText = settings.autoFillFormatting
      ? formatTypedTextFromSource(value, sourceText, {
          autoCapitalize: settings.autoCapitalize,
        })
      : settings.autoCapitalize
        ? formatTypedTextCasingFromSourceWords(value, sourceWords)
        : value;

    setTypedText(nextTypedText);
    if (nextTypedText && nextTypedText !== typedText) startRun();

    if (!settings.persistTabReveals && nextTypedText !== typedText) {
      setWordHintIndexes([]);
    }
  };

  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen w-[min(1720px,calc(100vw-32px))] flex-col gap-8 py-6 text-foreground transition-[filter] duration-200 min-[900px]:w-[min(1720px,calc(100vw-112px))] min-[900px]:gap-12 min-[900px]:py-9",
        activeOverlay !== null && "blur-sm",
      )}
      style={
        {
          "--word-size": `${settings.wordSize}px`,
          "--hint-opacity": "0.56",
        } as CSSProperties
      }
    >
      <AppHeader
        activeOverlay={activeOverlay}
        onResetAttempt={resetAttempt}
        onToggleOverlay={toggleOverlay}
      />

      <CommandBar
        bestRun={bestRun}
        elapsedMs={elapsedMs}
        gameProfile={gameProfile}
        isNewBest={isNewBest}
        isTimerRunning={isTimerRunning}
        score={score}
        stats={stats}
        wordStreak={roundScore.wordStreak}
        streakMultiplier={streakMultiplier}
      />

      <section className="grid items-start" aria-label="memorization workspace">
        <MemoryStage
          breakdown={breakdown}
          currentIndex={currentIndex}
          earnedMedals={earnedMedals}
          errorWordIndexes={errorWordIndexes}
          hasTrailingSpace={hasTrailingSpace}
          inputRef={inputRef}
          onKeyDown={handleKeyDown}
          onTypedTextChange={updateTypedText}
          revealRest={revealRest}
          revealThrough={revealThrough}
          settings={settings}
          sourceWords={sourceWords}
          stats={stats}
          typedText={typedText}
          typedWords={typedWords}
          wordHintIndexes={wordHintIndexes}
          xpGained={xpGained}
        />
      </section>

      {activeOverlay === "source" ? (
        <OverlayPanel
          modal={false}
          title="source"
          onClose={() => setActiveOverlay(null)}
        >
          <SourcePanel
            charCount={sourceDraft.length}
            onDeleteSavedSource={deleteSavedSource}
            onRenameSavedSource={renameSavedSource}
            onResetAttempt={resetAttempt}
            onSaveSourceEntry={saveSourceEntry}
            onSelectSavedSource={selectSavedSource}
            onSourceDraftChange={updateSourceDraft}
            savedSourceEntries={savedSourceEntries}
            selectedSavedSourceId={selectedSavedSourceId}
            sourceDraft={sourceDraft}
            wordCount={sourceDraftWords.length}
          />
        </OverlayPanel>
      ) : null}

      {activeOverlay === "settings" ? (
        <OverlayPanel title="settings" onClose={() => setActiveOverlay(null)}>
          <SettingsPanel
            onResetDefaults={restoreDefaults}
            onUpdateSetting={updateSetting}
            settings={settings}
          />
        </OverlayPanel>
      ) : null}
    </main>
  );
}
