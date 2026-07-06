import { getFighterProgress } from "../utils/fighterProgress";
import "./FighterSpecCard.css";

export default function FighterSpecCard({
  profile,
  logs,
  weeklyScore,
  tierName,
  streakDays = 0,
  onOpenCardMaker,
}) {
  const fighter = getFighterProgress(logs);

  const specItems = [
    profile?.weightClass && { label: "체급", value: profile.weightClass },
    profile?.experience && { label: "경력", value: profile.experience },
    profile?.heightCm && { label: "키", value: `${profile.heightCm}cm` },
    profile?.weightKg && { label: "체중", value: `${profile.weightKg}kg` },
    profile?.reachCm && { label: "리치", value: `${profile.reachCm}cm` },
  ].filter(Boolean);

  return (
    <section className="fighter-nameplate" aria-label="파이터 명패">
      <div className="fighter-nameplate-frame">
        <div className="fighter-nameplate-accent" aria-hidden="true" />

        <div className="fighter-nameplate-top">
          <div className="fighter-nameplate-photo">
            {profile?.photo ? (
              <img src={profile.photo} alt="" />
            ) : (
              <span className="fighter-nameplate-photo-empty">NO PHOTO</span>
            )}
          </div>

          <div className="fighter-nameplate-identity">
            <p className="fighter-nameplate-kicker">MY FIGHTER</p>
            <h2 className="fighter-nameplate-name">{profile?.nickname || "나"}</h2>
            <p className="fighter-nameplate-title">{fighter.fighterTitle}</p>
            {profile?.bio ? (
              <p className="fighter-nameplate-bio">{profile.bio}</p>
            ) : null}
          </div>

          <div className="fighter-nameplate-badge">
            <span className="fighter-nameplate-badge-label">LV</span>
            <strong>{fighter.level}</strong>
            <small>{tierName || "시즌 —"}</small>
          </div>
        </div>

        {specItems.length > 0 ? (
          <div className="fighter-nameplate-specs">
            {specItems.map((item) => (
              <span key={item.label} className="fighter-nameplate-spec">
                <em>{item.label}</em>
                {item.value}
              </span>
            ))}
          </div>
        ) : (
          <p className="fighter-nameplate-spec-empty">
            프로필에서 신체 스펙을 입력하면 명패에 표시됩니다
          </p>
        )}

        <div className="fighter-nameplate-progress">
          <div className="fighter-nameplate-progress-head">
            <span>{fighter.levelLabel}</span>
            <span>
              {fighter.currentLevelExp} / {fighter.nextLevelExp} EXP
            </span>
          </div>
          <div className="fighter-nameplate-bar" aria-hidden="true">
            <div style={{ width: `${fighter.progressPercent}%` }} />
          </div>
          <p className="fighter-nameplate-exp-note">
            다음 레벨까지 {fighter.xpToNextLevel} EXP
          </p>
        </div>

        <div className="fighter-nameplate-grid">
          <div className="fighter-nameplate-stat">
            <span>이번 주</span>
            <strong>{fighter.weeklyRounds}R</strong>
          </div>
          <div className="fighter-nameplate-stat">
            <span>누적</span>
            <strong>{fighter.totalRounds}R</strong>
          </div>
          <div className="fighter-nameplate-stat">
            <span>총 EXP</span>
            <strong>{fighter.totalExp}</strong>
          </div>
          <div className="fighter-nameplate-stat">
            <span>시즌</span>
            <strong>{weeklyScore ?? 0}점</strong>
            {streakDays > 0 ? <small>{streakDays}일 연속</small> : null}
          </div>
        </div>

        {onOpenCardMaker ? (
          <button
            type="button"
            className="fighter-nameplate-cta"
            onClick={onOpenCardMaker}
          >
            훈련 카드 만들기
          </button>
        ) : null}
      </div>
    </section>
  );
}
