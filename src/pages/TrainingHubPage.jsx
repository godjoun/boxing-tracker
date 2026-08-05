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
}) {
  const { logs } = useTraining();
  const [selectedModeId, setSelectedModeId] = useState("general");

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
      id: "general",
      icon: "round",
      title: "일반 훈련",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "타이머로 바로 시작",
      start: () => startRoundTraining(),
    },
    {
      id: "bag",
      icon: "skill",
      title: "샌드백",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "타격 라운드 시작",
      start: () => startRoundTraining("샌드백"),
    },
    {
      id: "sparring",
      icon: "combo",
      title: "스파링",
      detail: `${sessionRounds}R · ${sessionMinutes}분`,
      hint: "스파링 라운드 시작",
      start: () => startRoundTraining("스파링"),
    },
    {
      id: "conditioning",
      icon: "body",
      title: "근력 · 체력",
      detail: "컨디셔닝",
      hint: "루틴으로 시작",
      start: onOpenStrength,
    },
  ];

  const selectedMode =
    trainingModes.find((mode) => mode.id === selectedModeId) || trainingModes[0];

  function handleModeSelect(mode) {
    if (mode.id === selectedModeId) {
      mode.start?.();
      return;
    }
    setSelectedModeId(mode.id);
  }

  return (
    <main className="hub-page levelup-page training-page">
      <header className="levelup-header">
        <h1 className="levelup-title">훈련</h1>
        <p className="training-page-sub">지금 벨을 울립니다</p>
      </header>

      <section className="training-mode-section" aria-label="훈련 모드">
        <div className="training-mode-grid">
          {trainingModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`training-mode-card${
                selectedMode.id === mode.id ? " is-selected" : ""
              }`}
              aria-pressed={selectedMode.id === mode.id}
              onClick={() => handleModeSelect(mode)}
            >
              <span className="training-mode-card-icon" aria-hidden="true">
                <MenuIcon name={mode.icon} size={18} />
              </span>
              <span className="training-mode-card-copy">
                <strong>{mode.title}</strong>
                <small>{mode.hint}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="training-session-card" aria-label="시작할 세션">
        <div className="training-session-head">
          <div>
            <p>시작할 세션</p>
            <h2>{selectedMode.title}</h2>
          </div>
          {selectedMode.id !== "conditioning" ? (
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
          {selectedMode.id === "conditioning" ? (
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
          <strong>기술 · 콤보</strong>
        </summary>
        <section className="training-tools-section" aria-label="기술 · 콤보">
          <button type="button" onClick={onOpenCurriculum}>
            <span>기술 루틴</span>
            <small>커리큘럼으로 이어가기</small>
            <b>›</b>
          </button>
          <button type="button" onClick={onOpenComboCreator}>
            <span>콤보 만들기</span>
            <small>나만의 흐름</small>
            <b>›</b>
          </button>
        </section>
      </details>

      <div className="training-start-dock">
        <button type="button" onClick={selectedMode.start}>
          훈련 시작
          <small>
            {selectedMode.title} · {selectedMode.detail}
          </small>
        </button>
      </div>
    </main>
  );
}
