import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildTrainingBreakdown } from "../utils/trainingBreakdown";

const HOME_FEATURES_KEY = "fitness-league-home-features";
const DEFAULT_FEATURES = ["fighter-card", "growth", "weekly", "training-log"];

const FEATURES = [
  {
    id: "fighter-card",
    icon: "◆",
    eyebrow: "FIGHTER CARD",
    title: "파이터 카드 만들기",
    description: "오늘의 성장을 한 장의 카드로 남기세요.",
    route: "fighter-card",
  },
  {
    id: "growth",
    icon: "↗",
    eyebrow: "ANALYSIS",
    title: "성장 분석",
    description: "라운드와 훈련 볼륨을 확인하세요.",
    route: "stats",
  },
  {
    id: "weekly",
    icon: "W",
    eyebrow: "WEEKLY",
    title: "주간 리포트",
    description: "이번 주 훈련 요약과 하이라이트.",
    route: "weekly",
  },
  {
    id: "training-log",
    icon: "R",
    eyebrow: "TRAINING LOG",
    title: "훈련 로그",
    description: "지금까지 쌓아온 모든 훈련을 돌아보세요.",
    route: "log",
  },
];

function getDateKey(value) {
  if (!value) return "";

  const raw = String(value).trim();
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRounds(log) {
  return Number(
    log.rounds ||
      log.totalRounds ||
      log.completedRounds ||
      log.sets ||
      log.count ||
      0
  ) || 0;
}

function getExp(log) {
  const savedScore = Number(log.score);
  if (Number.isFinite(savedScore) && savedScore > 0) return savedScore;
  return Math.max(0, Number(log.minutes || log.duration || 0));
}

function getFighterTitle(level) {
  if (level >= 20) return "CHAMPION FIGHTER";
  if (level >= 12) return "ELITE FIGHTER";
  if (level >= 7) return "CONTENDER";
  if (level >= 3) return "AMATEUR FIGHTER";
  return "ROOKIE FIGHTER";
}

function loadSelectedFeatures() {
  try {
    const saved = JSON.parse(localStorage.getItem(HOME_FEATURES_KEY) || "null");
    return Array.isArray(saved) ? saved : DEFAULT_FEATURES;
  } catch {
    return DEFAULT_FEATURES;
  }
}

function buildMonthDays(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: firstDay }, (_, index) => ({
      key: `empty-${index}`,
      empty: true,
    })),
    ...Array.from({ length: lastDate }, (_, index) => {
      const day = index + 1;
      return {
        key: getDateKey(new Date(year, month, day)),
        day,
      };
    }),
  ];
}

export default function HomePage({
  onStartTraining,
  onNavigate,
  onOpenCardMaker,
}) {
  const { logs = [], profile } = useTraining();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState(loadSelectedFeatures);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);

  const dashboard = useMemo(() => {
    const totalRounds = logs.reduce((sum, log) => sum + getRounds(log), 0);
    const totalExp = logs.reduce((sum, log) => sum + getExp(log), 0);
    const level = Math.floor(totalExp / 100) + 1;
    const currentExp = totalExp % 100;
    const trainingByDate = logs.reduce((dates, log) => {
      const key = getDateKey(log.date || log.createdAt);
      if (!key) return dates;

      if (!dates[key]) {
        dates[key] = { count: 0, rounds: 0, types: [] };
      }

      dates[key].count += 1;
      dates[key].rounds += getRounds(log);

      const exerciseType = (log.type || "훈련").trim();
      if (exerciseType && !dates[key].types.includes(exerciseType)) {
        dates[key].types.push(exerciseType);
      }

      return dates;
    }, {});

    return {
      totalRounds,
      totalExp,
      level,
      currentExp,
      expToNext: 100 - currentExp,
      fighterTitle: getFighterTitle(level),
      trainingByDate,
      monthDays: buildMonthDays(),
    };
  }, [logs]);

  const selectedDayTraining = selectedDate
    ? dashboard.trainingByDate[selectedDate]
    : null;

  const visibleFeatures = FEATURES.filter((feature) =>
    selectedFeatures.includes(feature.id)
  );

  const trainingBreakdown = useMemo(
    () => buildTrainingBreakdown(logs),
    [logs]
  );

  const topTrainingType = trainingBreakdown[0]?.type || null;

  function handleCalendarSelect(dateKey) {
    setSelectedDate((current) => (current === dateKey ? "" : dateKey));
  }

  function openFeature(feature) {
    if (feature.pending) return;

    if (feature.route === "fighter-card") {
      onOpenCardMaker?.();
      return;
    }

    onNavigate?.(feature.route);
  }

  function toggleDashboardFeature(featureId) {
    setSelectedFeatures((currentFeatures) => {
      const nextFeatures = currentFeatures.includes(featureId)
        ? currentFeatures.filter((id) => id !== featureId)
        : [...currentFeatures, featureId];

      localStorage.setItem(HOME_FEATURES_KEY, JSON.stringify(nextFeatures));
      return nextFeatures;
    });
  }

  const now = new Date();
  const monthTitle = `${now.getFullYear()}. ${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <main className="home-page">
      <header className="fighter-header">
        <div>
          <p className="home-kicker">MY FIGHTER</p>
          <h1>{profile?.nickname || "나의 파이터"}</h1>
        </div>
        <div className="fighter-level">
          <span>TOTAL LV.</span>
          <strong>{dashboard.level}</strong>
          <small>{dashboard.fighterTitle}</small>
        </div>
      </header>

      <section className="home-exp-card">
        <div className="home-exp-top">
          <div>
            <p className="home-section-label">FIGHTER EXP</p>
            <h2>오늘도 훈련하면<br />파이터가 성장합니다.</h2>
          </div>
          <div className="home-round-total">
            <strong>{dashboard.totalRounds}</strong>
            <span>TOTAL ROUNDS</span>
          </div>
        </div>

        <div className="home-exp-meta">
          <span>LV. {dashboard.level}</span>
          <b>{dashboard.currentExp} / 100 EXP</b>
        </div>
        <div className="home-exp-bar" aria-label="현재 레벨 경험치">
          <div style={{ width: `${dashboard.currentExp}%` }} />
        </div>
        <p className="home-exp-copy">
          다음 레벨까지 <strong>{dashboard.expToNext} EXP</strong>
        </p>
      </section>

      <button className="home-main-button" onClick={onStartTraining}>
        <span>오늘 훈련 시작</span>
        <b>→</b>
      </button>

      <section className="fighter-overview">
        <div>
          <span>TRAININGS</span>
          <strong>{logs.length}</strong>
          <small>누적 훈련</small>
        </div>
        <div>
          <span>ROUNDS</span>
          <strong>{dashboard.totalRounds}</strong>
          <small>완료 라운드</small>
        </div>
        <div>
          <span>TOTAL EXP</span>
          <strong>{dashboard.totalExp}</strong>
          <small>성장 경험치</small>
        </div>
      </section>

      <section className="home-training-breakdown">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">TRAINING MIX</p>
            <h2>내 훈련 구성</h2>
          </div>
          {topTrainingType ? (
            <span className="breakdown-top-pick">TOP · {topTrainingType}</span>
          ) : (
            <span>—</span>
          )}
        </div>

        {trainingBreakdown.length === 0 ? (
          <p className="breakdown-empty">
            훈련 기록을 작성하면 가장 많이 한 운동이 여기에 쌓입니다.
          </p>
        ) : (
          <div className="breakdown-list">
            {trainingBreakdown.map((item) => (
              <div className="breakdown-row" key={item.type}>
                <div className="breakdown-label">
                  <strong>{item.type}</strong>
                  <span>
                    {item.count}회 · {item.minutes}분
                    {item.rounds > 0 ? ` · ${item.rounds}R` : ""}
                  </span>
                </div>
                <div className="breakdown-bar" aria-hidden="true">
                  <div style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="home-features home-quick-dashboard">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">QUICK ACCESS</p>
            <h2>나의 파이터 대시보드</h2>
          </div>
          <button
            className={`dashboard-edit-button ${
              isEditingDashboard ? "active" : ""
            }`}
            onClick={() => setIsEditingDashboard((current) => !current)}
          >
            {isEditingDashboard ? "완료" : "편집"}
          </button>
        </div>

        {visibleFeatures.length === 0 ? (
          <button
            className="dashboard-empty"
            onClick={() => setIsEditingDashboard(true)}
          >
            홈에 표시할 기능을 선택하세요 <span>＋</span>
          </button>
        ) : (
          <div className="dashboard-quick-grid">
            {visibleFeatures.map((feature) => (
              <button
                className="dashboard-quick-item"
                key={feature.id}
                onClick={() => openFeature(feature)}
                disabled={feature.pending}
              >
                <span className="dashboard-quick-icon">{feature.icon}</span>
                <strong>{feature.title}</strong>
                {feature.pending && <em>준비 중</em>}
              </button>
            ))}
          </div>
        )}

        {isEditingDashboard && (
          <div className="dashboard-editor">
            <div className="dashboard-editor-copy">
              <strong>홈 기능 선택</strong>
              <span>자주 쓰는 기능만 대시보드에 표시됩니다.</span>
            </div>
            <div className="dashboard-editor-grid">
              {FEATURES.map((feature) => {
                const selected = selectedFeatures.includes(feature.id);
                return (
                  <button
                    className={selected ? "selected" : ""}
                    key={feature.id}
                    onClick={() => toggleDashboardFeature(feature.id)}
                  >
                    <span>{feature.icon}</span>
                    <strong>{feature.title}</strong>
                    <i>{selected ? "✓" : "＋"}</i>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="training-calendar">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">TRAINING CALENDAR</p>
            <h2>이번 달 훈련</h2>
          </div>
          <strong>{monthTitle}</strong>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {dashboard.monthDays.map((date) => {
            if (date.empty) {
              return <span className="calendar-day empty" key={date.key} />;
            }

            const training = dashboard.trainingByDate[date.key];
            const isSelected = selectedDate === date.key;

            return (
              <button
                type="button"
                className={[
                  "calendar-day",
                  training ? "trained" : "selectable",
                  isSelected ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={date.key}
                onClick={() => handleCalendarSelect(date.key)}
                aria-label={`${date.day}일${
                  training ? `, 훈련 ${training.count}회` : ", 훈련 없음"
                }`}
                aria-pressed={isSelected}
              >
                {date.day}
                {training && <i />}
              </button>
            );
          })}
        </div>

        {logs.length === 0 ? (
          <p className="calendar-empty">
            아직 훈련 기록이 없습니다.<br />오늘 첫 훈련을 시작해보세요.
          </p>
        ) : selectedDate && selectedDayTraining ? (
          <div className="calendar-detail">
            <span>{selectedDate.replaceAll("-", ".")}</span>
            <strong>
              훈련 {selectedDayTraining.count}회 · {selectedDayTraining.rounds}R
            </strong>
            {selectedDayTraining.types?.length > 0 && (
              <p className="calendar-detail-types">
                {selectedDayTraining.types.join(" · ")}
              </p>
            )}
          </div>
        ) : selectedDate ? (
          <p className="calendar-hint">
            {selectedDate.replaceAll("-", ".")} — 이 날은 훈련 기록이 없습니다.
          </p>
        ) : (
          <p className="calendar-hint">
            날짜를 누르면 그날의 훈련 기록을 확인할 수 있어요.
          </p>
        )}
      </section>

    </main>
  );
}
