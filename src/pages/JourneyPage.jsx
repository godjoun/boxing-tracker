import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildJourneyData } from "../utils/fighterJourney";
import { getFighterProgress } from "../utils/fighterProgress";
import { getTitleCollection } from "../utils/fighterTitles";
import { getVeteranPerkCollection } from "../utils/veteranPerks";
import { getLogRounds } from "../utils/trainingStats";
import "./JourneyPage.css";

function formatDateLabel(dateKey) {
  if (!dateKey) return "";

  return String(dateKey).replaceAll("-", ".");
}

export default function JourneyPage({ onStartTraining, onGoBack }) {
  const { logs, profile, weeklyScore } = useTraining();

  const journey = useMemo(
    () => buildJourneyData({ logs, profile, weeklyScore }),
    [logs, profile, weeklyScore]
  );

  const fighter = useMemo(() => getFighterProgress(logs), [logs]);
  const titleCollection = useMemo(
    () => getTitleCollection(fighter.level),
    [fighter.level]
  );

  const { summary, timeline, memories, achievements } = journey;
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const unlockedTitleCount = titleCollection.filter((item) => item.unlocked).length;
  const nextTitle = titleCollection.find((item) => item.isNext);
  const currentTitle = titleCollection.find((item) => item.isCurrent);
  const [isTitleCollectionOpen, setIsTitleCollectionOpen] = useState(false);
  const veteranPerks = useMemo(
    () => getVeteranPerkCollection(fighter.level),
    [fighter.level]
  );
  const unlockedPerkCount = veteranPerks.filter((item) => item.unlocked).length;
  const nextPerk = veteranPerks.find((item) => item.isNext);
  const [isVeteranPerksOpen, setIsVeteranPerksOpen] = useState(false);

  const perkKindLabel = {
    badge: "배지",
    card_filter: "카드",
    frame: "명패",
  };

  return (
    <main className="journey-page">
      {onGoBack && (
        <button className="category-back" type="button" onClick={onGoBack}>
          <span>←</span> 성장
        </button>
      )}
      <header className="journey-hero">
        <p className="journey-kicker">MY JOURNEY</p>
        <h1>추억 보기</h1>
        <p className="journey-story">{summary.storyLine}</p>
      </header>

      <section className="journey-card journey-summary-card">
        <div className="journey-summary-grid">
          <div>
            <span>주인공</span>
            <strong>{summary.nickname}</strong>
          </div>
          <div>
            <span>칭호</span>
            <strong>{summary.fighterTitle}</strong>
          </div>
          <div>
            <span>누적</span>
            <strong>{summary.totalRounds}R</strong>
          </div>
          <div>
            <span>연속</span>
            <strong>{summary.streakDays}일</strong>
          </div>
        </div>
        <p className="journey-summary-note">
          {summary.careerStageKo} · {summary.levelLabel} · {summary.fighterTitle} ·
          이번 주 {summary.weeklyScore}점 · 총 EXP {summary.totalExp}
        </p>
      </section>

      <section
        className={`journey-card journey-title-card${isTitleCollectionOpen ? " is-open" : ""}`}
        id="title-collection"
      >
        <button
          type="button"
          className="journey-title-toggle"
          onClick={() => setIsTitleCollectionOpen((open) => !open)}
          aria-expanded={isTitleCollectionOpen}
          aria-controls="title-collection-body"
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
                ? `장착 ${currentTitle?.ko ?? summary.fighterTitle} · 다음 ${nextTitle.ko} (LV. ${nextTitle.level})`
                : `장착 ${currentTitle?.ko ?? summary.fighterTitle} · 모든 칭호 획득`}
            </p>
          ) : null}
        </button>

        {isTitleCollectionOpen ? (
          <div className="journey-title-body-panel" id="title-collection-body">
            {nextTitle ? (
              <p className="journey-title-next">
                다음 칭호 <strong>{nextTitle.ko}</strong> · LV. {nextTitle.level}
              </p>
            ) : (
              <p className="journey-title-next">
                모든 칭호를 획득했습니다. 레전드 달성!
              </p>
            )}

            <div className="journey-title-list">
              {titleCollection.map((title) => (
                <article
                  className={`journey-title-item is-${title.status}`}
                  key={title.level}
                >
                  <div className="journey-title-badge" aria-hidden="true">
                    {title.isCurrent ? "장착" : title.unlocked ? "획득" : title.isNext ? "다음" : "잠김"}
                  </div>
                  <div className="journey-title-copy">
                    <div className="journey-title-top">
                      <strong>{title.ko}</strong>
                      <span>LV. {title.level}</span>
                    </div>
                    <p className="journey-title-en">{title.en}</p>
                    <p className="journey-title-flavor">{title.flavor}</p>
                    <p className="journey-title-stage">{title.stageKo}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`journey-card journey-perk-card${isVeteranPerksOpen ? " is-open" : ""}`}
        id="veteran-perks"
      >
        <button
          type="button"
          className="journey-title-toggle"
          onClick={() => setIsVeteranPerksOpen((open) => !open)}
          aria-expanded={isVeteranPerksOpen}
          aria-controls="veteran-perks-body"
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
          <div className="journey-title-body-panel" id="veteran-perks-body">
            {nextPerk ? (
              <p className="journey-title-next">
                다음 혜택 <strong>{nextPerk.label}</strong> · LV. {nextPerk.level}
              </p>
            ) : (
              <p className="journey-title-next">
                장기 훈련의 모든 베테랑 혜택을 해금했습니다.
              </p>
            )}

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
                      {perkKindLabel[perk.kind] || "혜택"}
                    </p>
                    <p className="journey-title-flavor">{perk.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {logs.length === 0 ? (
        <section className="journey-card journey-empty">
          <p>아직 쌓인 추억이 없어요.</p>
          <button type="button" className="journey-cta" onClick={onStartTraining}>
            첫 훈련 시작하기
          </button>
        </section>
      ) : (
        <>
          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">TIMELINE</p>
                <h2>이정표</h2>
              </div>
              <span className="journey-count">{timeline.length}개</span>
            </div>

            <div className="journey-timeline">
              {timeline.map((item, index) => (
                <article className="journey-timeline-item" key={item.id}>
                  <div className="journey-timeline-marker" aria-hidden="true">
                    <span />
                    {index < timeline.length - 1 ? <i /> : null}
                  </div>
                  <div className="journey-timeline-body">
                    <time>{formatDateLabel(item.date)}</time>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">MEMORIES</p>
                <h2>기억에 남는 훈련</h2>
              </div>
            </div>

            {memories.length === 0 ? (
              <p className="journey-muted">
                기록에 메모나 공개 코멘트를 남기면 여기에 쌓입니다.
              </p>
            ) : (
              <div className="journey-memory-list">
                {memories.map((log) => {
                  const rounds = getLogRounds(log);

                  return (
                    <article className="journey-memory-item" key={log.id}>
                      <div className="journey-memory-top">
                        <div>
                          <strong>{log.type}</strong>
                          <p>
                            {formatDateLabel(log.date)} · {rounds}R ·{" "}
                            {log.minutes || log.duration}분
                          </p>
                        </div>
                        <span>+{log.score} EXP</span>
                      </div>
                      <blockquote>
                        {log.publicComment || log.memo}
                      </blockquote>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">ACHIEVEMENTS</p>
                <h2>업적</h2>
              </div>
              <span className="journey-count">
                {unlockedCount}/{achievements.length}
              </span>
            </div>

            <div className="journey-achievement-list">
              {achievements.map((achievement) => (
                <div
                  className={`journey-achievement${achievement.unlocked ? " is-unlocked" : ""}`}
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
          </section>
        </>
      )}
    </main>
  );
}
