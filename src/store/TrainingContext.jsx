import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  calculateLogScore,
  getConditionLabel,
  getLogRounds,
  getWeekEnd,
  getWeekStart,
  isThisWeek,
  normalizeLogScores,
} from "../utils/trainingStats";
import { sanitizeProfileForStorage } from "../utils/privacy";
import {
  createBackupPayload,
  mergeFeed,
  mergeLogs,
  parseBackupFileText,
  validateBackupPayload,
} from "../utils/dataBackup";
import { validateBodySpecs } from "../utils/bodySpecs";
import { syncListingFromProfile } from "../utils/sparringPartners";
import { registerNickname } from "../api/nicknameApi";

const TrainingContext = createContext(null);

export const GUEST_USER_ID = "local-user";

const LEGACY_STORAGE_KEYS = {
  logs: "fitness-league-logs",
  feed: "fitness-league-feed",
  tier: "fitness-league-tier",
  mode: "fitness-league-mode",
  profile: "fitness-league-profile",
};

function getStorageKeys(userId) {
  if (!userId || userId === GUEST_USER_ID) {
    return LEGACY_STORAGE_KEYS;
  }

  return {
    logs: `fitness-league-logs-${userId}`,
    feed: `fitness-league-feed-${userId}`,
    tier: `fitness-league-tier-${userId}`,
    mode: `fitness-league-mode-${userId}`,
    profile: `fitness-league-profile-${userId}`,
  };
}

function migrateLegacyStorage(userId) {
  const keys = getStorageKeys(userId);

  if (localStorage.getItem(keys.logs)) {
    return;
  }

  if (!localStorage.getItem(LEGACY_STORAGE_KEYS.logs)) {
    return;
  }

  Object.entries(LEGACY_STORAGE_KEYS).forEach(([field, legacyKey]) => {
    const value = localStorage.getItem(legacyKey);

    if (value !== null) {
      localStorage.setItem(keys[field], value);
    }
  });
}

function loadUserState(userId) {
  migrateLegacyStorage(userId);

  const keys = getStorageKeys(userId);
  const savedProfile = loadStorage(keys.profile, DEFAULT_PROFILE);

  return {
    logs: normalizeLogScores(loadStorage(keys.logs, [])),
    feed: loadStorage(keys.feed, []),
    profile: {
      ...DEFAULT_PROFILE,
      ...savedProfile,
    },
    tierId: localStorage.getItem(keys.tier) || "bronze",
    mode: localStorage.getItem(keys.mode) || "solo",
  };
}

const DAILY_SCORE_LIMIT = 120;

const DEFAULT_PROFILE = {
  nickname: "나",
  bio: "아직 초보지만 링에 계속 올라가는 중",
  photo: "",
  heightCm: null,
  weightKg: null,
  reachCm: null,
  weightClass: "라이트급",
  experience: "1년차",
  sparringStyle: "미디엄",
  area: "",
  contact: "",
  onboardingComplete: false,
};

const DIFFICULTY_LABEL = {
  easy: "가볍게",
  normal: "보통",
  hard: "빡셈",
  crazy: "죽음",
};

const TIERS = [
  {
    id: "bronze",
    name: "브론즈",
    keepScore: 0,
    promoteScore: 150,
  },
  {
    id: "silver",
    name: "실버",
    keepScore: 80,
    promoteScore: 220,
  },
  {
    id: "gold",
    name: "골드",
    keepScore: 150,
    promoteScore: 320,
  },
  {
    id: "platinum",
    name: "플래티넘",
    keepScore: 220,
    promoteScore: 450,
  },
  {
    id: "diamond",
    name: "다이아",
    keepScore: 300,
    promoteScore: 600,
  },
];

const SAMPLE_PLAYERS = [];

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getSeasonInfo() {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  const endMidnight = new Date(weekEnd);
  endMidnight.setHours(0, 0, 0, 0);

  const diffTime = endMidnight.getTime() - todayMidnight.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    startText: getShortDateText(weekStart),
    endText: getShortDateText(weekEnd),
    daysLeft,
  };
}

function getShortDateText(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}.${day}`;
}

function calculateWeeklyScore(logs) {
  const thisWeekLogs = logs.filter((log) => isThisWeek(log.date));
  const scoreByDate = {};

  thisWeekLogs.forEach((log) => {
    const rawScore = calculateLogScore(log);

    if (!scoreByDate[log.date]) {
      scoreByDate[log.date] = 0;
    }

    scoreByDate[log.date] += rawScore;
  });

  return Object.values(scoreByDate).reduce((total, dailyScore) => {
    return total + Math.min(dailyScore, DAILY_SCORE_LIMIT);
  }, 0);
}

function getTierById(tierId) {
  return TIERS.find((tier) => tier.id === tierId) || TIERS[0];
}

function getNextTier(currentTierId) {
  const currentIndex = TIERS.findIndex((tier) => tier.id === currentTierId);

  if (currentIndex === -1 || currentIndex === TIERS.length - 1) {
    return null;
  }

  return TIERS[currentIndex + 1];
}

function getTierStatus(currentTier, weeklyScore) {
  if (weeklyScore >= currentTier.promoteScore) {
    return {
      type: "promote",
      title: "승급 가능",
      message: "이번 주 기준을 넘겼어요. 시즌 종료 시 승급 후보입니다.",
    };
  }

  if (weeklyScore >= currentTier.keepScore) {
    return {
      type: "safe",
      title: "티어 안전",
      message: "이번 주 티어 유지 기준을 넘겼어요.",
    };
  }

  return {
    type: "danger",
    title: "강등 위험",
    message: "이번 주 유지 점수가 부족해요. 조금만 더 움직이면 됩니다.",
  };
}

function loadStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function getFinalRounds(logLike) {
  if (typeof logLike === "object") {
    return getLogRounds(logLike);
  }

  return Number(logLike || 0);
}

function getRecordSourceLabel(source) {
  if (source === "timer") return "자동 기록";
  if (source === "manual") return "수동 기록";
  return "기록";
}

export function TrainingProvider({ children, userId = GUEST_USER_ID }) {
  const storageKeys = useMemo(() => getStorageKeys(userId), [userId]);

  const [logs, setLogs] = useState(() => loadUserState(userId).logs);
  const [feed, setFeed] = useState(() => loadUserState(userId).feed);
  const [profile, setProfile] = useState(() => loadUserState(userId).profile);
  const [tierId, setTierId] = useState(() => loadUserState(userId).tierId);
  const [mode, setMode] = useState(() => loadUserState(userId).mode);

  useEffect(() => {
    const nextState = loadUserState(userId);
    setLogs(nextState.logs);
    setFeed(nextState.feed);
    setProfile(nextState.profile);
    setTierId(nextState.tierId);
    setMode(nextState.mode);
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(storageKeys.logs, JSON.stringify(logs));
  }, [logs, storageKeys.logs]);

  useEffect(() => {
    localStorage.setItem(storageKeys.feed, JSON.stringify(feed));
  }, [feed, storageKeys.feed]);

  useEffect(() => {
    localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
  }, [profile, storageKeys.profile]);

  useEffect(() => {
    localStorage.setItem(storageKeys.tier, tierId);
  }, [tierId, storageKeys.tier]);

  useEffect(() => {
    localStorage.setItem(storageKeys.mode, mode);
  }, [mode, storageKeys.mode]);

  const weeklyLogs = useMemo(() => {
    return logs.filter((log) => isThisWeek(log.date));
  }, [logs]);

  const weeklyScore = useMemo(() => {
    return calculateWeeklyScore(logs);
  }, [logs]);

  const currentTier = getTierById(tierId);
  const nextTier = getNextTier(tierId);
  const tierStatus = getTierStatus(currentTier, weeklyScore);
  const isLeagueMode = mode === "league";

  const seasonInfo = useMemo(() => {
    return getSeasonInfo();
  }, []);

  const rankings = useMemo(() => {
    const me = {
      id: "me",
      name: profile.nickname || "나",
      score: weeklyScore,
      isMe: true,
    };

    return [...SAMPLE_PLAYERS, me].sort((a, b) => b.score - a.score);
  }, [weeklyScore, profile.nickname]);

  function updateProfile(nextProfile) {
    setProfile((prevProfile) =>
      sanitizeProfileForStorage({
        ...prevProfile,
        ...nextProfile,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  function updateNickname(nickname) {
    updateProfile({
      nickname: nickname || "나",
    });
  }

  function updateBio(bio) {
    updateProfile({
      bio,
    });
  }

  function updateProfilePhoto(photo) {
    updateProfile({
      photo,
    });
  }

  function removeProfilePhoto() {
    updateProfile({
      photo: "",
    });
  }

  async function completeOnboarding(form) {
    const specs = validateBodySpecs(form);
    await registerNickname(specs.nickname, userId);

    const nextProfile = sanitizeProfileForStorage({
      ...profile,
      ...specs,
    });

    setProfile(nextProfile);
    syncListingFromProfile(nextProfile, userId);

    return nextProfile;
  }

  function addLog({
    type,
    minutes,
    duration,
    difficulty = "normal",
    condition = "normal",
    memo = "",
    date,
    rounds = 0,
    totalRounds = 0,
    completedRounds = 0,
    publicComment = "",
    source,
  }) {
    const finalMinutes = Number(minutes || duration || 0);
    const finalRounds = getFinalRounds({
      rounds,
      totalRounds,
      completedRounds,
    });
    const finalDate = date || getTodayString();
    const finalType = type || "복싱 훈련";

    const finalSource =
      source || (finalRounds > 0 && memo.includes("라운드") ? "timer" : "manual");

    const newLog = {
      id: crypto.randomUUID(),
      date: finalDate,
      type: finalType,
      minutes: finalMinutes,
      duration: finalMinutes,
      rounds: finalRounds,
      totalRounds: finalRounds,
      completedRounds: finalRounds,
      difficulty,
      difficultyLabel: DIFFICULTY_LABEL[difficulty] || "보통",
      condition: condition || "normal",
      conditionLabel: getConditionLabel(condition),
      memo,
      publicComment,
      source: finalSource,
      sourceLabel: getRecordSourceLabel(finalSource),
      isEdited: false,
      score: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newLog.score = calculateLogScore(newLog);

    setLogs((prevLogs) => [newLog, ...prevLogs]);

    return newLog;
  }

  function updateLog(logId, updates) {
    setLogs((prevLogs) => {
      return prevLogs.map((log) => {
        if (log.id !== logId) {
          return log;
        }

        const nextDifficulty = updates.difficulty || log.difficulty || "normal";
        const nextCondition = updates.condition || log.condition || "normal";
        const nextMinutes = Number(
          updates.minutes ?? updates.duration ?? log.minutes ?? log.duration ?? 0
        );

        const nextRounds = getFinalRounds({
          rounds: updates.rounds ?? log.rounds,
          totalRounds: updates.totalRounds ?? log.totalRounds,
          completedRounds: updates.completedRounds ?? log.completedRounds,
        });

        const nextSource = updates.source || log.source || "manual";

        const nextLog = {
          ...log,
          ...updates,
          minutes: nextMinutes,
          duration: nextMinutes,
          rounds: nextRounds,
          totalRounds: nextRounds,
          completedRounds: nextRounds,
          difficulty: nextDifficulty,
          difficultyLabel: DIFFICULTY_LABEL[nextDifficulty] || "보통",
          condition: nextCondition,
          conditionLabel: getConditionLabel(nextCondition),
          source: nextSource,
          sourceLabel: getRecordSourceLabel(nextSource),
          isEdited: true,
          updatedAt: new Date().toISOString(),
        };

        return {
          ...nextLog,
          score: calculateLogScore(nextLog),
        };
      });
    });
  }

  function deleteLog(logId) {
    setLogs((prevLogs) => {
      return prevLogs.filter((log) => log.id !== logId);
    });

    setFeed((prevFeed) => {
      return prevFeed.filter((item) => item.id !== logId && item.logId !== logId);
    });
  }

  function resetAllLogs() {
    setLogs([]);
    setFeed([]);
  }

  function shareToFeed(logId) {
    const targetLog = logs.find((log) => log.id === logId);

    if (!targetLog) return;

    const alreadyShared = feed.some((item) => item.id === logId);

    if (alreadyShared) return;

    const newFeedItem = {
      ...targetLog,
      feedId: crypto.randomUUID(),
      sharedAt: new Date().toISOString(),
    };

    setFeed((prevFeed) => [newFeedItem, ...prevFeed]);
  }

  function buildBackupPayload() {
    return createBackupPayload({
      logs,
      feed,
      profile,
      tierId,
      mode,
    });
  }

  function applyBackupData(data, { merge = false } = {}) {
    if (!data || typeof data !== "object") {
      throw new Error("백업 데이터가 비어 있습니다.");
    }

    if (!Array.isArray(data.logs)) {
      throw new Error("훈련 기록 데이터가 없습니다.");
    }

    const nextLogs = merge
      ? normalizeLogScores(mergeLogs(logs, data.logs))
      : normalizeLogScores(data.logs);

    const nextFeed = merge ? mergeFeed(feed, data.feed || []) : data.feed || [];
    const nextProfile = merge
      ? { ...profile, ...data.profile }
      : { ...DEFAULT_PROFILE, ...data.profile };

    setLogs(nextLogs);
    setFeed(nextFeed);
    setProfile(nextProfile);

    if (!merge) {
      setTierId(data.tierId || "bronze");
      setMode(data.mode || "solo");
    }

    return {
      logCount: nextLogs.length,
      merged: merge,
    };
  }

  function restoreBackupFromPayload(payload, options = {}) {
    const validated = validateBackupPayload(payload);
    return applyBackupData(validated.data, options);
  }

  function restoreBackupFromText(text, options = {}) {
    const payload = parseBackupFileText(text);
    return restoreBackupFromPayload(payload, options);
  }

  const value = {
    userId,
    logs,
    feed,

    profile,
    updateProfile,
    updateNickname,
    updateBio,
    updateProfilePhoto,
    removeProfilePhoto,
    completeOnboarding,

    addLog,
    updateLog,
    deleteLog,
    resetAllLogs,
    shareToFeed,
    buildBackupPayload,
    restoreBackupFromPayload,
    restoreBackupFromText,

    weeklyLogs,
    weeklyScore,
    rankings,
    seasonInfo,

    currentTier,
    nextTier,
    tierStatus,
    tiers: TIERS,
    setTierId,

    mode,
    setMode,
    isLeagueMode,

    dailyScoreLimit: DAILY_SCORE_LIMIT,
    difficultyLabel: DIFFICULTY_LABEL,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);

  if (!context) {
    throw new Error("useTraining must be used inside TrainingProvider");
  }

  return context;
}