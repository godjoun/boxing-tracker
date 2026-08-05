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
  const roundDetail = `${sessionRounds}R · ${sessionMinutes}분`;
  const runningGoalMinutes = 30;

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

  async function startRunningSession() {
    await startTimerAudioSession();
    onStartPreset?.({
      id: "running-time-30",
      title: "러닝",
      description: "시간 목표 러닝",
      rounds: 1,
      workSeconds: runningGoalMinutes * 60,
      restSeconds: 0,
      logType: "러닝",
      routineTitle: "러닝 · 30분",
    });
  }

  const trainingModes = [
    {
      id: "boxing",
      icon: "skill",
      title: "복싱 훈련",
      detail: roundDetail,
      ctaLabel: "훈련 시작",
      start: () => startRoundTraining(),
    },
    {
      id: "running",
      icon: "growth",
      title: "러닝",
      detail: `시간 목표 · ${runningGoalMinutes}분`,
      ctaLabel: "러닝 시작",
      start: () => startRunningSession(),
    },
    {
      id: "weights",
      icon: "body",
      title: "웨이트",
      detail: "근력 · 체력 루틴",
      ctaLabel: "루틴 열기",
      start: onOpenStrength,
    },
    {
      id: "mitt",
      icon: "combo",
      title: "미트 훈련",
      detail: roundDetail,
      ctaLabel: "훈련 시작",
      start: () => startRoundTraining("미트 훈련"),
    },
  ];

  const selectedMode =
    trainingModes.find((mode) => mode.id === selectedModeId) || trainingModes[0];

  const moreTools = [
    {
      id: "free",
      label: "직접 기록하기",
      hint: "이미 끝난 운동을 적습니다",
      onClick: () => onOpenLog?.(),
    },
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
    <main className="hub-page levelup-page training-page training-page-focus">
      <header className="levelup-header training-focus-header">
        <div>
          <h1 className="levelup-title">훈련</h1>
        </div>
        <p className="training-today-chip">
          오늘 {todaySummary.rounds}R · {todaySummary.minutes}분
        </p>
      </header>

      <section className="training-mode-section" aria-label="훈련 모드">
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
                  <MenuIcon name={mode.icon} size={16} />
                </span>
                <span className="training-mode-card-copy">
                  <strong>{mode.title}</strong>
                  <small>{mode.detail}</small>
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

      <details className="training-tools-details">
        <summary className="training-tools-summary">
          <span>더 보기</span>
          <strong>기록 · 샌드백 · 스파링</strong>
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
