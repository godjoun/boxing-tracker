import MenuIcon from "../MenuIcon";

export default function TrainingSessionSettings({
  boxingKindId,
  boxingKinds = [],
  categories = [],
  categoryId,
  roundPresetId,
  roundPresets = [],
  roundSummary,
  runningCustomDraft,
  runningGoalMinutes,
  runningGoalPresets = [],
  settingsOpen,
  onApplyRunningGoalMinutes,
  onCommitRunningCustomMinutes,
  onOpenCustomRoundSetup,
  onRunningCustomDraftChange,
  onSelectBoxingKind,
  onSelectCategory,
  onSelectRoundPreset,
  onToggleSettings,
}) {
  return (
    <details className="training-detail-panel">
      <summary className="training-detail-summary">
        <span>세부 조정</span>
        <strong>
          {categoryId === "running"
            ? `러닝 · ${runningGoalMinutes}분`
            : roundSummary}
        </strong>
      </summary>

      <div className="training-detail-body">
        <section className="training-mode-section" aria-label="훈련 종류">
          <div className="training-mode-grid">
            {categories.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`training-mode-card${selected ? " is-selected" : ""}`}
                  onClick={() => onSelectCategory?.(category.id)}
                >
                  <span className="training-mode-card-icon" aria-hidden="true">
                    <MenuIcon name={category.icon} size={16} />
                  </span>
                  <span className="training-mode-card-copy">
                    <strong>{category.title}</strong>
                    <small>{category.detail}</small>
                  </span>
                  <span
                    className={`training-mode-card-check${selected ? " is-on" : ""}`}
                    aria-hidden="true"
                  >
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {categoryId === "boxing" ? (
          <section className="training-boxing-setup" aria-label="복싱 훈련 설정">
            <div className="training-kind-row">
              {boxingKinds.map((kind) => {
                const selected = boxingKindId === kind.id;
                return (
                  <button
                    key={kind.id}
                    type="button"
                    className={`training-kind-chip${selected ? " is-selected" : ""}`}
                    onClick={() => onSelectBoxingKind?.(kind.id)}
                  >
                    {kind.title}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={`training-round-row${settingsOpen ? " is-open" : ""}`}
              aria-expanded={settingsOpen}
              onClick={onToggleSettings}
            >
              <span>
                <small>현재 설정</small>
                <strong>{roundSummary}</strong>
              </span>
              <em>{settingsOpen ? "접기" : "변경"}</em>
            </button>

            {settingsOpen ? (
              <div
                className="training-round-picker"
                role="group"
                aria-label="라운드 설정"
              >
                <div className="training-round-chip-row">
                  {roundPresets.map((preset) => {
                    const selected = roundPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`training-round-chip${selected ? " is-selected" : ""}`}
                        onClick={() => onSelectRoundPreset?.(preset.id)}
                      >
                        {preset.rounds}R
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="training-round-option training-round-option-custom"
                  onClick={onOpenCustomRoundSetup}
                >
                  <strong>직접 설정</strong>
                  <small>라운드 · 운동 · 휴식 직접 조절</small>
                  <span>›</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {categoryId === "running" ? (
          <section className="training-boxing-setup" aria-label="러닝 시간 목표">
            <button
              type="button"
              className={`training-round-row${settingsOpen ? " is-open" : ""}`}
              aria-expanded={settingsOpen}
              onClick={onToggleSettings}
            >
              <span>
                <small>현재 목표</small>
                <strong>{runningGoalMinutes}분</strong>
              </span>
              <em>{settingsOpen ? "접기" : "변경"}</em>
            </button>

            {settingsOpen ? (
              <div
                className="training-round-picker"
                role="group"
                aria-label="러닝 시간"
              >
                <div className="training-round-chip-row">
                  {runningGoalPresets.map((minutes) => {
                    const selected =
                      runningCustomDraft === "" && runningGoalMinutes === minutes;
                    return (
                      <button
                        key={minutes}
                        type="button"
                        className={`training-round-chip${selected ? " is-selected" : ""}`}
                        onClick={() => onApplyRunningGoalMinutes?.(minutes)}
                      >
                        {minutes}분
                      </button>
                    );
                  })}
                </div>
                <label className="training-running-custom">
                  <span>직접 설정</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    enterKeyHint="done"
                    value={
                      runningCustomDraft === ""
                        ? runningGoalPresets.includes(runningGoalMinutes)
                          ? ""
                          : String(runningGoalMinutes)
                        : runningCustomDraft
                    }
                    placeholder="분"
                    onChange={(event) =>
                      onRunningCustomDraftChange?.(event.target.value)
                    }
                    onBlur={onCommitRunningCustomMinutes}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    aria-label="러닝 목표 분"
                  />
                </label>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </details>
  );
}
