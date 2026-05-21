const gameProfileStorageKey = "verbatim.gameProfile.v1";

export type MedalId =
  | "first-lock"
  | "clean-lock"
  | "no-hints"
  | "personal-best"
  | "five-locks";

export type Medal = {
  description: string;
  id: MedalId;
  label: string;
};

export type GameProfile = {
  completedRuns: number;
  totalXp: number;
  unlockedMedals: MedalId[];
};

type RunSummary = {
  elapsedMs: number;
  errorWords: number;
  hadMistake: boolean;
  hints: number;
  isNewBest: boolean;
  wordCount: number;
  wordScore: number; // per-word score with streak multipliers already applied
};

export type RunBreakdown = {
  wordScore: number;
  speedBonus: number;
  cleanBonus: number;
  hintBonus: number;
  bestBonus: number;
  hintPenalty: number;
  errorPenalty: number;
  total: number;
};

export const medals: Record<MedalId, Medal> = {
  "first-lock": {
    description: "Complete a passage.",
    id: "first-lock",
    label: "First lock",
  },
  "clean-lock": {
    description: "Complete without a wrong finished word.",
    id: "clean-lock",
    label: "Clean lock",
  },
  "no-hints": {
    description: "Complete without revealing hints.",
    id: "no-hints",
    label: "No hints",
  },
  "personal-best": {
    description: "Beat a personal best.",
    id: "personal-best",
    label: "Personal best",
  },
  "five-locks": {
    description: "Complete five passages.",
    id: "five-locks",
    label: "Five locks",
  },
};

export const defaultGameProfile: GameProfile = {
  completedRuns: 0,
  totalXp: 0,
  unlockedMedals: [],
};

const isMedalId = (value: unknown): value is MedalId =>
  typeof value === "string" && value in medals;

const isGameProfile = (value: unknown): value is GameProfile => {
  if (!value || typeof value !== "object") return false;

  const profile = value as Partial<GameProfile>;
  return (
    typeof profile.completedRuns === "number" &&
    Number.isFinite(profile.completedRuns) &&
    typeof profile.totalXp === "number" &&
    Number.isFinite(profile.totalXp) &&
    Array.isArray(profile.unlockedMedals)
  );
};

export const loadGameProfile = () => {
  try {
    const savedProfile = window.localStorage.getItem(gameProfileStorageKey);
    if (!savedProfile) return defaultGameProfile;

    const parsed = JSON.parse(savedProfile);
    if (!isGameProfile(parsed)) return defaultGameProfile;

    return {
      completedRuns: Math.max(0, Math.floor(parsed.completedRuns)),
      totalXp: Math.max(0, Math.floor(parsed.totalXp)),
      unlockedMedals: parsed.unlockedMedals.filter(isMedalId),
    };
  } catch {
    return defaultGameProfile;
  }
};

const saveGameProfile = (profile: GameProfile) => {
  try {
    window.localStorage.setItem(gameProfileStorageKey, JSON.stringify(profile));
  } catch {
    // The run can still finish even if private browsing or storage limits block saves.
  }
};

// ─── Level progression ───────────────────────────────────────────────────────

export const MAX_LEVEL = 100;

// XP required to advance from level `n` to level `n+1`.
// For levels beyond MAX_LEVEL the cost is fixed at xpForStep(MAX_LEVEL).
const xpForStep = (level: number): number =>
  Math.round(1000 * Math.pow(Math.min(level, MAX_LEVEL), 0.75));

// LEVEL_THRESHOLDS[i] = total XP needed to reach level i + 1.
// Index 0 → level 1 (0 XP), index 99 → level 100 (sum of steps 1–99).
const LEVEL_THRESHOLDS: readonly number[] = (() => {
  const t: number[] = [0];
  for (let n = 1; n < MAX_LEVEL; n++) t.push(t[n - 1] + xpForStep(n));
  return t;
})();

export const getLevel = (totalXp: number): number => {
  const capXp = LEVEL_THRESHOLDS[MAX_LEVEL - 1];
  if (totalXp >= capXp) {
    return MAX_LEVEL + Math.floor((totalXp - capXp) / xpForStep(MAX_LEVEL));
  }
  // Binary search for the highest threshold index ≤ totalXp
  let lo = 0;
  let hi = MAX_LEVEL - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (LEVEL_THRESHOLDS[mid] <= totalXp) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
};

// Returns a 0–1 fraction representing progress through the current level.
export const getLevelProgress = (totalXp: number): number => {
  const level = getLevel(totalXp);
  const capXp = LEVEL_THRESHOLDS[MAX_LEVEL - 1];

  if (level >= MAX_LEVEL) {
    const flatRate = xpForStep(MAX_LEVEL);
    return ((totalXp - capXp) % flatRate) / flatRate;
  }

  const xpAtLevel = LEVEL_THRESHOLDS[level - 1];
  const xpAtNext = LEVEL_THRESHOLDS[level]; // level is 1-indexed; thresholds is 0-indexed
  return (totalXp - xpAtLevel) / (xpAtNext - xpAtLevel);
};

// ─── Streak multiplier ───────────────────────────────────────────────────────

// Normal mode: streak 0–2 → 1×, 3–5 → 1.25×, 6–9 → 1.5×, 10–14 → 2×, 15+ → 2.5×
// Penalty mode (full reveal used): 5 clean words to recover to 1×, max 2×
export const getStreakMultiplier = (streak: number, penaltyMode: boolean): number => {
  if (penaltyMode) {
    if (streak < 5) return 0.5;
    if (streak < 8) return 1.0;
    if (streak < 12) return 1.25;
    if (streak < 16) return 1.5;
    return 2.0;
  }
  if (streak < 3) return 1.0;
  if (streak < 6) return 1.25;
  if (streak < 10) return 1.5;
  if (streak < 15) return 2.0;
  return 2.5;
};

// ─── Run scoring ─────────────────────────────────────────────────────────────

// Each word is worth 100 pts × the streak multiplier active when it was typed.
export const POINTS_PER_WORD = 100;

const getSpeedBonus = ({ elapsedMs, wordCount }: RunSummary) => {
  if (wordCount < 5) return 0;

  const wordsPerMinute = wordCount / Math.max(elapsedMs / 60000, 0.05);
  const aboveTargetWpm = Math.max(0, wordsPerMinute - 45);
  const passageCap = Math.min(500, wordCount * 10);

  return Math.min(passageCap, Math.round(aboveTargetWpm * 4));
};

export const getRunBreakdown = (run: RunSummary): RunBreakdown => {
  const speedBonus = getSpeedBonus(run);
  const cleanBonus = run.hadMistake ? 0 : 250;
  const hintBonus = run.hints === 0 ? 250 : 0;
  const bestBonus = run.isNewBest ? 500 : 0;
  const hintPenalty = run.hints * 50;
  const errorPenalty = run.errorWords * 50;
  const total = Math.max(
    0,
    run.wordScore + speedBonus + cleanBonus + hintBonus + bestBonus - hintPenalty - errorPenalty,
  );
  return {
    wordScore: run.wordScore,
    speedBonus,
    cleanBonus,
    hintBonus,
    bestBonus,
    hintPenalty,
    errorPenalty,
    total,
  };
};

export const getRunScore = (run: RunSummary) => getRunBreakdown(run).total;

const getUnlockedMedalsForRun = (
  run: RunSummary,
  completedRuns: number,
): MedalId[] => [
  "first-lock",
  ...(run.hadMistake ? [] : (["clean-lock"] as const)),
  ...(run.hints === 0 ? (["no-hints"] as const) : []),
  ...(run.isNewBest ? (["personal-best"] as const) : []),
  ...(completedRuns >= 5 ? (["five-locks"] as const) : []),
];

export const saveGameCompletion = (run: RunSummary) => {
  const currentProfile = loadGameProfile();
  const breakdown = getRunBreakdown(run);
  const xpGained = breakdown.total;
  const completedRuns = currentProfile.completedRuns + 1;
  const nextMedals = getUnlockedMedalsForRun(run, completedRuns);
  const unlockedMedals = Array.from(
    new Set([...currentProfile.unlockedMedals, ...nextMedals]),
  );
  const profile = {
    completedRuns,
    totalXp: currentProfile.totalXp + xpGained,
    unlockedMedals,
  };

  saveGameProfile(profile);

  return {
    breakdown,
    earnedMedals: nextMedals.filter(
      (medal) => !currentProfile.unlockedMedals.includes(medal),
    ),
    profile,
    xpGained,
  };
};
