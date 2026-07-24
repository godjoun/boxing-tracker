import { useEffect } from "react";
import {
  BRAND_NAME,
  BRAND_PHILOSOPHY_EN,
  BRAND_SLOGAN_EN,
} from "../utils/brand";
import "./EntryBanner.css";

/**
 * 입장 흰 화면 배너 — 로고 · MANTLE · 슬로건 · 철학 (영문만).
 * mode="welcome": 온보딩 첫 화면
 * mode="splash": 앱 재입장 시 짧은 배너 (자동/탭으로 닫힘)
 */
export default function EntryBanner({
  mode = "splash",
  onContinue,
  durationMs = 1800,
  welcomeSupport = "",
}) {
  const isWelcome = mode === "welcome";

  useEffect(() => {
    if (isWelcome || !onContinue) return undefined;
    const timer = window.setTimeout(onContinue, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, isWelcome, onContinue]);

  return (
    <div
      className={`entry-banner${isWelcome ? " is-welcome" : " is-splash"}`}
      role={isWelcome ? "dialog" : "status"}
      aria-label={`${BRAND_NAME} entry`}
      aria-live={isWelcome ? undefined : "polite"}
      onClick={isWelcome ? undefined : onContinue}
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
        {isWelcome && welcomeSupport ? (
          <p className="entry-banner-welcome-support">{welcomeSupport}</p>
        ) : null}
      </div>

      {isWelcome ? (
        <footer className="entry-banner-footer">
          <button
            type="button"
            className="entry-banner-cta"
            onClick={onContinue}
          >
            START
          </button>
        </footer>
      ) : (
        <p className="entry-banner-skip">Tap to enter</p>
      )}
    </div>
  );
}
