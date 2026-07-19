import { getFighterProgress } from "../utils/fighterProgress";
import { getNameplateTier, getVeteranBadges } from "../utils/veteranPerks";
import "./FighterSpecCard.css";

export default function FighterSpecCard({
  profile,
  logs,
  weeklyScore,
  titleBadge,
  careerStageKo,
  streakDays = 0,
  onUploadPhoto,
  onRemovePhoto,
  children,
}) {
  const fighter = getFighterProgress(logs);
  const nameplateTier = getNameplateTier(fighter.level);
  const veteranBadges = getVeteranBadges(fighter.level);

  const specItems = [
    profile?.weightClass && { label: "체급", value: profile.weightClass },
    profile?.experience && { label: "경력", value: profile.experience },
    profile?.heightCm && { label: "키", value: `${profile.heightCm}cm` },
    profile?.weightKg && { label: "체중", value: `${profile.weightKg}kg` },
    profile?.reachCm && { label: "리치", value: `${profile.reachCm}cm` },
  ].filter(Boolean);

  return (
    <section className="fighter-nameplate" aria-label="명패">
      <div className={`fighter-nameplate-frame tier-${nameplateTier}`}>
        <div className="fighter-nameplate-accent" aria-hidden="true" />

        {veteranBadges.length > 0 ? (
          <div className="fighter-nameplate-veteran-badges" aria-label="베테랑 인증">
            {veteranBadges.map((badge) => (
              <span key={badge} className="fighter-nameplate-veteran-badge">
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="fighter-nameplate-top">
          {onUploadPhoto ? (
            <button
              type="button"
              className="fighter-nameplate-photo fighter-nameplate-photo-btn"
              onClick={onUploadPhoto}
              aria-label={profile?.photo ? "프로필 사진 변경" : "프로필 사진 업로드"}
            >
              {profile?.photo ? (
                <img src={profile.photo} alt="" />
              ) : (
                <span className="fighter-nameplate-photo-empty">
                  <em>사진</em>
                  <strong>+</strong>
                </span>
              )}
              <span className="fighter-nameplate-photo-overlay" aria-hidden="true">
                {profile?.photo ? "변경" : "추가"}
              </span>
            </button>
          ) : (
            <div className="fighter-nameplate-photo">
              {profile?.photo ? (
                <img src={profile.photo} alt="" />
              ) : (
                <span className="fighter-nameplate-photo-empty">NO PHOTO</span>
              )}
            </div>
          )}

          <div className="fighter-nameplate-identity">
            <p className="fighter-nameplate-kicker">ROUND ON</p>
            <h2 className="fighter-nameplate-name">{profile?.nickname || "나"}</h2>
            <p className="fighter-nameplate-title">{fighter.fighterTitle}</p>
            {fighter.fighterTitleEn ? (
              <p className="fighter-nameplate-title-en">{fighter.fighterTitleEn}</p>
            ) : null}
            {profile?.bio ? (
              <p className="fighter-nameplate-bio">{profile.bio}</p>
            ) : null}
          </div>

          <div className="fighter-nameplate-badge">
            <span className="fighter-nameplate-badge-label">LV</span>
            <strong>{fighter.level}</strong>
            <small>{careerStageKo || fighter.careerStageKo || "일반인"}</small>
          </div>
        </div>

        {onUploadPhoto ? (
          <div className="fighter-nameplate-photo-actions">
            <button
              type="button"
              className="fighter-nameplate-photo-action is-primary"
              onClick={onUploadPhoto}
            >
              {profile?.photo ? "사진 변경" : "사진 업로드"}
            </button>
            {profile?.photo && onRemovePhoto ? (
              <button
                type="button"
                className="fighter-nameplate-photo-action"
                onClick={onRemovePhoto}
              >
                삭제
              </button>
            ) : null}
          </div>
        ) : null}

        {children ? (
          <div className="fighter-nameplate-edit">{children}</div>
        ) : null}

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
              {fighter.isMaxLevel
                ? "MAX LEVEL"
                : `${fighter.currentLevelExp} / ${fighter.nextLevelExp} EXP`}
            </span>
          </div>
          <div className="fighter-nameplate-bar" aria-hidden="true">
            <div style={{ width: `${fighter.progressPercent}%` }} />
          </div>
          <p className="fighter-nameplate-exp-note">
            {fighter.isMaxLevel
              ? "최대 레벨 달성"
              : `다음 레벨까지 ${fighter.xpToNextLevel} EXP`}
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
            <span>주간 EXP</span>
            <strong>{weeklyScore ?? 0}</strong>
            {streakDays > 0 ? <small>{streakDays}일 연속</small> : null}
          </div>
        </div>

      </div>
    </section>
  );
}
