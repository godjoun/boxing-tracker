import {
  BRAND_NAME,
  BRAND_PHILOSOPHY_EN,
  BRAND_SLOGAN_EN,
} from "../utils/brand";
import "./EntryBanner.css";

/**
 * 온보딩 첫 화면 — 로고 · PUNCH ERA · 슬로건 · 철학 (영문만).
 * mount 시 완성본으로 표시 (fade/stagger 없음).
 */
export default function EntryBanner({
  onContinue,
  welcomeSupport = "",
}) {
  return (
    <div
      className="entry-banner is-welcome"
      role="dialog"
      aria-label={`${BRAND_NAME} entry`}
    >
      <div className="entry-banner-stage">
        <img
          className="entry-banner-mark"
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt=""
          width={128}
          height={128}
        />
        <p className="entry-banner-kicker">BOXING · LIFE</p>
        <h1 className="entry-banner-name">{BRAND_NAME}</h1>
        <p className="entry-banner-slogan">{BRAND_SLOGAN_EN}</p>
        <p className="entry-banner-philosophy">{BRAND_PHILOSOPHY_EN}</p>
        {welcomeSupport ? (
          <p className="entry-banner-welcome-support">{welcomeSupport}</p>
        ) : null}
      </div>

      <footer className="entry-banner-footer">
        <button
          type="button"
          className="entry-banner-cta"
          onClick={onContinue}
        >
          START
        </button>
      </footer>
    </div>
  );
}
