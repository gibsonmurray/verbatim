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
  loadGameProfile,
  saveGameCompletion,
  type GameProfile,
  type MedalId,
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
} from "./lib/text";

type ActiveOverlay = "source" | "settings" | null;

export default function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasDoneRef = useRef(false);
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
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [settings, setSettings] = useState<Settings>(
    () => loadLocalSettings() ?? defaultSettings,
  );
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [finishedElapsedMs, setFinishedElapsedMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bestRun, setBestRun] = useState<BestRun | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [gameProfile, setGameProfile] = useState<GameProfile>(
    defaultGameProfile,
  );
  const [earnedMedals, setEarnedMedals] = useState<MedalId[]>([]);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [hadMistake, setHadMistake] = useState(false);

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
        revealThrough,
        revealRest,
        wordHintIndexes,
        settings,
      ),
    [revealRest, revealThrough, settings, sourceWords, typedText, wordHintIndexes],
  );
  const elapsedMs =
    finishedElapsedMs ?? (runStartedAt ? Math.max(0, nowMs - runStartedAt) : 0);
  const isTimerRunning = runStartedAt !== null && !stats.isDone;
  const score =
    stats.isDone && xpGained !== null
      ? xpGained
      : stats.complete === 0
        ? 0
        : Math.max(
            0,
            Math.round(stats.complete * 10 + stats.accuracy - stats.hints * 50),
          );

  useEffect(() => {
    if (activeOverlay === "settings") return;

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

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => window.clearInterval(timerId);
  }, [isTimerRunning]);

  useEffect(() => {
    if (selectedSavedSourceId) return;

    const matchingEntry = savedSourceEntries.find(
      (entry) => entry.text === sourceText,
    );

    if (matchingEntry) {
      setSelectedSavedSourceId(matchingEntry.id);
    }
  }, [savedSourceEntries, selectedSavedSourceId, sourceText]);

  useEffect(() => {
    if (runStartedAt !== null && stats.errors > 0) {
      setHadMistake(true);
    }
  }, [runStartedAt, stats.errors]);

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
        hadMistake,
        hints: stats.hints,
        isNewBest: savedRun.isNewBest,
        wordCount: sourceWords.length,
      });

      setFinishedElapsedMs(finalElapsedMs);
      setBestRun(savedRun.bestRun);
      setIsNewBest(savedRun.isNewBest);
      setGameProfile(savedGame.profile);
      setEarnedMedals(savedGame.earnedMedals);
      setXpGained(savedGame.xpGained);
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
    hadMistake,
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
    setHadMistake(false);
  };

  const resetAttempt = (options: { focus?: boolean } = {}) => {
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    setWordHintIndexes([]);
    setRunStartedAt(null);
    setFinishedElapsedMs(null);
    setNowMs(Date.now());
    setIsNewBest(false);
    setEarnedMedals([]);
    setXpGained(null);
    setHadMistake(false);

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
          ? {
              ...entry,
              title: normalizedTitle || entry.title,
              updatedAt: Date.now(),
            }
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
      const nextSettings = {
        ...currentSettings,
        [key]: value,
      };

      saveLocalSettings(nextSettings);
      return nextSettings;
    });
  };

  const restoreDefaults = () => {
    setSettings(defaultSettings);
    saveLocalSettings(defaultSettings);
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
      if (nextTypedText !== typedText) {
        startRun();
      }

      if (!settings.persistTabReveals && nextTypedText !== typedText) {
        setWordHintIndexes([]);
      }

      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();

      if (event.shiftKey) {
        setRevealRest(true);
        setRevealThrough((previous) => Math.max(previous, currentIndex));
      } else {
        setWordHintIndexes((previous) => {
          if (!previous.includes(currentIndex)) {
            return settings.persistTabReveals
              ? [...previous, currentIndex]
              : [currentIndex];
          }

          const highestHintedIndex = previous.reduce(
            (highest, index) =>
              index >= currentIndex ? Math.max(highest, index) : highest,
            currentIndex - 1,
          );
          const nextHintIndex = highestHintedIndex + 1;

          if (nextHintIndex >= sourceWords.length) return previous;

          return previous.includes(nextHintIndex)
            ? previous
            : [...previous, nextHintIndex];
        });
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
    if (nextTypedText && nextTypedText !== typedText) {
      startRun();
    }

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
      />

      <section className="grid items-start" aria-label="memorization workspace">
        <MemoryStage
          currentIndex={currentIndex}
          earnedMedals={earnedMedals}
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
