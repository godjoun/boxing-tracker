import "./ComposerShell.css";

/**
 * Shared mobile layout: summary → segments → workspace → fixed dock.
 * Same interaction shape as Combo Creator.
 */
export default function ComposerShell({
  className = "",
  back = null,
  title = null,
  kicker = null,
  summary = null,
  segments = null,
  children,
  dock = null,
  hideDock = false,
}) {
  return (
    <main
      className={`composer-shell${dock && !hideDock ? " has-dock" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {(back || title || kicker) && (
        <header className="composer-shell-header">
          {back}
          <div className="composer-shell-heading">
            {kicker ? <p className="composer-shell-kicker">{kicker}</p> : null}
            {title ? <h1 className="composer-shell-title">{title}</h1> : null}
          </div>
        </header>
      )}

      {summary ? (
        <section className="composer-shell-summary">{summary}</section>
      ) : null}

      {segments ? (
        <nav className="composer-shell-segments" aria-label="메뉴">
          {segments}
        </nav>
      ) : null}

      <section className="composer-shell-workspace">{children}</section>

      {dock && !hideDock ? (
        <div className="composer-shell-dock">{dock}</div>
      ) : null}
    </main>
  );
}

export function ComposerSegmentTabs({
  tabs = [],
  activeId,
  onChange,
  ariaLabel = "메뉴",
}) {
  return (
    <div className="composer-segment-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          className={`composer-segment-tab${
            activeId === tab.id ? " is-active" : ""
          }`}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
          {tab.badge != null ? <em>{tab.badge}</em> : null}
        </button>
      ))}
    </div>
  );
}

export function ComposerDockPrimary({
  label,
  onClick,
  disabled = false,
  leading = null,
}) {
  return (
    <div className="composer-dock-row">
      {leading}
      <button
        type="button"
        className="composer-dock-primary"
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    </div>
  );
}
