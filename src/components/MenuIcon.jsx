/** 링·복싱 톤 선 아이콘 (currentColor) */
const ICONS = {
  home: (
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
  ),
  /** 링 = 대각선(원근) 시점 */
  ring: (
    <>
      {/* 바닥 마름모 */}
      <path d="M12 4.5 20.5 9.5 12 14.5 3.5 9.5Z" />
      {/* 앞·옆 수직면 */}
      <path d="M3.5 9.5v6L12 20.5V14.5" />
      <path d="M20.5 9.5v6L12 20.5" />
      {/* 로프 2단 (앞면) */}
      <path d="M4.4 11.6 12 16l7.6-4.4" />
      <path d="M4.4 13.6 12 18l7.6-4.4" />
    </>
  ),
  /** 라운드 = 벨/시계 원 */
  round: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9.5M9 4.5h6" />
      <path d="M5.5 7.5 4 6M18.5 7.5 20 6" />
    </>
  ),
  /** 기술 = 글러브 실루엣 단순화 */
  skill: (
    <>
      <path d="M8 14c0-3.2 2-5.5 4.5-5.5S17 10.8 17 14v3.5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14Z" />
      <path d="M10 8.5V7a2 2 0 0 1 4 0v1.5" />
      <path d="M8.5 16.5h7" />
    </>
  ),
  /** 신체 = 몸통/코어 */
  body: (
    <>
      <circle cx="12" cy="5.5" r="2" />
      <path d="M8 10.5h8l-1.2 9H9.2L8 10.5Z" />
      <path d="M6.5 12.5 4.5 15M17.5 12.5 19.5 15" />
    </>
  ),
  /** 콤보 = 연속 타격 */
  combo: (
    <>
      <circle cx="6.5" cy="12" r="2.2" />
      <circle cx="12" cy="8.5" r="2.2" />
      <circle cx="17.5" cy="12" r="2.2" />
      <path d="M8.3 11.2 10.2 9.5M13.8 9.5 15.7 11.2" />
    </>
  ),
  /** 기록 */
  log: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  /** 훈련 카드 / 포스터 */
  card: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <path d="M8 8h8M8 11.5h8M8 15h5" />
    </>
  ),
  /** 명패 */
  nameplate: (
    <>
      <rect x="3.5" y="7" width="17" height="10" rx="1.5" />
      <path d="M7 12h10M9.5 9.5h5" />
    </>
  ),
  /** 성장 */
  growth: (
    <>
      <path d="M4 17h16" />
      <path d="M7 17V13M12 17V9M17 17V6" />
    </>
  ),
  /** 도장 */
  dojo: (
    <>
      <path d="M4 19V9l8-5 8 5v10" />
      <path d="M10 19v-6h4v6" />
    </>
  ),
  /** 백업 */
  backup: (
    <>
      <path d="M12 4v10" />
      <path d="M8.5 10.5 12 14l3.5-3.5" />
      <path d="M5 18h14" />
    </>
  ),
  /** 더보기 */
  more: (
    <>
      <rect x="5" y="5" width="5" height="5" rx="1" />
      <rect x="14" y="5" width="5" height="5" rx="1" />
      <rect x="5" y="14" width="5" height="5" rx="1" />
      <rect x="14" y="14" width="5" height="5" rx="1" />
    </>
  ),
  themeLight: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5" />
    </>
  ),
  themeDark: (
    <path d="M15.5 3.8A8.2 8.2 0 1 0 20.2 15 6.5 6.5 0 0 1 15.5 3.8Z" />
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.2a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.2.9-1.2 1.8V14" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  fresh: (
    <>
      <path d="M18.5 10a6.5 6.5 0 1 0-1.4 5.2" />
      <path d="M18.5 6.5V10h-3.5" />
    </>
  ),
};

export default function MenuIcon({ name, size = 18, className = "" }) {
  const paths = ICONS[name] || ICONS.ring;

  return (
    <svg
      className={`menu-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
