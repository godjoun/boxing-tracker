import { useEffect, useMemo, useState } from "react";
import { getNextTitleMilestone } from "../utils/fighterTitles";
import { FEATURE_UNLOCKS } from "../utils/featureUnlocks";
import {
  getNextVeteranPerk,
  getUnlockedVeteranPerks,
} from "../utils/veteranPerks";
import { BRAND_NAME } from "../utils/brand";
import "./CareerLevelScene.css";

function formatMinutes(totalMinutes = 0) {
  const safe = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

function buildShareText({ fighter, nickname, streakDays }) {
  const name = nickname || BRAND_NAME;
  const lines = [
    `${name} · LV.${fighter.level} ${fighter.fighterTitle}`,
    fighter.fighterTitleEn ? fighter.fighterTitleEn : null,
    `${fighter.totalRounds}R · ${formatMinutes(fighter.totalMinutes)}${
      streakDays > 0 ? ` · ${streakDays}일 연속` : ""
    }`,
    "",
    "I RULE THE ROUND.",
    "당신의 복싱은 멈추지 않는다.",
  ].filter((line) => line !== null);

  return lines.join("\n");
}

export default function CareerLevelScene({
  fighter,
  streakDays = 0,
  nickname,
  onClose,
}) {
  const [shareNote, setShareNote] = useState("");
  const nextTitle = getNextTitleMilestone(fighter.level);
  const nextUnlock = FEATURE_UNLOCKS.find(
    (feature) => feature.level > fighter.level
  );
  const nextPerk = getNextVeteranPerk(fighter.level);

  const benefits = useMemo(() => {
    const features = FEATURE_UNLOCKS.filter(
      (feature) => fighter.level >= feature.level
    ).map((feature) => ({
      id: `feature-${feature.id}`,
      label: feature.label,
      description: feature.description,
      level: feature.level,
    }));

    const perks = getUnlockedVeteranPerks(fighter.level).map((perk) => ({
      id: `perk-${perk.id}`,
      label: perk.label,
      description: perk.description,
      level: perk.level,
    }));

    return [...features, ...perks];
  }, [fighter.level]);

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

  async function handleShareLevel() {
    const text = buildShareText({ fighter, nickname, streakDays });
    const url =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const shareData = {
      title: `${BRAND_NAME} · LV.${fighter.level}`,
      text,
      url,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        setShareNote("");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          url ? `${text}\n${url}` : text
        );
        setShareNote("클립보드에 복사됐어요.");
        return;
      }

      setShareNote("이 기기에서는 공유를 지원하지 않아요.");
    } catch (error) {
      if (error?.name === "AbortError") {
        setShareNote("");
        return;
      }
      setShareNote("공유에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

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

        <section
          className="career-level-scene-benefits"
          aria-label="보유 혜택"
        >
          <div className="career-level-scene-benefits-head">
            <p>보유 혜택</p>
            <span>{benefits.length}개</span>
          </div>

          {benefits.length > 0 ? (
            <ul className="career-level-scene-benefit-list">
              {benefits.map((benefit) => (
                <li key={benefit.id}>
                  <div>
                    <strong>{benefit.label}</strong>
                    <p>{benefit.description}</p>
                  </div>
                  <em>LV.{benefit.level}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="career-level-scene-benefits-empty">
              아직 해금된 혜택이 없어요. 훈련을 이어가면 열립니다.
            </p>
          )}

          {nextPerk || nextUnlock ? (
            <p className="career-level-scene-benefits-next">
              다음 혜택 ·{" "}
              <strong>{(nextUnlock || nextPerk).label}</strong>
              <em>LV.{(nextUnlock || nextPerk).level}</em>
            </p>
          ) : null}
        </section>

        {nextTitle ? (
          <p className="career-level-scene-next">
            다음 장면 · <strong>{nextTitle.ko}</strong>
            <em>LV.{nextTitle.level}</em>
          </p>
        ) : (
          <p className="career-level-scene-next">커리어의 끝 — 레전드</p>
        )}

        <div className="career-level-scene-actions">
          <button
            type="button"
            className="career-level-scene-share"
            onClick={handleShareLevel}
          >
            레벨 공유하기
          </button>
          {shareNote ? (
            <p className="career-level-scene-share-note" role="status">
              {shareNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
