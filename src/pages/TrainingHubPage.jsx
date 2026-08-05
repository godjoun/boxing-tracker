import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { MATCH_TIMER_PRESETS } from "../utils/timerPresets";
import { startTimerAudioSession } from "../utils/timerAudio";
import { isDevSurfaceLog } from "../utils/devMode";
import MenuIcon from "../components/MenuIcon";

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function getLogRounds(log) {
  return Number(log.rounds || log.totalRounds || log.completedRounds || 0);
}

export default function TrainingHubPage({
  onStartPreset,
  onOpenTimer,
  onOpenCurriculum,
  onOpenComboCreator,
  onOpenStrength,
  onOpenLog,
}) {
  const { logs } = useTraining();
  const [selectedModeId, setSelectedModeId] = useState("boxing");

  const todaySummary = useMemo(() => {
    const todayLogs = logs.filter(
      (log) => log.date === getTodayString() && !isDevSurfaceLog(log)
    );
    return {
      rounds: todayLogs.reduce((sum, log) => sum + getLogRounds(log), 0),
      minutes: todayLogs.reduce(
        (sum, log) => sum + Number(log.minutes || log.duration || 0),
        0
      ),
    };
  }, [logs]);

  const defaultPreset = MATCH_TIMER_PRESETS[0];
  const sessionRounds = Number(defaultPreset?.rounds || 3);
  const sessionMinutes = Math.round(
    (Number(defaultPreset?.workSeconds || 180) * sessionRounds) / 60
  );

  async function startRoundTraining(logType = null) {
    if (!defaultPreset) return;

    await startTimerAudioSession();
    onStartPreset?.(
      logType
        ? {
            ...defaultPreset,
            title: logType,
            logType,
          }
        : defaultPreset
    );
  }

  const trainingModes = [
    {
      id: "boxing",
      icon: "skill",
      title: "복싱 훈련",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "라운드 타이머로 시작",
      ctaLabel: "훈련 시작",
      start: () => startRoundTraining(),
    },
    {
      id: "running",
      icon: "growth",
      title: "러닝",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "러닝으로 기록할 세션",
      ctaLabel: "훈련 시작",
      start: () => startRoundTraining("러닝"),
    },
    {
      id: "weights",
      icon: "body",
      title: "웨이트",
      detail: "컨디셔닝",
      hint: "근력 · 체력 루틴",
      ctaLabel: "루틴 열기",
      start: onOpenStrength,
    },
    {
      id: "mitt",
      icon: "combo",
      title: "미트 훈련",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "미트 중심으로 시작",
      ctaLabel: "훈련 시작",
      start: () => startRoundTraining("미트 훈련"),
    },
    {
      id: "free",
      icon: "log",
      title: "자유 기록",
      detail: "직접 남기기",
      hint: "이미 끝난 운동을 적습니다",
      ctaLabel: "기록 열기",
      start: () => onOpenLog?.(),
    },
  ];

  const selectedMode =
    trainingModes.find((mode) => mode.id === selectedModeId) || trainingModes[0];

  const moreTools = [
    {
      id: "bag",
      label: "샌드백",
      hint: "타격 라운드 시작",
      onClick: () => startRoundTraining("샌드백"),
    },
    {
      id: "sparring",
      label: "스파링",
      hint: "스파링 라운드 시작",
      onClick: () => startRoundTraining("스파링"),
    },
    {
      id: "settings",
      label: "라운드 직접 설정",
      hint: "타이머 시간 · 라운드 조절",
      onClick: onOpenTimer,
    },
    {
      id: "curriculum",
      label: "기술 루틴",
      hint: "커리큘럼으로 이어가기",
      onClick: onOpenCurriculum,
    },
    {
      id: "combo",
      label: "콤보 만들기",
      hint: "나만의 흐름",
      onClick: onOpenComboCreator,
    },
  ];

  return (
    <main className="hub-page levelup-page training-page">
      <header className="levelup-header">
        <h1 className="levelup-title">훈련</h1>
        <p className="training-page-sub">집중할 훈련을 고르세요</p>
      </header>

      <section className="training-mode-section" aria-label="훈련 모드">
        <div className="training-section-heading">
          <div>
            <p>MODE</p>
            <h2>훈련 모드 선택</h2>
          </div>
          <span className="training-today-chip">
            오늘 {todaySummary.rounds}R · {todaySummary.minutes}분
          </span>
        </div>
        <div className="training-mode-grid">
          {trainingModes.map((mode) => {
            const selected = selectedMode.id === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={`training-mode-card${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setSelectedModeId(mode.id)}
              >
                <span className="training-mode-card-icon" aria-hidden="true">
                  <MenuIcon name={mode.icon} size={18} />
                </span>
                <span className="training-mode-card-copy">
                  <strong>{mode.title}</strong>
                  <small>{mode.hint}</small>
                </span>
                <span
                  className={`training-mode-card-check${selected ? " is-on" : ""}`}
                  aria-hidden="true"
                >
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="training-session-card" aria-label="시작할 세션">
        <div className="training-session-head">
          <div>
            <p>선택한 세션</p>
            <h2>{selectedMode.title}</h2>
          </div>
          {selectedMode.id !== "weights" && selectedMode.id !== "free" ? (
            <button
              type="button"
              className="training-session-edit"
              onClick={onOpenTimer}
              aria-label="라운드 직접 설정"
            >
              설정
            </button>
          ) : null}
        </div>
        <div className="training-session-stats">
          {selectedMode.id === "weights" ? (
            <>
              <div>
                <span>구성</span>
                <strong>컨디셔닝</strong>
              </div>
              <div>
                <span>오늘</span>
                <strong>
                  {todaySummary.rounds}R · {todaySummary.minutes}분
                </strong>
              </div>
            </>
          ) : selectedMode.id === "free" ? (
            <>
              <div>
                <span>방식</span>
                <strong>직접 입력</strong>
              </div>
              <div>
                <span>오늘</span>
                <strong>
                  {todaySummary.rounds}R · {todaySummary.minutes}분
                </strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span>라운드</span>
                <strong>{sessionRounds}R</strong>
              </div>
              <div>
                <span>시간</span>
                <strong>{sessionMinutes}분</strong>
              </div>
              <div>
                <span>오늘</span>
                <strong>
                  {todaySummary.rounds}R · {todaySummary.minutes}분
                </strong>
              </div>
            </>
          )}
        </div>
      </section>

      <details className="training-tools-details">
        <summary className="training-tools-summary">
          <span>더 보기</span>
          <strong>샌드백 · 스파링 · 기술</strong>
        </summary>
        <section className="training-tools-section" aria-label="추가 훈련 도구">
          {moreTools.map((tool) => (
            <button key={tool.id} type="button" onClick={tool.onClick}>
              <span>{tool.label}</span>
              <small>{tool.hint}</small>
              <b>›</b>
            </button>
          ))}
        </section>
      </details>

      <div className="training-start-dock">
        <button type="button" onClick={() => selectedMode.start?.()}>
          {selectedMode.ctaLabel}
          <small>
            {selectedMode.title} · {selectedMode.detail}
          </small>
        </button>
      </div>
    </main>
  );
}
