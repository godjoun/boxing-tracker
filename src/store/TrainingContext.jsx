import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  const TrainingContext = createContext(null);
  
  const STORAGE_KEY = "fitness-league-logs";
  const FEED_STORAGE_KEY = "fitness-league-feed";
  const TIER_STORAGE_KEY = "fitness-league-tier";
  const MODE_STORAGE_KEY = "fitness-league-mode";
  const PROFILE_STORAGE_KEY = "fitness-league-profile";
  
  const DAILY_SCORE_LIMIT = 120;
  
  const DEFAULT_PROFILE = {
    nickname: "나",
    bio: "아직 초보지만 링에 계속 올라가는 중",
    photo: "",
  };
  
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
  
  function getWeekEnd(date = new Date()) {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
  
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  
    return weekEnd;
  }
  
  function getShortDateText(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    return `${month}.${day}`;
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
  
  function isThisWeek(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    const weekStart = getWeekStart();
    const nextWeekStart = new Date(weekStart);
  
    nextWeekStart.setDate(weekStart.getDate() + 7);
  
    return date >= weekStart && date < nextWeekStart;
  }
  
  function calculateLogScore(minutes, difficulty) {
    const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1;
    return Math.round(Number(minutes || 0) * multiplier);
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
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  function getFinalRounds({ rounds, totalRounds, completedRounds }) {
    return Number(rounds || totalRounds || completedRounds || 0);
  }
  
  function getRecordSourceLabel(source) {
    if (source === "timer") return "자동 기록";
    if (source === "manual") return "수동 기록";
    return "기록";
  }
  
  export function TrainingProvider({ children }) {
    const [logs, setLogs] = useState(() => {
      return loadStorage(STORAGE_KEY, []);
    });
  
    const [feed, setFeed] = useState(() => {
      return loadStorage(FEED_STORAGE_KEY, []);
    });
  
    const [profile, setProfile] = useState(() => {
      const savedProfile = loadStorage(PROFILE_STORAGE_KEY, DEFAULT_PROFILE);
  
      return {
        ...DEFAULT_PROFILE,
        ...savedProfile,
      };
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
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }, [profile]);
  
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
      setProfile((prevProfile) => ({
        ...prevProfile,
        ...nextProfile,
        updatedAt: new Date().toISOString(),
      }));
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
  
    function addLog({
      type,
      minutes,
      duration,
      difficulty = "normal",
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
  
      const finalSource =
        source || (finalRounds > 0 && memo.includes("라운드") ? "timer" : "manual");
  
      const newLog = {
        id: crypto.randomUUID(),
        date: finalDate,
        type: type || "복싱 훈련",
        minutes: finalMinutes,
        duration: finalMinutes,
        rounds: finalRounds,
        totalRounds: finalRounds,
        completedRounds: finalRounds,
        difficulty,
        difficultyLabel: DIFFICULTY_LABEL[difficulty] || "보통",
        memo,
        publicComment,
        source: finalSource,
        sourceLabel: getRecordSourceLabel(finalSource),
        isEdited: false,
        score: calculateLogScore(finalMinutes, difficulty),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
  
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
          const nextMinutes = Number(
            updates.minutes ?? updates.duration ?? log.minutes ?? log.duration ?? 0
          );
  
          const nextRounds = getFinalRounds({
            rounds: updates.rounds ?? log.rounds,
            totalRounds: updates.totalRounds ?? log.totalRounds,
            completedRounds: updates.completedRounds ?? log.completedRounds,
          });
  
          const nextSource = updates.source || log.source || "manual";
  
          return {
            ...log,
            ...updates,
            minutes: nextMinutes,
            duration: nextMinutes,
            rounds: nextRounds,
            totalRounds: nextRounds,
            completedRounds: nextRounds,
            difficulty: nextDifficulty,
            difficultyLabel: DIFFICULTY_LABEL[nextDifficulty] || "보통",
            source: nextSource,
            sourceLabel: getRecordSourceLabel(nextSource),
            score: calculateLogScore(nextMinutes, nextDifficulty),
            isEdited: true,
            updatedAt: new Date().toISOString(),
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
  
    const value = {
      logs,
      feed,
  
      profile,
      updateProfile,
      updateNickname,
      updateBio,
      updateProfilePhoto,
      removeProfilePhoto,
  
      addLog,
      updateLog,
      deleteLog,
      resetAllLogs,
      shareToFeed,
  
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