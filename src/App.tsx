import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AppHeader } from "./components/AppHeader";
import { CommandBar } from "./components/CommandBar";
import { MemoryStage } from "./components/MemoryStage";
import { OverlayPanel } from "./components/OverlayPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { SourcePanel } from "./components/SourcePanel";
import { sampleText } from "./constants";
import {
  clearLocalSettings,
  defaultSettings,
  loadLocalSettings,
  saveLocalSettings,
  type Settings,
} from "./lib/settings";
import { getStats } from "./lib/stats";
import { endsWithSpace, normalizeText, toWords, typedWordsFrom } from "./lib/text";

type ActiveOverlay = "source" | "settings" | null;

export default function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sourceDraft, setSourceDraft] = useState(sampleText);
  const [sourceText, setSourceText] = useState(sampleText);
  const [typedText, setTypedText] = useState("");
  const [revealThrough, setRevealThrough] = useState(-1);
  const [revealRest, setRevealRest] = useState(false);
  const [wordHintIndexes, setWordHintIndexes] = useState<number[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [settings, setSettings] = useState<Settings>(
    () => loadLocalSettings() ?? defaultSettings,
  );
  const [settingsStatus, setSettingsStatus] = useState(
    () => (loadLocalSettings() ? "loaded local" : "defaults active"),
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

  const resetAttempt = () => {
    setTypedText("");
    setRevealThrough(-1);
    setRevealRest(false);
    setWordHintIndexes([]);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const applySource = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeText(sourceDraft);

    if (!normalized) return;

    setSourceText(normalized);
    setSourceDraft(normalized);
    resetAttempt();
    setActiveOverlay(null);
  };

  const updateSetting = <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
    setSettingsStatus("unsaved changes");
  };

  const saveSettings = () => {
    saveLocalSettings(settings);
    setSettingsStatus("saved locally");
  };

  const loadSettings = () => {
    const savedSettings = loadLocalSettings();

    if (!savedSettings) {
      setSettingsStatus("nothing saved");
      return;
    }

    setSettings(savedSettings);
    setSettingsStatus("loaded local");
  };

  const restoreDefaults = () => {
    clearLocalSettings();
    setSettings(defaultSettings);
    setSettingsStatus("defaults active");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();

      if (event.shiftKey) {
        setRevealRest(true);
        setRevealThrough((previous) => Math.max(previous, currentIndex));
      } else {
        setWordHintIndexes((previous) => {
          const highestHintedFutureIndex = previous.reduce(
            (highest, index) =>
              index > currentIndex ? Math.max(highest, index) : highest,
            currentIndex,
          );
          const nextHintIndex = highestHintedFutureIndex + 1;

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

  return (
    <main
      className="mx-auto flex min-h-screen w-[min(980px,calc(100vw-32px))] flex-col gap-7 py-5 text-foreground min-[900px]:gap-10 min-[900px]:py-7"
      style={
        {
          "--word-size": `${settings.wordSize}px`,
          "--hint-opacity": `${settings.hintStrength / 100}`,
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
          onTypedTextChange={setTypedText}
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
            onApplySource={applySource}
            onResetAttempt={resetAttempt}
            onSourceDraftChange={setSourceDraft}
            sourceDraft={sourceDraft}
            wordCount={sourceDraftWords.length}
          />
        </OverlayPanel>
      ) : null}

      {activeOverlay === "settings" ? (
        <OverlayPanel title="settings" onClose={() => setActiveOverlay(null)}>
          <SettingsPanel
            onLoad={loadSettings}
            onResetDefaults={restoreDefaults}
            onSave={saveSettings}
            onUpdateSetting={updateSetting}
            settings={settings}
            status={settingsStatus}
          />
        </OverlayPanel>
      ) : null}
    </main>
  );
}
