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

  const sourceWords = useMemo(() => toWords(sourceText), [sourceText]);
  const sourceDraftWords = useMemo(() => toWords(sourceDraft), [sourceDraft]);
  const typedWords = useMemo(() => typedWordsFrom(typedText), [typedText]);
  const hasTrailingSpace = endsWithSpace(typedText);
  const currentIndex = Math.min(
    Math.max(hasTrailingSpace ? typedWords.length : typedWords.length - 1, 0),
    Math.max(0, sourceWords.length - 1),
  );
  const currentTypedWord = hasTrailingSpace ? "" : typedWords[currentIndex] ?? "";
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (stats.isDone && !wasDoneRef.current) {
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
  }, [stats.isDone]);

  const resetAttempt = (options: { focus?: boolean } = {}) => {
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    setWordHintIndexes([]);

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

    if (!settings.persistTabReveals && nextTypedText !== typedText) {
      setWordHintIndexes([]);
    }
  };

  return (
    <main
      className="mx-auto flex min-h-screen w-[min(1040px,calc(100vw-24px))] flex-col gap-4 py-4 text-foreground min-[900px]:gap-5 min-[900px]:py-6"
      style={
        {
          "--word-size": `${settings.wordSize}px`,
          "--hint-opacity": "0.56",
        } as CSSProperties
      }
    >
      <AppHeader />

      <CommandBar
        activeOverlay={activeOverlay}
        onResetAttempt={resetAttempt}
        onToggleOverlay={toggleOverlay}
        stats={stats}
      />

      <section className="grid items-start" aria-label="memorization workspace">
        <MemoryStage
          currentIndex={currentIndex}
          currentTypedWord={currentTypedWord}
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
        />
      </section>

      {activeOverlay === "source" ? (
        <OverlayPanel title="source" onClose={() => setActiveOverlay(null)}>
          <SourcePanel
            charCount={sourceDraft.length}
            onDeleteSavedSource={deleteSavedSource}
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
