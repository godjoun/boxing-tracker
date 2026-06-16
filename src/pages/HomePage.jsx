import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fitness-league-logs";

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLogDate(log) {
  const value =
    log.date ||
    log.createdAt ||
    log.completedAt ||
    log.timestamp ||
    log.time;

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return getTodayKey(date);
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function getRounds(log) {
  const value =
    log.rounds ||
    log.round ||
    log.totalRounds ||
    log.completedRounds ||
    log.sets ||
    log.count ||
    0;

  return Number(value) || 0;
}

function getTrainingName(log) {
  return log.name || log.type || log.exercise || log.title || "복싱 훈련";
}

function getTier(totalRounds, totalLogs) {
  if (totalRounds >= 100 || totalLogs >= 50) return "CHAMPION";
  if (totalRounds >= 60 || totalLogs >= 30) return "FIGHTER";
  if (totalRounds >= 30 || totalLogs >= 15) return "CONTENDER";
  if (totalRounds >= 10 || totalLogs >= 5) return "AMATEUR";
  return "ROOKIE";
}

function getTierKorean(tier) {
  const labels = {
    ROOKIE: "루키",
    AMATEUR: "아마추어",
    CONTENDER: "컨텐더",
    FIGHTER: "파이터",
    CHAMPION: "챔피언",
  };

  return labels[tier] || "루키";
}

function getNextGoal(totalRounds, totalLogs) {
  if (totalRounds < 10 && totalLogs < 5) {
    return {
      label: "아마추어",
      targetText: "누적 10라운드 또는 훈련 5회",
      progress: Math.max((totalRounds / 10) * 100, (totalLogs / 5) * 100),
    };
  }

  if (totalRounds < 30 && totalLogs < 15) {
    return {
      label: "컨텐더",
      targetText: "누적 30라운드 또는 훈련 15회",
      progress: Math.max((totalRounds / 30) * 100, (totalLogs / 15) * 100),
    };
  }

  if (totalRounds < 60 && totalLogs < 30) {
    return {
      label: "파이터",
      targetText: "누적 60라운드 또는 훈련 30회",
      progress: Math.max((totalRounds / 60) * 100, (totalLogs / 30) * 100),
    };
  }

  if (totalRounds < 100 && totalLogs < 50) {
    return {
      label: "챔피언",
      targetText: "누적 100라운드 또는 훈련 50회",
      progress: Math.max((totalRounds / 100) * 100, (totalLogs / 50) * 100),
    };
  }

  return {
    label: "레전드",
    targetText: "누적 150라운드",
    progress: Math.min(100, (totalRounds / 150) * 100),
  };
}

export default function HomePage({ onStartTraining }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    try {
      const savedLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setLogs(Array.isArray(savedLogs) ? savedLogs : []);
    } catch {
      setLogs([]);
    }
  }, []);

  const stats = useMemo(() => {
    const todayKey = getTodayKey();
    const startOfWeek = getStartOfWeek();

    const totalRounds = logs.reduce((sum, log) => sum + getRounds(log), 0);
    const totalLogs = logs.length;

    const todayLogs = logs.filter((log) => getLogDate(log) === todayKey);

    const weeklyLogs = logs.filter((log) => {
      const logDate = new Date(getLogDate(log));
      return !Number.isNaN(logDate.getTime()) && logDate >= startOfWeek;
    });

    const tier = getTier(totalRounds, totalLogs);
    const nextGoal = getNextGoal(totalRounds, totalLogs);

    return {
      totalRounds,
      totalLogs,
      todayCount: todayLogs.length,
      weeklyCount: weeklyLogs.length,
      tier,
      tierKorean: getTierKorean(tier),
      nextGoal,
      progress: Math.min(100, Math.round(nextGoal.progress)),
      recentLogs: [...logs].slice(0, 4),
    };
  }, [logs]);

  return (
    <main className="home-page">
      <section className="fighter-card">
        <div className="fighter-card-top">
          <div>
            <p className="home-kicker">FIGHTER PROFILE</p>
            <h1>Every round writes your story.</h1>
          </div>

          <div className="fighter-tier-badge">
            <span>{stats.tier}</span>
            <strong>{stats.tierKorean}</strong>
          </div>
        </div>

        <p className="fighter-card-text">
          기록하고, 훈련하고, 증명하세요.
        </p>

        <button className="home-main-button" onClick={onStartTraining}>
          오늘 훈련 시작하기
        </button>
      </section>

      <section className="home-card-grid">
        <div className="home-stat-card">
          <span>누적 라운드</span>
          <strong>{stats.totalRounds}</strong>
          <p>버틴 라운드</p>
        </div>

        <div className="home-stat-card">
          <span>훈련 기록</span>
          <strong>{stats.totalLogs}</strong>
          <p>쌓인 로그</p>
        </div>

        <div className="home-stat-card">
          <span>이번 주</span>
          <strong>{stats.weeklyCount}</strong>
          <p>주간 훈련</p>
        </div>

        <div className="home-stat-card">
          <span>오늘</span>
          <strong>{stats.todayCount}</strong>
          <p>완료 기록</p>
        </div>
      </section>

      <section className="home-mission-card">
        <p className="home-section-label">TODAY ROUTINE</p>
        <h2>오늘의 루틴</h2>

        <div className="mission-list">
          <div className="mission-item">
            <span>01</span>
            <p>라운드 선택</p>
          </div>

          <div className="mission-item">
            <span>02</span>
            <p>타이머 훈련</p>
          </div>

          <div className="mission-item">
            <span>03</span>
            <p>프로필 기록</p>
          </div>
        </div>
      </section>

      <section className="home-progress-card">
        <div className="home-progress-header">
          <div>
            <p className="home-section-label">NEXT LEVEL</p>
            <h2>{stats.nextGoal.label}까지</h2>
            <p>{stats.nextGoal.targetText}</p>
          </div>

          <strong>{stats.progress}%</strong>
        </div>

        <div className="home-progress-bar">
          <div style={{ width: `${stats.progress}%` }} />
        </div>
      </section>

      <section className="home-log-card">
        <p className="home-section-label">RECENT LOG</p>
        <h2>최근 기록</h2>

        {stats.recentLogs.length === 0 ? (
          <div className="home-empty-log">
            아직 기록이 없어. 첫 라운드를 시작해보세요.
          </div>
        ) : (
          <div className="home-log-list">
            {stats.recentLogs.map((log, index) => (
              <div className="home-log-item" key={index}>
                <div>
                  <strong>{getTrainingName(log)}</strong>
                  <span>{getLogDate(log) || "날짜 없음"}</span>
                </div>
                <b>{getRounds(log)}R</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}