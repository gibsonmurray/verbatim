import type { Settings } from "./settings";
import { normalizeText } from "./text";

const bestRunsStorageKey = "verbatim.bestRuns.v1";

export type BestRun = {
  completedAt: number;
  elapsedMs: number;
  hints: number;
  wordCount: number;
};

const hashString = (value: string) => {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const practiceSettingsKey = (settings: Settings) =>
  JSON.stringify({
    accentSensitive: settings.accentSensitive,
    autoCapitalize: settings.autoCapitalize,
    autoFillFormatting: settings.autoFillFormatting,
    autoRevealCurrentWord: settings.autoRevealCurrentWord,
    caseSensitive: settings.caseSensitive,
    punctuationSensitive: settings.punctuationSensitive,
  });

const isBestRun = (run: BestRun, currentBest: BestRun | null) =>
  !currentBest ||
  run.elapsedMs < currentBest.elapsedMs ||
  (run.elapsedMs === currentBest.elapsedMs && run.hints < currentBest.hints);

const isStoredBestRun = (value: unknown): value is BestRun => {
  if (!value || typeof value !== "object") return false;

  const run = value as Partial<BestRun>;
  return (
    typeof run.completedAt === "number" &&
    Number.isFinite(run.completedAt) &&
    typeof run.elapsedMs === "number" &&
    Number.isFinite(run.elapsedMs) &&
    typeof run.hints === "number" &&
    Number.isFinite(run.hints) &&
    typeof run.wordCount === "number" &&
    Number.isFinite(run.wordCount)
  );
};

const loadBestRuns = () => {
  try {
    const savedRuns = window.localStorage.getItem(bestRunsStorageKey);
    if (!savedRuns) return {};

    const parsed = JSON.parse(savedRuns);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, run]) => isStoredBestRun(run)),
    ) as Record<string, BestRun>;
  } catch {
    return {};
  }
};

export const getBestRunKey = (sourceText: string, settings: Settings) =>
  [
    "source",
    hashString(normalizeText(sourceText)),
    "settings",
    hashString(practiceSettingsKey(settings)),
  ].join(":");

export const loadBestRun = (key: string) => loadBestRuns()[key] ?? null;

export const saveCompletedRun = (
  key: string,
  run: BestRun,
): { bestRun: BestRun; isNewBest: boolean } => {
  const bestRuns = loadBestRuns();
  const currentBest = bestRuns[key] ?? null;
  const isNewBest = isBestRun(run, currentBest);

  if (!isNewBest && currentBest) {
    return { bestRun: currentBest, isNewBest: false };
  }

  bestRuns[key] = run;

  try {
    window.localStorage.setItem(bestRunsStorageKey, JSON.stringify(bestRuns));
  } catch {
    return { bestRun: run, isNewBest };
  }

  return { bestRun: run, isNewBest };
};

export const formatElapsedTime = (elapsedMs: number) => {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const totalTenths = Math.floor(safeElapsedMs / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
};
