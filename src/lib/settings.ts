import { clamp } from "./text";

export type Theme = "ember" | "mint" | "mono";
export type PlaceholderStyle = "bars" | "dots" | "letters";

export type Settings = {
  caseSensitive: boolean;
  punctuationSensitive: boolean;
  accentSensitive: boolean;
  autoRevealCurrentWord: boolean;
  theme: Theme;
  placeholderStyle: PlaceholderStyle;
  wordSize: number;
  hintStrength: number;
};

export const defaultSettings: Settings = {
  caseSensitive: true,
  punctuationSensitive: true,
  accentSensitive: true,
  autoRevealCurrentWord: true,
  theme: "ember",
  placeholderStyle: "bars",
  wordSize: 34,
  hintStrength: 56,
};

const settingsStorageKey = "verbatim.settings.v1";

const isSettings = (value: unknown): value is Settings => {
  if (!value || typeof value !== "object") return false;

  const settings = value as Partial<Settings>;
  return (
    typeof settings.caseSensitive === "boolean" &&
    typeof settings.punctuationSensitive === "boolean" &&
    typeof settings.accentSensitive === "boolean" &&
    typeof settings.autoRevealCurrentWord === "boolean" &&
    ["ember", "mint", "mono"].includes(String(settings.theme)) &&
    ["bars", "dots", "letters"].includes(String(settings.placeholderStyle)) &&
    typeof settings.wordSize === "number" &&
    Number.isFinite(settings.wordSize) &&
    typeof settings.hintStrength === "number" &&
    Number.isFinite(settings.hintStrength)
  );
};

export const loadLocalSettings = () => {
  try {
    const savedSettings = window.localStorage.getItem(settingsStorageKey);
    if (!savedSettings) return null;

    const parsed = JSON.parse(savedSettings);
    if (!isSettings(parsed)) return null;

    return {
      ...parsed,
      wordSize: clamp(parsed.wordSize, 24, 46),
      hintStrength: clamp(parsed.hintStrength, 25, 85),
    };
  } catch {
    return null;
  }
};

export const saveLocalSettings = (settings: Settings) => {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};

export const clearLocalSettings = () => {
  window.localStorage.removeItem(settingsStorageKey);
};
