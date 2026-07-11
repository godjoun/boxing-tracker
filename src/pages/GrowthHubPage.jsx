import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildJourneyAchievements } from "../utils/fighterJourney";
import { getFighterProgress } from "../utils/fighterProgress";
import { getTitleCollection } from "../utils/fighterTitles";
import { getCurriculumProgress } from "../utils/homeCurriculum";
import {
  getNextGrowthMilestone,
  getNextWeeklyRoundGoal,
  getWeeklyGoalStatus,
  readWeeklyRoundGoal,
  writeWeeklyRoundGoal,
} from "../utils/growthGoals";
import { getVeteranPerkCollection } from "../utils/veteranPerks";
import { buildAllTimeStats, buildWeeklyReport } from "../utils/trainingStats";
import "./GrowthHubPage.css";
import "./JourneyPage.css";

const PERK_KIND_LABEL = {
  badge: "배지",
  card_filter: "카드",
  frame: "명패",
};

export default function GrowthHubPage({
  onOpenCurriculum,
  onStartTraining,
}) {
  const { logs, weeklyScore } = useTraining();
  const [weeklyGoal, setWeeklyGoal] = useState(readWeeklyRoundGoal);
  const [isTitleCollectionOpen, setIsTitleCollectionOpen] = useState(false);
  const [isVeteranPerksOpen, setIsVeteranPerksOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const {
    fighter,
    stats,
    curriculum,
    weeklyGoalStatus,
    milestone,
    weeklyReport,
    titleCollection,
    veteranPerks,
    achievements,
  } = useMemo(() => {
    return {
      fighter: getFighterProgress(logs),
      stats: buildAllTimeStats(logs),
      curriculum: getCurriculumProgress(),
      weeklyGoalStatus: getWeeklyGoalStatus(logs, weeklyGoal),
      milestone: getNextGrowthMilestone(logs),
      weeklyReport: buildWeeklyReport(logs),
      titleCollection: getTitleCollection(getFighterProgress(logs).level),
      veteranPerks: getVeteranPerkCollection(getFighterProgress(logs).level),
      achievements: buildJourneyAchievements(logs),
    };
  }, [logs, weeklyGoal]);

  const isEmpty = fighter.totalLogs === 0;
  const unlockedTitleCount = titleCollection.filter((item) => item.unlocked).length;
  const unlockedPerkCount = veteranPerks.filter((item) => item.unlocked).length;
  const unlockedAchievementCount = achievements.filter((item) => item.unlocked).length;
  const nextTitle = titleCollection.find((item) => item.isNext);
  const currentTitle = titleCollection.find((item) => item.isCurrent);
  const nextPerk = veteranPerks.find((item) => item.isNext);

  function handleCycleWeeklyGoal() {
    const nextGoal = getNextWeeklyRoundGoal(weeklyGoal);
    writeWeeklyRoundGoal(nextGoal);
    setWeeklyGoal(nextGoal);
  }

  return (
    <main className="hub-page growth-hub-page">
      <header className="growth-hub-header">
        <h1 className="growth-hub-title">성장</h1>
        <p className="growth-hub-subtitle">
          목표를 채우고 칭호·업적을 모아 보세요.
        </p>
      </header>

      {isEmpty ? (
        <section className="growth-hub-empty">
          <p className="growth-hub-empty-kicker">FIRST ROUND</p>
          <h2 className="growth-hub-empty-title">아직 훈련 기록이 없어요</h2>
          <p className="growth-hub-empty-text">
            타이머로 첫 라운드를 완료하면 EXP가 쌓이고, 여기에 성장 데이터가
            표시됩니다.
          </p>
          <button
            type="button"
            className="growth-hub-empty-button"
            onClick={onStartTraining}
          >
            3R 바로 시작하기
          </button>
        </section>
      ) : null}

      <section className="growth-hub-summary" aria-label="성장 요약">
        <div className="growth-hub-summary-item">
          <span>레벨</span>
          <strong>LV.{fighter.level}</strong>
        </div>
        <div className="growth-hub-summary-item">
          <span>누적 라운드</span>
          <strong>{stats.totalRounds}R</strong>
        </div>
        <div className="growth-hub-summary-item">
          <span>이번 주 EXP</span>
          <strong>{weeklyScore}</strong>
        </div>
      </section>

      <p className="growth-hub-exp-hint">
        주간 EXP = 이번 주 획득한 경험치 합계입니다.
      </p>

      <section className="growth-hub-card growth-hub-weekly-goal">
        <div className="growth-hub-card-head">
          <div>
            <p className="growth-hub-kicker">WEEKLY GOAL</p>
            <h2 className="growth-hub-card-title">이번 주 목표</h2>
          </div>
          <button
            type="button"
            className="growth-hub-goal-target"
            onClick={handleCycleWeeklyGoal}
            aria-label={`주간 목표 변경, 현재 ${weeklyGoal}라운드`}
          >
            {weeklyGoal}R
          </button>
        </div>

        <div className="growth-hub-progress-meta">
          <strong>
            {weeklyGoalStatus.currentRounds}/{weeklyGoalStatus.targetRounds}R
          </strong>
          <span>
            {weeklyGoalStatus.isComplete
              ? "목표 달성"
              : `${weeklyGoalStatus.remainingRounds}R 남음`}
          </span>
        </div>

        <div className="growth-hub-progress-track" aria-hidden="true">
          <div
            className={`growth-hub-progress-fill${
              weeklyGoalStatus.isComplete ? " is-complete" : ""
            }`}
            style={{ width: `${weeklyGoalStatus.progressPercent}%` }}
          />
        </div>

        <p className="growth-hub-card-note">
          {weeklyGoalStatus.isComplete
            ? "이번 주 목표를 달성했어요. 다음 주에도 이어가 보세요."
            : "목표 숫자를 눌러 9R · 12R · 15R · 21R 중에서 바꿀 수 있어요."}
        </p>
      </section>

      {!isEmpty && weeklyReport.highlights.length > 0 ? (
        <section className="growth-hub-card growth-hub-weekly-report">
          <div className="growth-hub-card-head">
            <div>
              <p className="growth-hub-kicker">WEEKLY REPORT</p>
              <h2 className="growth-hub-card-title">이번 주 한 줄</h2>
            </div>
            <span className="growth-hub-weekly-report-label">{weeklyReport.weekLabel}</span>
          </div>

          <ul className="growth-hub-weekly-report-list">
            {weeklyReport.highlights.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p className="growth-hub-card-note">
            {weeklyReport.totalRounds}R · {weeklyReport.totalSessions}회 ·{" "}
            {weeklyReport.totalMinutes}분 훈련
          </p>
        </section>
      ) : null}

      {milestone ? (
        <section className="growth-hub-card growth-hub-milestone">
          <div className="growth-hub-card-head">
            <div>
              <p className="growth-hub-kicker">{milestone.kicker}</p>
              <h2 className="growth-hub-card-title">다음 마일스톤</h2>
            </div>
          </div>

          <strong className="growth-hub-milestone-name">{milestone.title}</strong>
          <p className="growth-hub-milestone-desc">{milestone.description}</p>

          <div className="growth-hub-progress-meta">
            <strong>{milestone.progressPercent}%</strong>
            <span>{milestone.remainingLabel}</span>
          </div>

          <div className="growth-hub-progress-track" aria-hidden="true">
            <div
              className="growth-hub-progress-fill is-gold"
              style={{ width: `${milestone.progressPercent}%` }}
            />
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="growth-hub-card growth-hub-curriculum is-clickable"
        onClick={onOpenCurriculum}
      >
        <div className="growth-hub-card-head">
          <div>
            <p className="growth-hub-kicker">LEARN</p>
            <strong className="growth-hub-card-title">
              {curriculum.isComplete
                ? "프로그램 완주"
                : `배움 ${curriculum.completedCount}/${curriculum.totalSessions}`}
            </strong>
            <small className="growth-hub-card-desc">
              {curriculum.isComplete
                ? "4주 프로그램을 모두 마쳤어요"
                : "4주 코스에서 영상·훈련을 이어갈 수 있어요"}
            </small>
          </div>
          <span className="growth-hub-card-arrow" aria-hidden="true">
            →
          </span>
        </div>

        <div className="growth-hub-progress-track" aria-hidden="true">
          <div
            className="growth-hub-progress-fill"
            style={{ width: `${curriculum.progressPercent}%` }}
          />
        </div>
      </button>

      <div className="growth-hub-collections">
        <section
          className={`journey-card journey-title-card${
            isTitleCollectionOpen ? " is-open" : ""
          }`}
        >
          <button
            type="button"
            className="journey-title-toggle"
            onClick={() => setIsTitleCollectionOpen((open) => !open)}
            aria-expanded={isTitleCollectionOpen}
          >
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">TITLES</p>
                <h2>칭호 도감</h2>
              </div>
              <div className="journey-title-toggle-meta">
                <span className="journey-count">
                  {unlockedTitleCount}/{titleCollection.length}
                </span>
                <span className="journey-title-toggle-action">
                  {isTitleCollectionOpen ? "접기 ▲" : "펼치기 ▼"}
                </span>
              </div>
            </div>
            {!isTitleCollectionOpen ? (
              <p className="journey-title-collapsed-hint">
                {nextTitle
                  ? `장착 ${currentTitle?.ko ?? fighter.fighterTitle} · 다음 ${nextTitle.ko} (LV. ${nextTitle.level})`
                  : `장착 ${currentTitle?.ko ?? fighter.fighterTitle} · 모든 칭호 획득`}
              </p>
            ) : null}
          </button>

          {isTitleCollectionOpen ? (
            <div className="journey-title-body-panel">
              {nextTitle ? (
                <p className="journey-title-next">
                  다음 칭호 <strong>{nextTitle.ko}</strong> · LV. {nextTitle.level}
                </p>
              ) : (
                <p className="journey-title-next">모든 칭호를 획득했습니다.</p>
              )}

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
            </div>
          ) : null}
        </section>

        <section
          className={`journey-card journey-perk-card${
            isVeteranPerksOpen ? " is-open" : ""
          }`}
        >
          <button
            type="button"
            className="journey-title-toggle"
            onClick={() => setIsVeteranPerksOpen((open) => !open)}
            aria-expanded={isVeteranPerksOpen}
          >
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">VETERAN</p>
                <h2>베테랑 혜택</h2>
              </div>
              <div className="journey-title-toggle-meta">
                <span className="journey-count">
                  {unlockedPerkCount}/{veteranPerks.length}
                </span>
                <span className="journey-title-toggle-action">
                  {isVeteranPerksOpen ? "접기 ▲" : "펼치기 ▼"}
                </span>
              </div>
            </div>
            {!isVeteranPerksOpen ? (
              <p className="journey-title-collapsed-hint">
                {nextPerk
                  ? `다음 혜택 ${nextPerk.label} · LV. ${nextPerk.level}`
                  : "모든 베테랑 혜택을 해금했습니다"}
              </p>
            ) : null}
          </button>

          {isVeteranPerksOpen ? (
            <div className="journey-title-body-panel">
              <div className="journey-title-list">
                {veteranPerks.map((perk) => (
                  <article
                    className={`journey-title-item is-${perk.status}`}
                    key={perk.id}
                  >
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
            </div>
          ) : null}
        </section>

        <section
          className={`journey-card journey-achievement-card${
            isAchievementsOpen ? " is-open" : ""
          }`}
        >
          <button
            type="button"
            className="journey-title-toggle"
            onClick={() => setIsAchievementsOpen((open) => !open)}
            aria-expanded={isAchievementsOpen}
          >
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">ACHIEVEMENTS</p>
                <h2>업적</h2>
              </div>
              <div className="journey-title-toggle-meta">
                <span className="journey-count">
                  {unlockedAchievementCount}/{achievements.length}
                </span>
                <span className="journey-title-toggle-action">
                  {isAchievementsOpen ? "접기 ▲" : "펼치기 ▼"}
                </span>
              </div>
            </div>
            {!isAchievementsOpen ? (
              <p className="journey-title-collapsed-hint">
                {unlockedAchievementCount === achievements.length
                  ? "모든 업적을 달성했습니다"
                  : `달성 ${unlockedAchievementCount}개 · 아래에서 전체 목록 확인`}
              </p>
            ) : null}
          </button>

          {isAchievementsOpen ? (
            <div className="journey-title-body-panel">
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
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
