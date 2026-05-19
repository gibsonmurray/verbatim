import { clamp } from "./text";

const john316Text =
  "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.";

export type PlaceholderStyle = "bars" | "dots" | "letters";

export type SavedSourceEntry = {
  id: string;
  title: string;
  text: string;
  updatedAt: number;
};

export type Settings = {
  caseSensitive: boolean;
  punctuationSensitive: boolean;
  accentSensitive: boolean;
  autoRevealCurrentWord: boolean;
  autoFillFormatting: boolean;
  persistTabReveals: boolean;
  placeholderStyle: PlaceholderStyle;
  wordSize: number;
};

export const defaultSettings: Settings = {
  caseSensitive: true,
  punctuationSensitive: true,
  accentSensitive: true,
  autoRevealCurrentWord: true,
  autoFillFormatting: false,
  persistTabReveals: true,
  placeholderStyle: "bars",
  wordSize: 34,
};

const settingsStorageKey = "verbatim.settings.v1";
const sourceTextStorageKey = "verbatim.sourceText.v1";
const savedSourceEntriesStorageKey = "verbatim.savedSourceEntries.v1";

const defaultSavedSourceEntry: SavedSourceEntry = {
  id: "default-john-3-16",
  title: "John 3:16",
  text: john316Text,
  updatedAt: 0,
};

const isSettings = (value: unknown): value is Settings => {
  if (!value || typeof value !== "object") return false;

  const settings = value as Partial<Settings>;
  return (
    typeof settings.caseSensitive === "boolean" &&
    typeof settings.punctuationSensitive === "boolean" &&
    typeof settings.accentSensitive === "boolean" &&
    typeof settings.autoRevealCurrentWord === "boolean" &&
    (settings.autoFillFormatting === undefined ||
      typeof settings.autoFillFormatting === "boolean") &&
    (settings.persistTabReveals === undefined ||
      typeof settings.persistTabReveals === "boolean") &&
    ["bars", "dots", "letters"].includes(String(settings.placeholderStyle)) &&
    typeof settings.wordSize === "number" &&
    Number.isFinite(settings.wordSize)
  );
};

export const loadLocalSettings = () => {
  try {
    const savedSettings = window.localStorage.getItem(settingsStorageKey);
    if (!savedSettings) return null;

    const parsed = JSON.parse(savedSettings);
    if (!isSettings(parsed)) return null;

    return {
      caseSensitive: parsed.caseSensitive,
      punctuationSensitive: parsed.punctuationSensitive,
      accentSensitive: parsed.accentSensitive,
      autoRevealCurrentWord: parsed.autoRevealCurrentWord,
      autoFillFormatting: parsed.autoFillFormatting ?? false,
      persistTabReveals: parsed.persistTabReveals ?? true,
      placeholderStyle: parsed.placeholderStyle,
      wordSize: clamp(parsed.wordSize, 24, 46),
    };
  } catch {
    return null;
  }
};

export const saveLocalSettings = (settings: Settings) => {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};

export const loadLocalSourceText = () => {
  try {
    return window.localStorage.getItem(sourceTextStorageKey);
  } catch {
    return null;
  }
};

export const saveLocalSourceText = (sourceText: string) => {
  window.localStorage.setItem(sourceTextStorageKey, sourceText);
};

const titleFromSourceText = (sourceText: string) => {
  const words = sourceText.split(/\s+/).filter(Boolean).slice(0, 7);
  const title = words.join(" ");

  return title.length > 52 ? `${title.slice(0, 49)}...` : title || "Untitled";
};

const isSavedSourceEntry = (value: unknown): value is SavedSourceEntry => {
  if (!value || typeof value !== "object") return false;

  const entry = value as Partial<SavedSourceEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.text === "string" &&
    typeof entry.updatedAt === "number" &&
    Number.isFinite(entry.updatedAt)
  );
};

export const loadLocalSavedSourceEntries = () => {
  try {
    const savedEntries = window.localStorage.getItem(savedSourceEntriesStorageKey);
    if (!savedEntries) return [defaultSavedSourceEntry];

    const parsed = JSON.parse(savedEntries);
    if (!Array.isArray(parsed)) return [defaultSavedSourceEntry];

    return parsed
      .filter(isSavedSourceEntry)
      .sort((first, second) => second.updatedAt - first.updatedAt);
  } catch {
    return [];
  }
};

export const saveLocalSavedSourceEntries = (entries: SavedSourceEntry[]) => {
  window.localStorage.setItem(
    savedSourceEntriesStorageKey,
    JSON.stringify(entries),
  );
};

export const createSavedSourceEntry = (sourceText: string): SavedSourceEntry => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
  title: titleFromSourceText(sourceText),
  text: sourceText,
  updatedAt: Date.now(),
});
