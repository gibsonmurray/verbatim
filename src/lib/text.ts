import type { Settings } from "./settings";

export const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

export const toWords = (value: string) => {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
};

export const typedWordsFrom = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/) : [];
};

export const endsWithSpace = (value: string) => /\s$/.test(value);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const typedCharacterPattern = /[\p{L}\p{N}]/u;

const isTypedCharacter = (value: string) => typedCharacterPattern.test(value);

const typedCharactersFrom = (value: string) =>
  Array.from(value).filter(isTypedCharacter);

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

const stripPunctuation = (value: string) => value.replace(/[\p{P}\p{S}]/gu, "");

export const normalizeForComparison = (value: string, settings: Settings) => {
  let normalized = value;

  if (!settings.caseSensitive) {
    normalized = normalized.toLocaleLowerCase();
  }

  if (!settings.punctuationSensitive) {
    normalized = stripPunctuation(normalized);
  }

  if (!settings.accentSensitive) {
    normalized = stripAccents(normalized);
  }

  return normalized;
};

export const wordsMatch = (typed: string, expected: string, settings: Settings) =>
  normalizeForComparison(typed, settings) ===
  normalizeForComparison(expected, settings);

const normalizeTypedCharacter = (value: string) =>
  stripAccents(value).toLocaleLowerCase();

export const formatTypedTextFromSource = (value: string, source: string) => {
  const typedCharacters = typedCharactersFrom(value);

  if (!typedCharacters.length) return "";

  let typedIndex = 0;
  let formatted = "";

  for (const sourceCharacter of Array.from(source)) {
    if (isTypedCharacter(sourceCharacter)) {
      if (typedIndex >= typedCharacters.length) break;

      const typedCharacter = typedCharacters[typedIndex];
      formatted +=
        normalizeTypedCharacter(typedCharacter) ===
        normalizeTypedCharacter(sourceCharacter)
          ? sourceCharacter
          : typedCharacter;
      typedIndex += 1;
      continue;
    }

    formatted += sourceCharacter;
  }

  return formatted;
};

export const removeLastTypedCharacter = (value: string, source: string) =>
  formatTypedTextFromSource(typedCharactersFrom(value).slice(0, -1).join(""), source);
