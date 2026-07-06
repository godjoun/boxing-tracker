import {
  getFeatureUnlock,
  getSparringUnlockProgress,
} from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import "./FeatureLockScreen.css";

export default function FeatureLockScreen({
  featureId = "sparring",
  currentLevel = 1,
  onBack,
  onStartTraining,
}) {
  const feature = getFeatureUnlock(featureId);
  const progress = getSparringUnlockProgress(currentLevel);
  const milestone = getLevelTitle(feature?.level || progress.unlockLevel);

  if (!feature) {
    return null;
  }

  return (
    <main className="feature-lock-page">
      <div className="feature-lock-card">
        <p className="feature-lock-kicker">SPARRING READY</p>
        <h1>{feature.label}</h1>
        <p className="feature-lock-description">{feature.description}</p>

        <div className="feature-lock-level-box">
          <span>해금 마일스톤</span>
          <strong>LV. {feature.level}</strong>
          <small>
            {milestone.ko} · {milestone.en}
          </small>
        </div>

        <div className="feature-lock-progress">
          <div className="feature-lock-progress-head">
            <span>현재 LV. {progress.currentLevel}</span>
            <span>{progress.progressPercent}%</span>
          </div>
          <div className="feature-lock-progress-bar" aria-hidden="true">
            <div style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </div>

        <p className="feature-lock-hint">
          {progress.levelsToGo > 0
            ? `훈련을 이어가면 ${progress.levelsToGo}레벨 후 스파링 매칭이 열립니다.`
            : "곧 스파링 상대를 찾을 수 있습니다."}
        </p>

        <button
          type="button"
          className="feature-lock-primary"
          onClick={onStartTraining}
        >
          훈련하러 가기
        </button>

        {onBack ? (
          <button type="button" className="feature-lock-secondary" onClick={onBack}>
            돌아가기
          </button>
        ) : null}
      </div>
    </main>
  );
}
