import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildJourneyAchievements } from "../utils/fighterJourney";
import {
  getFighterLevel,
  getFighterProgress,
  getTotalExp,
} from "../utils/fighterProgress";
import {
  getCareerTierState,
  getMonthlySeasonSummary,
  settleMonthlyLevelAwards,
} from "../utils/monthlySeason";
import { getTitleCollection } from "../utils/fighterTitles";
import { getVeteranPerkCollection } from "../utils/veteranPerks";
import "./GrowthHubPage.css";
import "./JourneyPage.css";

const PERK_KIND_LABEL = {
  badge: "배지",
  card_filter: "카드",
  frame: "명패",
};

function getTierPerkLabel(tier) {
  if (!tier?.perks?.length) return "새 해금 없음";
  return tier.perks.map((perk) => perk.label).join(" · ");
}

function getTierLevelRange(tier) {
  if (!tier) return "";
  return `LV. ${tier.from}–${tier.to}`;
}

export default function GrowthHubPage({
  onStartTraining,
  onGoBack,
}) {
  const { logs } = useTraining();
  const [seasonSettlement] = useState(() =>
    settleMonthlyLevelAwards(logs, (logsThroughMonth) =>
      getFighterLevel(getTotalExp(logsThroughMonth))
    )
  );
  const [activeCollection, setActiveCollection] = useState(null);

  const {
    fighter,
    titleCollection,
    veteranPerks,
    achievements,
  } = useMemo(() => {
    return {
      fighter: getFighterProgress(logs),
      titleCollection: getTitleCollection(getFighterProgress(logs).level),
      veteranPerks: getVeteranPerkCollection(getFighterProgress(logs).level),
      achievements: buildJourneyAchievements(logs),
    };
  }, [logs]);

  const isEmpty = fighter.totalLogs === 0;
  const unlockedTitleCount = titleCollection.filter((item) => item.unlocked).length;
  const unlockedPerkCount = veteranPerks.filter((item) => item.unlocked).length;
  const unlockedAchievementCount = achievements.filter((item) => item.unlocked).length;
  const nextTitle = titleCollection.find((item) => item.isNext);
  const currentTitle = titleCollection.find((item) => item.isCurrent);
  const nextPerk = veteranPerks.find((item) => item.isNext);
  const nextAchievement = achievements.find((item) => !item.unlocked);
  const tierState = getCareerTierState(fighter.level);
  const seasonSummary = getMonthlySeasonSummary(fighter.level);

  const collectionSheet = activeCollection ? (
    <div className="growth-collection-sheet" role="dialog" aria-modal="true">
      <button
        type="button"
        className="growth-collection-sheet-backdrop"
        aria-label="상세 닫기"
        onClick={() => setActiveCollection(null)}
      />
      <section className="growth-collection-sheet-panel">
        <div className="growth-collection-sheet-handle" aria-hidden="true">
          <span />
        </div>
        <header className="growth-collection-sheet-head">
          <div>
            <p>
              {activeCollection === "titles"
                ? "TITLES"
                : activeCollection === "perks"
                  ? "VETERAN"
                  : "ACHIEVEMENTS"}
            </p>
            <h2>
              {activeCollection === "titles"
                ? "칭호 도감"
                : activeCollection === "perks"
                  ? "베테랑 혜택"
                  : "업적"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="상세 닫기"
            onClick={() => setActiveCollection(null)}
          >
            ×
          </button>
        </header>

        {activeCollection === "titles" ? (
          <>
            <p className="journey-title-next">
              {nextTitle ? (
                <>
                  다음 칭호 <strong>{nextTitle.ko}</strong> · LV. {nextTitle.level}
                </>
              ) : (
                "모든 칭호를 획득했습니다."
              )}
            </p>
            <div className="journey-title-list">
              {titleCollection.map((title) => (
                <article
                  className={`journey-title-item is-${title.status}`}
                  key={title.level}
                >
                  <div className="journey-title-badge" aria-hidden="true">
                    {title.isCurrent
                      ? "장착"
                      : title.unlocked
                        ? "획득"
                        : title.isNext
                          ? "다음"
                          : "잠김"}
                  </div>
                  <div className="journey-title-copy">
                    <div className="journey-title-top">
                      <strong>{title.ko}</strong>
                      <span>LV. {title.level}</span>
                    </div>
                    <p className="journey-title-en">{title.en}</p>
                    <p className="journey-title-flavor">{title.flavor}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {activeCollection === "perks" ? (
          <div className="journey-title-list">
            {veteranPerks.map((perk) => (
              <article className={`journey-title-item is-${perk.status}`} key={perk.id}>
                <div className="journey-title-badge" aria-hidden="true">
                  {perk.unlocked ? "해금" : perk.isNext ? "다음" : "잠김"}
                </div>
                <div className="journey-title-copy">
                  <div className="journey-title-top">
                    <strong>{perk.label}</strong>
                    <span>LV. {perk.level}</span>
                  </div>
                  <p className="journey-title-en">
                    {PERK_KIND_LABEL[perk.kind] || "혜택"}
                  </p>
                  <p className="journey-title-flavor">{perk.description}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeCollection === "achievements" ? (
          <div className="journey-achievement-list">
            {achievements.map((achievement) => (
              <div
                className={`journey-achievement${
                  achievement.unlocked ? " is-unlocked" : ""
                }`}
                key={achievement.id}
              >
                <span>{achievement.unlocked ? "완료" : "잠김"}</span>
                <div>
                  <strong>{achievement.title}</strong>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  ) : null;

  return (
    <main className="hub-page growth-hub-page">
      {onGoBack ? (
        <button
          type="button"
          className="growth-hub-back"
          onClick={onGoBack}
        >
          ← 뒤로
        </button>
      ) : null}
      <header className="growth-hub-header">
        <h1 className="growth-hub-title">성장</h1>
        <p className="growth-hub-subtitle">
          지금까지 쌓은 훈련의 흔적을 확인하세요.
        </p>
      </header>

      {isEmpty ? (
        <section className="growth-hub-empty">
          <p className="growth-hub-empty-kicker">FIRST ROUND</p>
          <h2 className="growth-hub-empty-title">아직 훈련 기록이 없어요</h2>
          <p className="growth-hub-empty-text">
            첫 라운드를 남기면 여기에 커리어가 열립니다.
          </p>
          <button
            type="button"
            className="growth-hub-empty-button"
            onClick={onStartTraining}
          >
            오늘 훈련 시작
          </button>
        </section>
      ) : null}

      {seasonSettlement.newlyAwarded.length > 0 ? (
        <section className="growth-hub-season-award" aria-label="월간 보너스 레벨">
          <p>SEASON CLOSED</p>
          <h2>
            {seasonSettlement.newlyAwarded
              .map((award) => `${award.stage} +${award.levels} LV`)
              .join(" · ")}
          </h2>
          <span>지난 시즌에 남긴 훈련을 커리어에 더했습니다.</span>
        </section>
      ) : null}

      <section className="growth-hub-card growth-hub-season" aria-label="현재 커리어 구간">
        <div className="growth-hub-level-scene">
          <div className="growth-hub-level-mark" aria-hidden="true">
            <span>LV</span>
            <strong>{fighter.level}</strong>
          </div>
          <p>{tierState.current.stage}</p>
        </div>
        <div className="growth-hub-card-head">
          <div>
            <p className="growth-hub-kicker">현재 구간</p>
            <h2 className="growth-hub-card-title">{tierState.current.stage}</h2>
          </div>
          <strong className="growth-hub-season-stage">LV. {fighter.level}</strong>
        </div>

        <p className="growth-hub-season-current">
          {getTierLevelRange(tierState.current)} 구간
        </p>
        <div className="growth-hub-tier-progress">
          <div className="growth-hub-progress-meta">
            <strong>
              {tierState.isMaxTier
                ? "최고 구간에 도달했습니다"
                : `${tierState.levelsToNextTier}레벨 뒤 승급`}
            </strong>
            <span>
              {tierState.isMaxTier
                ? "MAX"
                : `${tierState.progressPercent}%`}
            </span>
          </div>
          <div className="growth-hub-progress-track" aria-hidden="true">
            <div
              className="growth-hub-progress-fill"
              style={{ width: `${tierState.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="growth-hub-next-stage" aria-label="다음 커리어 구간">
          <span>{tierState.next ? "다음 목표" : "현재 상태"}</span>
          <strong>
            {tierState.next
              ? `${tierState.next.stage} · LV. ${tierState.next.from}`
              : "레전드 · 최고 구간"}
          </strong>
          <small>
            {tierState.next
              ? getTierPerkLabel(tierState.next)
              : "레전드의 훈련 기록은 계속 쌓입니다."}
          </small>
        </div>
      </section>

      <details className="growth-hub-secondary-details">
        <summary>
          <span>
            <small>이번 달 승급</small>
            <strong>현재 구간 기준 +{seasonSummary.levels} LV</strong>
          </span>
          <em>보기</em>
        </summary>
        <div className="growth-hub-secondary-body">
          <p>
            {seasonSummary.endsOn}에 이번 달 최고 구간을 기준으로 레벨을 지급합니다.
            훈련 기록이 있는 달에만 적용됩니다.
          </p>
        </div>
      </details>

      <details className="growth-hub-secondary-details growth-hub-tier-details">
        <summary>
          <span>
            <small>전체 커리어 구간</small>
            <strong>6개 구간 · LV. 1–100</strong>
          </span>
          <em>보기</em>
        </summary>
        <div className="growth-hub-secondary-body">
          <div className="growth-hub-tier-table" aria-label="전체 커리어 리그표">
            {tierState.tiers.map((tier) => (
              <div
                className={`growth-hub-tier-row is-${tier.status}`}
                key={tier.stage}
              >
                <div className="growth-hub-tier-name">
                  <strong>{tier.stage}</strong>
                  <span>{getTierLevelRange(tier)}</span>
                </div>
                <div className="growth-hub-tier-reward">
                  <small>{getTierPerkLabel(tier)}</small>
                  <em>월간 +{tier.levels} LV</em>
                </div>
                <b aria-label={`${tier.stage} ${tier.status}`}>
                  {tier.status === "complete"
                    ? "완료"
                    : tier.status === "current"
                      ? "현재"
                      : "잠김"}
                </b>
              </div>
            ))}
          </div>
        </div>
      </details>

      <details className="growth-hub-secondary-details growth-hub-collections">
        <summary>
          <span>
            <small>수집 기록</small>
            <strong>
              칭호 {unlockedTitleCount} · 혜택 {unlockedPerkCount} · 업적 {unlockedAchievementCount}
            </strong>
          </span>
          <em>보기</em>
        </summary>
        <div className="growth-hub-secondary-body growth-collection-list">
          <button
            type="button"
            className="growth-collection-card-button"
            onClick={() => setActiveCollection("titles")}
          >
            <div className="growth-collection-card-head">
              <div>
                <p>TITLES</p>
                <h2>칭호 도감</h2>
              </div>
              <span>{unlockedTitleCount}/{titleCollection.length}</span>
            </div>
            <strong>
              {currentTitle?.ko ?? fighter.fighterTitle}
            </strong>
            <p>
              {nextTitle
                ? `다음 ${nextTitle.ko} · LV. ${nextTitle.level}`
                : "모든 칭호를 획득했습니다"}
            </p>
            <em>열기</em>
          </button>

          <button
            type="button"
            className="growth-collection-card-button"
            onClick={() => setActiveCollection("perks")}
          >
            <div className="growth-collection-card-head">
              <div>
                <p>VETERAN</p>
                <h2>베테랑 혜택</h2>
              </div>
              <span>{unlockedPerkCount}/{veteranPerks.length}</span>
            </div>
            <strong>{nextPerk ? nextPerk.label : "모든 혜택 해금"}</strong>
            <p>
              {nextPerk
                ? `다음 해금 LV. ${nextPerk.level} · ${PERK_KIND_LABEL[nextPerk.kind] || "혜택"}`
                : "명패와 카드에서 적용 중입니다"}
            </p>
            <em>열기</em>
          </button>

          <button
            type="button"
            className="growth-collection-card-button"
            onClick={() => setActiveCollection("achievements")}
          >
            <div className="growth-collection-card-head">
              <div>
                <p>ACHIEVEMENTS</p>
                <h2>업적</h2>
              </div>
              <span>{unlockedAchievementCount}/{achievements.length}</span>
            </div>
            <strong>
              {nextAchievement ? nextAchievement.title : "모든 업적 달성"}
            </strong>
            <p>
              {nextAchievement
                ? nextAchievement.description
                : "지나온 훈련의 장면을 모두 남겼습니다"}
            </p>
            <em>열기</em>
          </button>
        </div>
      </details>
      {collectionSheet}
    </main>
  );
}
