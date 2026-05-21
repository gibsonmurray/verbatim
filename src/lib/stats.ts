import type { Settings } from "./settings";
import { endsWithSpace, typedWordsFrom, wordsMatch } from "./text";

export type MemorizeStats = {
  accuracy: number;
  complete: number;
  errors: number;
  hints: number;
  isDone: boolean;
};

export function getStats(
  sourceWords: string[],
  typedText: string,
  hintedWordIndexes: number[],
  settings: Settings,
): MemorizeStats {
  const typedWords = typedWordsFrom(typedText);
  const isDone =
    typedWords.length === sourceWords.length &&
    sourceWords.length > 0 &&
    sourceWords.every((word, index) =>
      wordsMatch(typedWords[index] ?? "", word, settings),
    );
  const finishedWords =
    endsWithSpace(typedText) || isDone
      ? typedWords
      : typedWords.slice(0, -1);
  const checkedWords = finishedWords.slice(0, sourceWords.length);
  const errors = checkedWords.filter(
    (word, index) => !wordsMatch(word, sourceWords[index], settings),
  ).length;
  const correct = checkedWords.length - errors;
  const accuracy = checkedWords.length
    ? Math.round((correct / checkedWords.length) * 100)
    : 100;
  const complete = sourceWords.length
    ? Math.round((checkedWords.length / sourceWords.length) * 100)
    : 0;
  const usedHintIndexes = new Set<number>();
  hintedWordIndexes.forEach((index) => {
    if (index >= 0 && index < sourceWords.length) {
      usedHintIndexes.add(index);
    }
  });

  return {
    accuracy,
    complete,
    errors,
    hints: usedHintIndexes.size,
    isDone,
  };
}
