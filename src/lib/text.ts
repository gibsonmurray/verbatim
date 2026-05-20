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

const formatTypedCharacterFromSource = (
  typedCharacter: string,
  sourceCharacter: string,
  autoCapitalize: boolean,
) =>
  autoCapitalize &&
  normalizeTypedCharacter(typedCharacter) === normalizeTypedCharacter(sourceCharacter)
    ? sourceCharacter
    : typedCharacter;

type SourceFormattingOptions = {
  autoCapitalize?: boolean;
};

export const formatTypedTextFromSource = (
  value: string,
  source: string,
  options: SourceFormattingOptions = {},
) => {
  const typedCharacters = typedCharactersFrom(value);

  if (!typedCharacters.length) return "";

  let typedIndex = 0;
  let formatted = "";

  for (const sourceCharacter of Array.from(source)) {
    if (isTypedCharacter(sourceCharacter)) {
      if (typedIndex >= typedCharacters.length) break;

      const typedCharacter = typedCharacters[typedIndex];
      formatted += formatTypedCharacterFromSource(
        typedCharacter,
        sourceCharacter,
        Boolean(options.autoCapitalize),
      );
      typedIndex += 1;
      continue;
    }

    formatted += sourceCharacter;
  }

  return formatted;
};

export const removeLastTypedCharacter = (
  value: string,
  source: string,
  options: SourceFormattingOptions = {},
) =>
  formatTypedTextFromSource(
    typedCharactersFrom(value).slice(0, -1).join(""),
    source,
    options,
  );

export const formatTypedWordFromSource = (
  value: string,
  sourceWord: string,
  options: SourceFormattingOptions = {},
) => {
  const typedCharacters = typedCharactersFrom(value);

  if (!typedCharacters.length) return value;

  let typedIndex = 0;
  let formatted = "";

  for (const sourceCharacter of Array.from(sourceWord)) {
    if (isTypedCharacter(sourceCharacter)) {
      if (typedIndex >= typedCharacters.length) break;

      formatted += formatTypedCharacterFromSource(
        typedCharacters[typedIndex],
        sourceCharacter,
        Boolean(options.autoCapitalize),
      );
      typedIndex += 1;
      continue;
    }

    formatted += sourceCharacter;
  }

  return `${formatted}${typedCharacters.slice(typedIndex).join("")}`;
};

export const formatTypedWordCasingFromSource = (
  value: string,
  sourceWord: string,
) => {
  const sourceCharacters = Array.from(sourceWord).filter(isTypedCharacter);
  let typedIndex = 0;

  return Array.from(value)
    .map((typedCharacter) => {
      if (!isTypedCharacter(typedCharacter)) return typedCharacter;

      const sourceCharacter = sourceCharacters[typedIndex];
      typedIndex += 1;

      return sourceCharacter
        ? formatTypedCharacterFromSource(typedCharacter, sourceCharacter, true)
        : typedCharacter;
    })
    .join("");
};

export const formatTypedTextCasingFromSourceWords = (
  value: string,
  sourceWords: string[],
) => {
  let wordIndex = 0;

  return value
    .split(/(\s+)/)
    .map((part) => {
      if (!part || /\s+/.test(part)) return part;

      const sourceWord = sourceWords[wordIndex];
      wordIndex += 1;

      return sourceWord ? formatTypedWordCasingFromSource(part, sourceWord) : part;
    })
    .join("");
};

export const completeCurrentWordFromSource = (
  value: string,
  sourceWords: string[],
  currentIndex: number,
  options: SourceFormattingOptions = {},
) => {
  if (endsWithSpace(value)) return value;

  const typedWords = typedWordsFrom(value);
  const currentWord = typedWords[currentIndex];

  if (!currentWord) return value;

  const sourceWord = sourceWords[currentIndex];
  const nextCurrentWord = sourceWord
    ? formatTypedWordFromSource(currentWord, sourceWord, options)
    : currentWord;

  return `${[...typedWords.slice(0, currentIndex), nextCurrentWord].join(" ")} `;
};
