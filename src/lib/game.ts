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
  bestStreak: number;
  completedRuns: number;
  streak: number;
  totalXp: number;
  unlockedMedals: MedalId[];
};

type RunSummary = {
  elapsedMs: number;
  hadMistake: boolean;
  hints: number;
  isNewBest: boolean;
  wordCount: number;
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
  bestStreak: 0,
  completedRuns: 0,
  streak: 0,
  totalXp: 0,
  unlockedMedals: [],
};

const isMedalId = (value: unknown): value is MedalId =>
  typeof value === "string" && value in medals;

const isGameProfile = (value: unknown): value is GameProfile => {
  if (!value || typeof value !== "object") return false;

  const profile = value as Partial<GameProfile>;
  return (
    typeof profile.bestStreak === "number" &&
    Number.isFinite(profile.bestStreak) &&
    typeof profile.completedRuns === "number" &&
    Number.isFinite(profile.completedRuns) &&
    typeof profile.streak === "number" &&
    Number.isFinite(profile.streak) &&
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
      bestStreak: Math.max(0, Math.floor(parsed.bestStreak)),
      completedRuns: Math.max(0, Math.floor(parsed.completedRuns)),
      streak: Math.max(0, Math.floor(parsed.streak)),
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

export const getLevel = (totalXp: number) => Math.floor(totalXp / 1000) + 1;

export const getLevelProgress = (totalXp: number) => totalXp % 1000;

const getSpeedBonus = ({ elapsedMs, wordCount }: RunSummary) => {
  if (!wordCount) return 0;

  const wordsPerMinute = wordCount / Math.max(elapsedMs / 60000, 0.1);

  return Math.min(500, Math.round(wordsPerMinute * 3));
};

export const getRunScore = (run: RunSummary) => {
  const base = run.wordCount * 100;
  const cleanBonus = run.hadMistake ? 0 : 250;
  const hintBonus = run.hints === 0 ? 250 : 0;
  const bestBonus = run.isNewBest ? 500 : 0;
  const hintPenalty = run.hints * 50;

  return Math.max(
    0,
    base + cleanBonus + hintBonus + bestBonus + getSpeedBonus(run) - hintPenalty,
  );
};

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
  const xpGained = getRunScore(run);
  const completedRuns = currentProfile.completedRuns + 1;
  const streak = currentProfile.streak + 1;
  const nextMedals = getUnlockedMedalsForRun(run, completedRuns);
  const unlockedMedals = Array.from(
    new Set([...currentProfile.unlockedMedals, ...nextMedals]),
  );
  const profile = {
    bestStreak: Math.max(currentProfile.bestStreak, streak),
    completedRuns,
    streak,
    totalXp: currentProfile.totalXp + xpGained,
    unlockedMedals,
  };

  saveGameProfile(profile);

  return {
    earnedMedals: nextMedals.filter(
      (medal) => !currentProfile.unlockedMedals.includes(medal),
    ),
    profile,
    xpGained,
  };
};
