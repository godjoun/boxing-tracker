import { getCurriculumJourney } from "../utils/homeCurriculum";
import "./CourseJourney.css";

export default function CourseJourney({
  progress,
  onSelectSession,
  completedSessionId,
}) {
  const journey = getCurriculumJourney(progress);
  const Step = onSelectSession ? "button" : "span";
  const progressPercent = Math.round(
    (journey.completedCount / journey.totalSessions) * 100
  );

  return (
    <section
      className={`course-journey${onSelectSession ? " is-interactive" : ""}`}
      aria-label="4주 코스 진행 상황"
    >
      <div className="course-journey-heading">
        <strong>4주 코스</strong>
        <span>
          {journey.completedCount} / {journey.totalSessions}세션 ·{" "}
          {progressPercent}%
        </span>
      </div>
      <div className="course-journey-progress" aria-hidden="true">
        <i style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="course-journey-weeks">
        {journey.weeks.map((week) => {
          const completedInWeek = week.sessions.filter(
            (session) => session.status === "complete"
          ).length;
          const isActive = week.sessions.some(
            (session) => session.status === "next"
          );
          return (
            <div
              className={`course-journey-week${isActive ? " is-active" : ""}`}
              key={week.id}
            >
              <span className="course-journey-week-label">
                <strong>{week.label}</strong>
                <em>
                  {completedInWeek}/{week.sessions.length}
                </em>
              </span>
              <div className="course-journey-steps">
                {week.sessions.map((session) => {
                  const status =
                    session.status === "complete"
                      ? "완료"
                      : session.status === "next"
                        ? "다음 훈련"
                        : "예정";
                  const label = `${session.code} ${session.title} · ${status}`;
                  return (
                    <Step
                      key={session.id}
                      type={onSelectSession ? "button" : undefined}
                      className={`course-journey-step is-${session.status}${
                        completedSessionId === session.id &&
                        session.status === "complete"
                          ? " is-just-completed"
                          : ""
                      }`}
                      onClick={
                        onSelectSession ? () => onSelectSession(session) : undefined
                      }
                      aria-label={label}
                      title={label}
                    >
                      {session.status === "complete"
                        ? "✓"
                        : session.code.replace("DAY ", "")}
                    </Step>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
