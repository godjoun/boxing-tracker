import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import {
  getCurriculumProgress,
  getRecommendedSession,
} from "../utils/homeCurriculum";
import { getFighterProgress } from "../utils/fighterProgress";
import {
  isComboCreatorUnlocked,
  COMBO_CREATOR_UNLOCK_LEVEL,
} from "../utils/featureUnlocks";
import { MATCH_TIMER_PRESETS } from "../utils/timerPresets";

export default function TrainingHubPage({
  fighterLevel = 1,
  onStartSession,
  onStartPreset,
  onOpenTimer,
  onOpenCurriculum,
  onOpenComboCreator,
  onOpenStrength,
}) {
  const { logs } = useTraining();

  const { progress, recommended, fighter } = useMemo(() => {
    const curriculumProgress = getCurriculumProgress();
    return {
      progress: curriculumProgress,
      recommended: getRecommendedSession(curriculumProgress),
      fighter: getFighterProgress(logs),
    };
  }, [logs]);

  const comboUnlocked = isComboCreatorUnlocked(fighterLevel);

  const levelUpTips = [
    {
      icon: "1",
      title: "훈련을 끝까지 완료하기",
      description: "타이머를 완료하면 라운드가 자동으로 기록에 남아요.",
    },
    {
      icon: "2",
      title: "더보기에서 직접 남기기",
      description: "타이머 없이 운동했다면 더보기 → 기록에서 수동으로 남겨도 됩니다.",
    },
    {
      icon: "3",
      title: "라운드·시간을 채우기",
      description: "많이, 오래 버틸수록 성장 흔적이 선명해져요.",
    },
    {
      icon: "4",
      title: "명패로 증명하기",
      description: "완료한 라운드는 명패 카드로 남겨 두고 공유할 수 있어요.",
    },
  ];

  const menuItems = [
    {
      id: "strength",
      icon: "B",
      title: "훈련법 추천",
      description: "요일별 루틴 · 워밍업",
      onClick: onOpenStrength,
      locked: false,
    },
    {
      id: "curriculum",
      icon: "C",
      title: "커리큘럼",
      description: "4주 코스 · 영상+훈련",
      onClick: onOpenCurriculum,
      locked: false,
    },
    {
      id: "combo",
      icon: "◆",
      title: "콤보 만들기",
      description: comboUnlocked
        ? "나만의 섀도우 루틴"
        : `LV.${COMBO_CREATOR_UNLOCK_LEVEL} 해금`,
      onClick: onOpenComboCreator,
      locked: !comboUnlocked,
    },
  ];

  return (
    <main className="hub-page levelup-page">
      <header className="levelup-header">
        <h1 className="levelup-title">훈련</h1>
        <p className="levelup-subtitle">
          타이머로 라운드를 남기고, 오늘의 훈련을 이어가세요.
        </p>
      </header>

      <section className="levelup-timer-hero" aria-label="라운드 타이머">
        <div className="levelup-timer-hero-top">
          <div className="levelup-timer-icon" aria-hidden="true">
            ◷
          </div>
          <div className="levelup-timer-copy">
            <p className="levelup-timer-kicker">ROUND TIMER</p>
            <h2 className="levelup-timer-title">라운드 타이머</h2>
            <span className="levelup-timer-desc">
              1R = 운동 1세트 · 완료 시 기록에 자동 저장
            </span>
          </div>
        </div>

        <div className="levelup-timer-presets">
          {MATCH_TIMER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="levelup-timer-preset"
              onClick={() => onStartPreset?.(preset)}
            >
              <strong>{preset.title}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="levelup-timer-open"
          onClick={onOpenTimer}
        >
          타이머 설정 열기
        </button>
      </section>

      <div className="levelup-card-stack">
        <section className="levelup-box-card">
          <div className="levelup-box-head">
            <div>
              <p className="levelup-box-kicker">MY LEVEL</p>
              <h3 className="levelup-box-title">
                LV.{fighter.level}{" "}
                <span className="levelup-box-title-sub">{fighter.fighterTitle}</span>
              </h3>
            </div>
            <div className="levelup-box-stat">
              <span>{fighter.isMaxLevel ? "MAX" : "다음 레벨까지"}</span>
              <strong>
                {fighter.isMaxLevel ? "달성" : `${fighter.xpToNextLevel} EXP`}
              </strong>
            </div>
          </div>

          <div className="levelup-progress-track">
            <div
              className="levelup-progress-fill"
              style={{ width: `${fighter.progressPercent}%` }}
            />
          </div>
          <p className="levelup-progress-note">
            {fighter.isMaxLevel
              ? "최고 레벨에 도달했어요."
              : `${fighter.currentLevelExp} / ${fighter.nextLevelExp} EXP`}
          </p>
        </section>

        <section className="levelup-box-card levelup-box-card-accent">
          <p className="levelup-box-kicker">TODAY&apos;S SESSION</p>
          <h3 className="levelup-box-title">오늘의 추천 훈련</h3>

          {recommended ? (
            <>
              <div className="levelup-recommend-meta">
                {recommended.weekLabel ? (
                  <span className="levelup-badge">{recommended.weekLabel}</span>
                ) : null}
                {recommended.code ? (
                  <span className="levelup-badge-muted">{recommended.code}</span>
                ) : null}
              </div>

              <p className="levelup-recommend-name">{recommended.title}</p>
              {recommended.goal ? (
                <p className="levelup-recommend-goal">{recommended.goal}</p>
              ) : null}

              <div className="levelup-curriculum-progress">
                <div className="levelup-progress-track">
                  <div
                    className="levelup-progress-fill"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
                <span className="levelup-progress-count">
                  {progress.completedCount}/{progress.totalSessions}
                </span>
              </div>

              <button
                type="button"
                className="levelup-box-cta"
                onClick={() => onStartSession?.(recommended)}
              >
                오늘 세션 시작 →
              </button>
            </>
          ) : (
            <>
              <p className="levelup-recommend-name">커리큘럼 완주 🎉</p>
              <p className="levelup-recommend-goal">
                모든 세션을 마쳤어요. 원하는 세션을 다시 골라 훈련하세요.
              </p>
              <button
                type="button"
                className="levelup-box-cta"
                onClick={onOpenCurriculum}
              >
                커리큘럼 다시 보기 →
              </button>
            </>
          )}
        </section>

        <section className="levelup-box-card">
          <p className="levelup-box-kicker">TRAINING MENU</p>
          <h3 className="levelup-box-title">훈련 메뉴</h3>

          <div className="levelup-menu-grid">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`levelup-menu-tile${item.locked ? " is-locked" : ""}`}
                onClick={item.onClick}
              >
                <span className="levelup-menu-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </section>

        <details className="levelup-box-card levelup-guide-details">
          <summary className="levelup-guide-summary">
            <span>
              <p className="levelup-box-kicker">HOW TO LEVEL UP</p>
              <strong>레벨업 하는 방법</strong>
            </span>
            <em aria-hidden="true">↓</em>
          </summary>

          <div className="levelup-guide-list">
            {levelUpTips.map((tip) => (
              <div key={tip.title} className="levelup-guide-item">
                <span className="levelup-guide-icon" aria-hidden="true">
                  {tip.icon}
                </span>
                <div>
                  <strong>{tip.title}</strong>
                  <p>{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}
