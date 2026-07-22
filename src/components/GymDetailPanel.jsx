import { getGymPassLines } from "../utils/gymPricing";

/**
 * 관 상세 — 목록 → 한 장면.
 * 참고 IA: 당근 비즈프로필(커버·소개·가격·문의) · 플랩(장소→행동) · BN(짐 허브)
 * 복제 X. 커뮤니티 탭은 자리만 비워 둠.
 */
export default function GymDetailPanel({
  gym,
  onClose,
  onInquire,
  onOpenLedger,
  isOwn = false,
}) {
  if (!gym) return null;

  const passes = getGymPassLines(gym);
  const isFeatured = Boolean(gym.featured);
  const isListing = gym.source === "listing";

  return (
    <section className="gym-detail-panel" aria-label={`${gym.name} 상세`}>
      <button type="button" className="gym-listing-back" onClick={onClose}>
        ← 목록으로
      </button>

      <div className="gym-detail-hero">
        {gym.photoUrl ? (
          <img className="gym-detail-hero-photo" src={gym.photoUrl} alt="" />
        ) : (
          <div className="gym-detail-hero-photo is-empty" aria-hidden="true">
            <span>GYM</span>
          </div>
        )}
        <div className="gym-detail-hero-fade" aria-hidden="true" />
        <div className="gym-detail-hero-copy">
          <p className="gym-listing-kicker">
            {isOwn
              ? "MY GYM"
              : isFeatured
                ? "FEATURED"
                : isListing
                  ? "LISTED GYM"
                  : "NEARBY"}
          </p>
          <h2>{gym.name}</h2>
          {gym.distanceLabel ? (
            <p className="gym-detail-meta">{gym.distanceLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="gym-detail-body">
        {gym.intro ? (
          <p className="gym-detail-intro">{gym.intro}</p>
        ) : (
          <p className="gym-detail-intro is-muted">
            {isListing
              ? "관에서 올린 소개가 아직 없습니다."
              : "근처 검색 결과입니다. 문의로 일정·가격을 확인하세요."}
          </p>
        )}

        {gym.address ? (
          <p className="gym-detail-address">{gym.address}</p>
        ) : null}

        {gym.tags?.length > 0 ? (
          <p className="gym-detail-tags">{gym.tags.join(" · ")}</p>
        ) : null}

        <aside className="gym-detail-passes" aria-label="이용권 가격">
          {passes.map((pass) => (
            <div key={pass.key} className="gym-detail-pass">
              <span>{pass.label}</span>
              <strong>{pass.value}</strong>
            </div>
          ))}
        </aside>

        <div className="gym-detail-community-slot" aria-label="관 커뮤니티">
          <p className="gym-listing-kicker">COMMUNITY</p>
          <strong>관 소식</strong>
          <p>커뮤니티·공지는 관 페이지가 안정된 뒤 붙입니다.</p>
        </div>
      </div>

      <div className="gym-detail-cta">
        {isOwn ? (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => onOpenLedger?.()}
          >
            받은 문의 보기
          </button>
        ) : (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => onInquire?.(gym)}
          >
            문의하기
          </button>
        )}
      </div>
    </section>
  );
}
