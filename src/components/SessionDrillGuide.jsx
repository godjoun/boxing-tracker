import { buildSessionDrillGuide } from "../utils/curriculumTimerSync";

export default function SessionDrillGuide({ syncedDrills, totalRounds, workSeconds }) {
  const guide = buildSessionDrillGuide(syncedDrills, totalRounds, workSeconds);

  return (
    <div className="curriculum-drill-guide">
      <div className="curriculum-drill-guide-main">
        <span className="curriculum-drill-guide-label">이번 세션 드릴</span>
        <strong>{guide.title}</strong>
        <em>{guide.timing}</em>

        {guide.mode === "single" ? (
          guide.description ? <p>{guide.description}</p> : null
        ) : (
          <div className="curriculum-drill-guide-segments">
            {guide.segments.map((segment) => (
              <div className="curriculum-drill-guide-segment" key={segment.name}>
                {segment.roundLabel ? (
                  <span className="curriculum-drill-guide-round">{segment.roundLabel}</span>
                ) : null}
                <b>{segment.name}</b>
                {segment.description ? <p>{segment.description}</p> : null}
                {segment.combos.length > 0 ? (
                  <div className="curriculum-drill-guide-combos">
                    {segment.combos.map((combo) => (
                      <span className="curriculum-drill-combo" key={combo}>
                        {combo}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {guide.mode === "single" && guide.combos.length > 0 ? (
          <div className="curriculum-drill-guide-combos">
            {guide.combos.map((combo) => (
              <span className="curriculum-drill-combo" key={combo}>
                {combo}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {guide.prepNote ? (
        <p className="curriculum-drill-guide-footnote">
          <span>준비</span> {guide.prepNote}
        </p>
      ) : null}

      {guide.cooldownNote ? (
        <p className="curriculum-drill-guide-footnote">
          <span>마무리</span> {guide.cooldownNote}
        </p>
      ) : null}
    </div>
  );
}
