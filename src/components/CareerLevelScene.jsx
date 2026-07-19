import { useEffect } from "react";
import { getNextTitleMilestone } from "../utils/fighterTitles";
import { FEATURE_UNLOCKS } from "../utils/featureUnlocks";
import "./CareerLevelScene.css";

function formatMinutes(totalMinutes = 0) {
  const safe = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function CareerLevelScene({
  fighter,
  streakDays = 0,
  onClose,
}) {
  const nextTitle = getNextTitleMilestone(fighter.level);
  const nextUnlock = FEATURE_UNLOCKS.find(
    (feature) => feature.level > fighter.level
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="career-level-scene"
      role="dialog"
      aria-modal="true"
      aria-label="커리어 레벨"
    >
      <div className="career-level-scene-glow" aria-hidden="true" />

      <button
        type="button"
        className="career-level-scene-close"
        onClick={onClose}
        aria-label="닫기"
      >
        닫기
      </button>

      <div className="career-level-scene-body">
        <p className="career-level-scene-kicker">
          {fighter.careerStageEn || "CAREER"}
        </p>

        <p className="career-level-scene-level">
          <span>LV.</span>
          <strong>{fighter.level}</strong>
        </p>

        <h1 className="career-level-scene-title">{fighter.fighterTitle}</h1>
        {fighter.fighterTitleEn ? (
          <p className="career-level-scene-title-en">{fighter.fighterTitleEn}</p>
        ) : null}

        {fighter.fighterTitleFlavor ? (
          <p className="career-level-scene-flavor">
            {fighter.fighterTitleFlavor}
          </p>
        ) : null}

        <div className="career-level-scene-traces" aria-label="성장 흔적">
          <div>
            <span>누적 라운드</span>
            <strong>{fighter.totalRounds}R</strong>
          </div>
          <div>
            <span>훈련 시간</span>
            <strong>{formatMinutes(fighter.totalMinutes)}</strong>
          </div>
          <div>
            <span>기록</span>
            <strong>{fighter.totalLogs}회</strong>
          </div>
          <div>
            <span>연속</span>
            <strong>{streakDays > 0 ? `${streakDays}일` : "—"}</strong>
          </div>
        </div>

        <div className="career-level-scene-exp">
          <div className="career-level-scene-exp-head">
            <span>
              {fighter.isMaxLevel
                ? "MAX"
                : `다음 레벨까지 ${fighter.xpToNextLevel} EXP`}
            </span>
            <span>
              {fighter.isMaxLevel
                ? `${fighter.totalExp} EXP`
                : `${fighter.currentLevelExp} / ${fighter.nextLevelExp}`}
            </span>
          </div>
          <div className="career-level-scene-bar" aria-hidden="true">
            <div style={{ width: `${fighter.progressPercent}%` }} />
          </div>
        </div>

        {nextTitle ? (
          <p className="career-level-scene-next">
            다음 장면 · <strong>{nextTitle.ko}</strong>
            <em>LV.{nextTitle.level}</em>
          </p>
        ) : (
          <p className="career-level-scene-next">커리어의 끝 — 레전드</p>
        )}

        {nextUnlock ? (
          <p className="career-level-scene-unlock">
            해금 예정 · {nextUnlock.label}
            <em>LV.{nextUnlock.level}</em>
          </p>
        ) : null}
      </div>
    </div>
  );
}
