import { createContext, useContext, useEffect, useMemo, useState } from "react";

const TrainingContext = createContext(null);

const STORAGE_KEY = "fitness-league-logs";
const FEED_STORAGE_KEY = "fitness-league-feed";
const TIER_STORAGE_KEY = "fitness-league-tier";
const MODE_STORAGE_KEY = "fitness-league-mode";

const DAILY_SCORE_LIMIT = 120;

const DIFFICULTY_MULTIPLIER = {
  easy: 0.8,
  normal: 1,
  hard: 1.2,
  crazy: 1.5,
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

function getWeekStart(date = new Date()) {
  const target = new Date(date);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);

  return target;
}

function isThisWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const weekStart = getWeekStart();
  const nextWeekStart = new Date(weekStart);

  nextWeekStart.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < nextWeekStart;
}

function calculateLogScore(minutes, difficulty) {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1;
  return Math.round(Number(minutes) * multiplier);
}

function calculateWeeklyScore(logs) {
  const thisWeekLogs = logs.filter((log) => isThisWeek(log.date));
  const scoreByDate = {};

  thisWeekLogs.forEach((log) => {
    const minutes = Number(log.minutes || log.duration || 0);
    const difficulty = log.difficulty || "normal";
    const rawScore = calculateLogScore(minutes, difficulty);

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
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

export function TrainingProvider({ children }) {
  const [logs, setLogs] = useState(() => {
    return loadStorage(STORAGE_KEY, []);
  });

  const [feed, setFeed] = useState(() => {
    return loadStorage(FEED_STORAGE_KEY, []);
  });

  const [tierId, setTierId] = useState(() => {
    return localStorage.getItem(TIER_STORAGE_KEY) || "bronze";
  });

  const [mode, setMode] = useState(() => {
    return localStorage.getItem(MODE_STORAGE_KEY) || "solo";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed));
  }, [feed]);

  useEffect(() => {
    localStorage.setItem(TIER_STORAGE_KEY, tierId);
  }, [tierId]);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

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

  const rankings = useMemo(() => {
    const me = {
      id: "me",
      name: "나",
      score: weeklyScore,
      isMe: true,
    };

    return [...SAMPLE_PLAYERS, me].sort((a, b) => b.score - a.score);
  }, [weeklyScore]);

  function addLog({ type, minutes, duration, difficulty = "normal", memo = "", date }) {
    const finalMinutes = Number(minutes || duration || 0);
    const finalDate = date || getTodayString();

    const newLog = {
      id: crypto.randomUUID(),
      date: finalDate,
      type,
      minutes: finalMinutes,
      duration: finalMinutes,
      difficulty,
      difficultyLabel: DIFFICULTY_LABEL[difficulty],
      memo,
      score: calculateLogScore(finalMinutes, difficulty),
      createdAt: new Date().toISOString(),
    };

    setLogs((prevLogs) => [newLog, ...prevLogs]);
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

  const value = {
    logs,
    feed,
    addLog,
    shareToFeed,

    weeklyLogs,
    weeklyScore,
    rankings,

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