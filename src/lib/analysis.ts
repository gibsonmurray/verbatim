import type { RunBreakdown } from "./game";
import type { Settings } from "./settings";
import { normalizeText, wordsMatch } from "./text";

const databaseName = "verbatim.local";
const databaseVersion = 1;
const roundAnalysesStoreName = "roundAnalyses";
const maxStoredRoundAnalyses = 500;

export type RoundEndReason = "completed" | "reset";

export type RoundFocusWord = {
  expected: string;
  index: number;
  reason: "missed" | "hinted" | "unreached";
  typed: string;
};

export type RoundAnalysisMetrics = {
  accuracy: number;
  completedWords: number;
  elapsedMs: number;
  hints: number;
  mistakes: number;
  progress: number;
  wordsPerMinute: number;
};

export type RoundAnalysis = {
  breakdown: RunBreakdown | null;
  createdAt: number;
  endedAt: number;
  endReason: RoundEndReason;
  focusWords: RoundFocusWord[];
  headline: string;
  id: string;
  isNewBest: boolean;
  metrics: RoundAnalysisMetrics;
  nextSteps: string[];
  sourceKey: string;
  sourcePreview: string;
  strengths: string[];
  wordCount: number;
  xpGained: number | null;
};

type RoundAnalysisInput = {
  breakdown: RunBreakdown | null;
  completedWordCount: number;
  elapsedMs: number;
  endedAt: number;
  endReason: RoundEndReason;
  errorWordIndexes: Set<number>;
  hadFullReveal: boolean;
  hintedWordIndexes: Set<number>;
  id: string;
  isNewBest: boolean;
  settings: Settings;
  sourceText: string;
  sourceWords: string[];
  typedWords: string[];
  xpGained: number | null;
};

const hashString = (value: string) => {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const sourceKeyFrom = (sourceText: string) =>
  `source:${hashString(normalizeText(sourceText))}`;

const sourcePreviewFrom = (sourceText: string) => {
  const normalized = normalizeText(sourceText);
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

const formatPercent = (value: number) => `${Math.round(value)}%`;

const openRoundAnalysisDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(roundAnalysesStoreName)) {
        const store = database.createObjectStore(roundAnalysesStoreName, {
          keyPath: "id",
        });
        store.createIndex("endedAt", "endedAt");
        store.createIndex("sourceKey", "sourceKey");
      }
    };
  });

const requestToPromise = <Value>(request: IDBRequest<Value>) =>
  new Promise<Value>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const pruneOldRoundAnalyses = async (database: IDBDatabase) => {
  const transaction = database.transaction(roundAnalysesStoreName, "readwrite");
  const store = transaction.objectStore(roundAnalysesStoreName);
  const index = store.index("endedAt");
  let kept = 0;

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(null, "prev");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }

      kept += 1;
      if (kept > maxStoredRoundAnalyses) {
        cursor.delete();
      }
      cursor.continue();
    };
  });
};

export const saveRoundAnalysis = async (analysis: RoundAnalysis) => {
  if (!("indexedDB" in window)) return false;

  let database: IDBDatabase | null = null;

  try {
    database = await openRoundAnalysisDatabase();
    const transaction = database.transaction(roundAnalysesStoreName, "readwrite");
    await requestToPromise(transaction.objectStore(roundAnalysesStoreName).put(analysis));
    await pruneOldRoundAnalyses(database);
    return true;
  } catch {
    return false;
  } finally {
    database?.close();
  }
};

export const loadRecentRoundAnalyses = async (limit = 100) => {
  if (!("indexedDB" in window)) return null;

  let database: IDBDatabase | null = null;

  try {
    database = await openRoundAnalysisDatabase();
    const transaction = database.transaction(roundAnalysesStoreName, "readonly");
    const index = transaction.objectStore(roundAnalysesStoreName).index("endedAt");
    const analyses: RoundAnalysis[] = [];

    return await new Promise<RoundAnalysis[]>((resolve, reject) => {
      const request = index.openCursor(null, "prev");

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || analyses.length >= limit) {
          resolve(analyses);
          return;
        }

        analyses.push(cursor.value);
        cursor.continue();
      };
    });
  } catch {
    return null;
  } finally {
    database?.close();
  }
};

const getFocusWords = ({
  completedWordCount,
  errorWordIndexes,
  hintedWordIndexes,
  settings,
  sourceWords,
  typedWords,
}: Pick<
  RoundAnalysisInput,
  | "completedWordCount"
  | "errorWordIndexes"
  | "hintedWordIndexes"
  | "settings"
  | "sourceWords"
  | "typedWords"
>) => {
  const focusWords: RoundFocusWord[] = [];
  const addFocusWord = (index: number, reason: RoundFocusWord["reason"]) => {
    if (index < 0 || index >= sourceWords.length) return;
    if (focusWords.some((word) => word.index === index)) return;

    focusWords.push({
      expected: sourceWords[index],
      index,
      reason,
      typed: typedWords[index] ?? "",
    });
  };

  Array.from(errorWordIndexes)
    .sort((first, second) => first - second)
    .forEach((index) => addFocusWord(index, "missed"));

  for (let index = 0; index < completedWordCount; index += 1) {
    if (!wordsMatch(typedWords[index] ?? "", sourceWords[index] ?? "", settings)) {
      addFocusWord(index, "missed");
    }
  }

  Array.from(hintedWordIndexes)
    .sort((first, second) => first - second)
    .forEach((index) => addFocusWord(index, "hinted"));

  if (completedWordCount < sourceWords.length) {
    addFocusWord(completedWordCount, "unreached");
  }

  return focusWords.slice(0, 8);
};

const getStrengths = (
  metrics: RoundAnalysisMetrics,
  input: RoundAnalysisInput,
) => {
  const strengths: string[] = [];

  if (input.endReason === "completed") {
    strengths.push("You finished the passage.");
  } else if (metrics.completedWords > 0) {
    strengths.push(`You banked feedback on ${metrics.completedWords} words.`);
  }

  if (metrics.accuracy >= 95 && metrics.completedWords > 0) {
    strengths.push("Accuracy stayed very clean.");
  }

  if (metrics.hints === 0 && metrics.completedWords > 0) {
    strengths.push("No hints used.");
  }

  if (input.isNewBest) {
    strengths.push("This was a new personal best.");
  }

  if (metrics.wordsPerMinute >= 45 && metrics.completedWords >= 5) {
    strengths.push("Pace was above the target speed.");
  }

  return strengths.slice(0, 3);
};

const getNextSteps = (
  metrics: RoundAnalysisMetrics,
  input: RoundAnalysisInput,
  focusWords: RoundFocusWord[],
) => {
  const nextSteps: string[] = [];
  const missedWords = focusWords.filter((word) => word.reason === "missed");
  const hintedWords = focusWords.filter((word) => word.reason === "hinted");

  if (missedWords.length > 0) {
    nextSteps.push(
      `Rehearse ${missedWords
        .slice(0, 3)
        .map((word) => `"${word.expected}"`)
        .join(", ")} before the next attempt.`,
    );
  }

  if (hintedWords.length > 0 || input.hadFullReveal) {
    nextSteps.push("Try one pass with fewer reveals to strengthen recall.");
  }

  if (input.endReason === "reset" && metrics.progress < 100) {
    nextSteps.push("Restart from the first unreached word, then run the full passage.");
  }

  if (metrics.wordsPerMinute < 35 && metrics.completedWords >= 5) {
    nextSteps.push("Slowly recite the sentence once, then type it at a steady pace.");
  }

  if (nextSteps.length === 0) {
    nextSteps.push("Repeat the passage once more and aim to keep the same accuracy.");
  }

  return nextSteps.slice(0, 3);
};

export const createRoundAnalysis = (input: RoundAnalysisInput): RoundAnalysis => {
  const completedWords = Math.min(input.completedWordCount, input.sourceWords.length);
  const progress = input.sourceWords.length
    ? clampPercent((completedWords / input.sourceWords.length) * 100)
    : 0;
  const mistakes = input.errorWordIndexes.size;
  const checkedWords = Math.max(completedWords, 0);
  const incorrectCompletedWords = input.sourceWords
    .slice(0, checkedWords)
    .filter(
      (word, index) =>
        !wordsMatch(input.typedWords[index] ?? "", word, input.settings),
    ).length;
  const accuracy = checkedWords
    ? clampPercent(((checkedWords - incorrectCompletedWords) / checkedWords) * 100)
    : 100;
  const minutes = Math.max(input.elapsedMs / 60000, 0.05);
  const wordsPerMinute =
    minutes > 0 && completedWords > 0
      ? Math.round((completedWords / minutes) * 10) / 10
      : 0;
  const metrics = {
    accuracy,
    completedWords,
    elapsedMs: input.elapsedMs,
    hints: input.hintedWordIndexes.size,
    mistakes,
    progress,
    wordsPerMinute,
  };
  const focusWords = getFocusWords(input);
  const strengths = getStrengths(metrics, input);
  const nextSteps = getNextSteps(metrics, input, focusWords);
  const headline =
    input.endReason === "completed"
      ? `Locked in at ${formatPercent(accuracy)} accuracy with ${metrics.hints} hints.`
      : `Saved a reset at ${formatPercent(progress)} complete, so the attempt can still teach you.`;

  return {
    breakdown: input.breakdown,
    createdAt: Date.now(),
    endedAt: input.endedAt,
    endReason: input.endReason,
    focusWords,
    headline,
    id: input.id,
    isNewBest: input.isNewBest,
    metrics,
    nextSteps,
    sourceKey: sourceKeyFrom(input.sourceText),
    sourcePreview: sourcePreviewFrom(input.sourceText),
    strengths,
    wordCount: input.sourceWords.length,
    xpGained: input.xpGained,
  };
};
