import { describe, expect, it } from "vitest";
import { getCurriculumJourney } from "./homeCurriculum";
import { getTodaysLessonPreview } from "./dailyLesson";
import { getSessionHistoryChange } from "./sessionHistory";

describe("course journey", () => {
  it("counts only distinct known sessions and keeps the first gap as the next session", () => {
    const journey = getCurriculumJourney({
      completedSessionIds: ["w1-s1", "w1-s1", "w1-s3", "unknown"],
    });
    expect(journey.completedCount).toBe(2);
    expect(journey.totalSessions).toBe(12);
    expect(journey.weeks[0].sessions.map((session) => session.status)).toEqual([
      "complete", "next", "complete",
    ]);
  });

  it("leaves no next step when all sessions are completed", () => {
    const empty = getCurriculumJourney({ completedSessionIds: [] });
    const completedSessionIds = empty.weeks.flatMap((week) => week.sessions.map((session) => session.id));
    const done = getCurriculumJourney({ completedSessionIds });
    expect(done.completedCount).toBe(12);
    expect(done.weeks.flatMap((week) => week.sessions).every((session) => session.status === "complete")).toBe(true);
    expect(getTodaysLessonPreview({ completedSessionIds }).kind).toBe("graduated");
  });

  it("includes warmup and between-round rests in the first lesson time", () => {
    const preview = getTodaysLessonPreview({ completedSessionIds: [] });
    expect(preview.session.id).toBe("w1-s1");
    // 5 minutes warmup + 3 x 2 minute rounds + 2 x 30 second rests.
    expect(preview.durationLabel).toBe("12분");
  });

  it("includes cooldown, without an extra rest after the last round", () => {
    const preview = getTodaysLessonPreview({ completedSessionIds: ["w1-s1", "w1-s2"] });
    expect(preview.session.id).toBe("w1-s3");
    expect(preview.durationLabel).toBe("13분 30초");
  });

  it("previews the user's saved session settings instead of the unadjusted lesson", () => {
    const preview = getTodaysLessonPreview({ completedSessionIds: [] }, {
      intensityId: "normal",
      sessionOverrides: { "w1-s1": { rounds: 2, workSeconds: 60, restSeconds: 15 } },
    });
    expect(preview.rounds).toBe(2);
    expect(preview.durationLabel).toBe("7분 15초");
  });
});

describe("saved session reward", () => {
  it("uses persisted minutes, including a partial session, without adding the session twice", () => {
    const logs = [
      { id: "partial", minutes: 2, rounds: 1 },
      { id: "running", minutes: 15, rounds: 0 },
      { id: "boxing", duration: 6, rounds: 3 },
    ];
    expect(getSessionHistoryChange(logs, "partial")).toEqual({
      addedMinutes: 2, previousMinutes: 21, totalMinutes: 23, totalRecords: 3,
    });
    expect(logs).toHaveLength(3);
  });

  it("does not invent a reward without a matching saved record", () => {
    expect(getSessionHistoryChange([], "missing")).toBeNull();
    expect(getSessionHistoryChange([{ id: "one", minutes: 6 }], null)).toBeNull();
  });

  it("excludes developer records and treats malformed durations conservatively", () => {
    const logs = [
      { id: "dev-level-boost", minutes: 999 },
      { id: "old", minutes: "broken" },
      { id: "negative", minutes: -3 },
      { id: "one", minutes: 6 },
    ];
    expect(getSessionHistoryChange(logs, "one")).toEqual({
      addedMinutes: 6, previousMinutes: 0, totalMinutes: 6, totalRecords: 3,
    });
    expect(getSessionHistoryChange(logs, "dev-level-boost")).toBeNull();
  });
});
