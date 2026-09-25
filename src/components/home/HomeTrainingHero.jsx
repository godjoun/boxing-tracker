export default function HomeTrainingHero({
  heroInputRef,
  heroStats = [],
  homeHeroPhoto = "",
  isHeroMenuOpen = false,
  primaryLabel,
  sceneCopy,
  sceneTitle,
  showNextAction = false,
  trainedToday = false,
  nextActionLabel = "",
  onHeroPhotoChange,
  onNextAction,
  onPrimaryAction,
  onRemoveHeroPhoto,
  onToggleHeroMenu,
}) {
  return (
    <section
      className={`home-scene-card home-scene-card-hero home-command-board${
        homeHeroPhoto ? " has-custom-photo" : " home-scene-card-hero-default"
      }`}
      aria-label="오늘의 훈련"
    >
      {homeHeroPhoto ? (
        <>
          <img
            className="home-scene-card-image"
            src={homeHeroPhoto}
            alt=""
            aria-hidden="true"
          />
          <div className="home-scene-card-shade" aria-hidden="true" />
        </>
      ) : (
        <div className="home-scene-card-default-stage" aria-hidden="true" />
      )}

      <div className="home-scene-photo-control">
        <button
          type="button"
          className="home-scene-menu-button"
          aria-label="오늘 장면 사진 메뉴"
          aria-expanded={isHeroMenuOpen}
          title="사진 설정"
          onClick={onToggleHeroMenu}
        >
          <span aria-hidden="true">•••</span>
        </button>
        {isHeroMenuOpen ? (
          <div className="home-scene-photo-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => heroInputRef.current?.click()}
            >
              {homeHeroPhoto ? "사진 교체" : "사진 선택"}
            </button>
            {homeHeroPhoto ? (
              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onClick={onRemoveHeroPhoto}
              >
                사진 제거
              </button>
            ) : null}
          </div>
        ) : null}
        <input
          ref={heroInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onHeroPhotoChange}
          hidden
        />
      </div>

      <div className="home-board-topline">
        <p className="home-scene-kicker">
          {trainedToday ? "기록 완료" : "오늘의 세션"}
        </p>
      </div>
      <h1 className="home-scene-title">{sceneTitle}</h1>
      <p className="home-scene-copy">{sceneCopy}</p>

      <div className="home-session-stats" aria-label="오늘 훈련 요약">
        {heroStats.map((stat) => (
          <span key={stat.label}>
            <small>{stat.label}</small>
            <strong>{stat.value}</strong>
          </span>
        ))}
      </div>

      <div
        className={`home-session-track${trainedToday ? " is-complete" : ""}`}
        aria-hidden="true"
      >
        <span>{trainedToday ? "완료" : "준비"}</span>
        <i />
        <span>{trainedToday ? "기록" : "훈련"}</span>
        <i />
        <span>{trainedToday ? "다음" : "저장"}</span>
      </div>

      <div className="home-scene-actions">
        <button
          type="button"
          className="home-scene-primary"
          data-tutorial-target="home-start"
          onClick={onPrimaryAction}
        >
          {primaryLabel}
        </button>
        {showNextAction ? (
          <button
            type="button"
            className="home-scene-secondary-link home-next-session"
            onClick={onNextAction}
          >
            {nextActionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
