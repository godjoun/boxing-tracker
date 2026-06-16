import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";

const CUSTOM_EXERCISE_VALUE = "직접 입력";

const EXERCISE_OPTIONS = [
  "복싱",
  "쉐도우복싱",
  "샌드백",
  "미트 훈련",
  "줄넘기",
  "풋워크",
  "복근 운동",
  "스파링",
  "러닝",
  "기타",
  CUSTOM_EXERCISE_VALUE,
];

const DIFFICULTY_OPTIONS = [
  { id: "easy", label: "가볍게", description: "가볍게 움직인 날" },
  { id: "normal", label: "보통", description: "평소처럼 훈련한 날" },
  { id: "hard", label: "빡셈", description: "확실히 힘들었던 날" },
  { id: "crazy", label: "죽음", description: "오늘 좀 미쳤던 날" },
];

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function calculatePreviewScore(minutes, difficulty) {
  const multipliers = {
    easy: 0.8,
    normal: 1,
    hard: 1.2,
    crazy: 1.5,
  };

  const multiplier = multipliers[difficulty] || 1;
  return Math.round(Number(minutes || 0) * multiplier);
}

function getRounds(log) {
  return Number(
    log.rounds ||
      log.round ||
      log.totalRounds ||
      log.completedRounds ||
      0
  );
}

function getStatusColor(type) {
  if (type === "promote") return "#86efac";
  if (type === "safe") return "#7dd3fc";
  return "#fca5a5";
}

function getProgressPercent(weeklyScore, currentTier) {
  if (!currentTier?.promoteScore) return 100;
  const percent = (weeklyScore / currentTier.promoteScore) * 100;
  return Math.min(Math.round(percent), 100);
}

function getProgressText({ weeklyScore, currentTier, nextTier }) {
  if (!nextTier) return "현재 최고 티어입니다.";

  if (weeklyScore >= currentTier.promoteScore) {
    return `${nextTier.name} 승급 조건 달성!`;
  }

  if (weeklyScore < currentTier.keepScore) {
    return `티어 유지까지 ${currentTier.keepScore - weeklyScore}점 남음`;
  }

  return `${nextTier.name} 승급까지 ${
    currentTier.promoteScore - weeklyScore
  }점 남음`;
}

function createEmptyForm() {
  return {
    type: "복싱",
    customType: "",
    minutes: "",
    rounds: "",
    date: getTodayString(),
    difficulty: "normal",
    memo: "",
    publicComment: "",
  };
}

function getExerciseFormState(exerciseName) {
  if (EXERCISE_OPTIONS.includes(exerciseName)) {
    return {
      type: exerciseName,
      customType: "",
    };
  }

  return {
    type: CUSTOM_EXERCISE_VALUE,
    customType: exerciseName || "",
  };
}

function getFinalExerciseName(formData) {
  if (formData.type === CUSTOM_EXERCISE_VALUE) {
    return formData.customType.trim();
  }

  return formData.type;
}

function OptionButton({ isActive, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: isActive ? "#ef4444" : "#050505",
        color: isActive ? "#ffffff" : "#ffffff",
        border: isActive ? "1px solid #ef4444" : "1px solid #52525b",
        borderRadius: "16px",
        padding: "14px",
        textAlign: "left",
        cursor: "pointer",
        minHeight: "86px",
      }}
    >
      <div style={styles.rowBetween}>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 900 }}>
          {title}
        </p>

        {isActive && <span style={styles.selectedBadge}>선택됨</span>}
      </div>

      <p
        style={{
          margin: "8px 0 0",
          fontSize: "12px",
          lineHeight: 1.5,
          fontWeight: 700,
          color: isActive ? "#ffe4e6" : "#d4d4d8",
        }}
      >
        {description}
      </p>
    </button>
  );
}

export default function LogPage() {
  const {
    logs,
    weeklyLogs,
    addLog,
    updateLog,
    deleteLog,
    resetAllLogs,
    weeklyScore,
    currentTier,
    nextTier,
    tierStatus,
    dailyScoreLimit,
    seasonInfo,
  } = useTraining();

  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [reward, setReward] = useState(null);

  const safeWeeklyLogs = Array.isArray(weeklyLogs) ? weeklyLogs : logs;

  const previewScore = calculatePreviewScore(form.minutes, form.difficulty);
  const progressPercent = getProgressPercent(weeklyScore, currentTier);
  const progressText = getProgressText({
    weeklyScore,
    currentTier,
    nextTier,
  });

  const weeklySummary = useMemo(() => {
    const workoutCount = safeWeeklyLogs.length;

    const totalMinutes = safeWeeklyLogs.reduce((total, log) => {
      return total + Number(log.minutes || log.duration || 0);
    }, 0);

    const totalRounds = safeWeeklyLogs.reduce((total, log) => {
      return total + getRounds(log);
    }, 0);

    return {
      workoutCount,
      totalMinutes,
      totalRounds,
    };
  }, [safeWeeklyLogs]);

  function updateFormField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateEditField(field, value) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleTypeChange(value) {
    setForm((prev) => ({
      ...prev,
      type: value,
      customType: value === CUSTOM_EXERCISE_VALUE ? prev.customType : "",
    }));
  }

  function handleEditTypeChange(value) {
    setEditForm((prev) => ({
      ...prev,
      type: value,
      customType: value === CUSTOM_EXERCISE_VALUE ? prev.customType : "",
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const finalExerciseName = getFinalExerciseName(form);

    if (!finalExerciseName) {
      alert("운동 종류를 입력해줘!");
      return;
    }

    if (!form.minutes || Number(form.minutes) <= 0) {
      alert("운동 시간을 입력해줘!");
      return;
    }

    const addedScore = calculatePreviewScore(form.minutes, form.difficulty);

    addLog({
      type: finalExerciseName,
      minutes: Number(form.minutes),
      duration: Number(form.minutes),
      rounds: Number(form.rounds || 0),
      totalRounds: Number(form.rounds || 0),
      completedRounds: Number(form.rounds || 0),
      date: form.date || getTodayString(),
      difficulty: form.difficulty,
      memo: form.memo,
      publicComment: form.publicComment,
      source: "manual",
    });

    setReward({
      title: `+${addedScore}점 획득!`,
      message:
        form.publicComment ||
        "훈련 기록이 추가됐어. 이제 네 프로필에 성장 로그가 쌓였다.",
    });

    setForm(createEmptyForm());
  }

  function handleStartEdit(log) {
    setEditingId(log.id);

    const exerciseState = getExerciseFormState(log.type || "복싱");

    setEditForm({
      type: exerciseState.type,
      customType: exerciseState.customType,
      minutes: String(log.minutes || log.duration || ""),
      rounds: String(getRounds(log) || ""),
      date: log.date || getTodayString(),
      difficulty: log.difficulty || "normal",
      memo: log.memo || "",
      publicComment: log.publicComment || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyForm());
  }

  function handleSaveEdit(logId) {
    const finalExerciseName = getFinalExerciseName(editForm);

    if (!finalExerciseName) {
      alert("운동 종류를 입력해줘!");
      return;
    }

    if (!editForm.minutes || Number(editForm.minutes) <= 0) {
      alert("운동 시간을 입력해줘!");
      return;
    }

    updateLog(logId, {
      type: finalExerciseName,
      minutes: Number(editForm.minutes),
      duration: Number(editForm.minutes),
      rounds: Number(editForm.rounds || 0),
      totalRounds: Number(editForm.rounds || 0),
      completedRounds: Number(editForm.rounds || 0),
      date: editForm.date || getTodayString(),
      difficulty: editForm.difficulty,
      memo: editForm.memo,
      publicComment: editForm.publicComment,
    });

    setReward({
      title: "기록 수정 완료",
      message: "공개용 성장 로그가 더 보기 좋게 정리됐어.",
    });

    handleCancelEdit();
  }

  function handleDeleteLog(logId) {
    const ok = window.confirm("이 운동 기록을 삭제할까요?");
    if (!ok) return;

    deleteLog(logId);
    setReward(null);
  }

  function handleResetAllLogs() {
    const ok = window.confirm("모든 운동 기록을 삭제할까요?");
    if (!ok) return;

    resetAllLogs();
    setReward(null);
    setEditingId(null);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.headerSmall}>TRAINING LOG</p>

          <h1 style={styles.title}>
            훈련 기록을
            <br />
            성장 로그로 남기자.
          </h1>

          <p style={styles.subtitle}>
            타이머로 저장된 기록은 자동 기록으로 남고, 직접 추가한 기록은 수동
            기록으로 표시돼. 공개용 코멘트를 적으면 남에게 보여주기 좋은
            파이터 로그가 된다.
          </p>
        </header>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div>
              <p style={styles.cardTitle}>이번 주 시즌</p>
              <p style={styles.cardMainText}>
                {seasonInfo?.startText || "이번 주"} -{" "}
                {seasonInfo?.endText || "시즌"}
              </p>
            </div>

            <span style={styles.redBadge}>
              {seasonInfo?.daysLeft === 0
                ? "오늘 종료"
                : `${seasonInfo?.daysLeft ?? 0}일 남음`}
            </span>
          </div>

          <div style={{ ...styles.blackBox, marginTop: "16px" }}>
            <div style={styles.rowBetween}>
              <p style={{ margin: 0, fontWeight: 900 }}>이번 주 점수</p>
              <p style={{ margin: 0, color: "#f87171", fontWeight: 900 }}>
                {weeklyScore}점
              </p>
            </div>

            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressPercent}%`,
                }}
              />
            </div>

            <p style={styles.progressText}>{progressText}</p>
          </div>

          <div style={{ ...styles.grid3, marginTop: "12px" }}>
            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>훈련 횟수</p>
              <p style={styles.summaryNumber}>
                {weeklySummary.workoutCount}
              </p>
            </div>

            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>운동 시간</p>
              <p style={styles.summaryNumber}>
                {weeklySummary.totalMinutes}
              </p>
            </div>

            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>라운드</p>
              <p style={styles.summaryNumber}>
                {weeklySummary.totalRounds}
              </p>
            </div>
          </div>

          <p
            style={{
              margin: "12px 0 0",
              color: getStatusColor(tierStatus.type),
              fontSize: "13px",
              fontWeight: 900,
              lineHeight: 1.5,
            }}
          >
            {tierStatus.title} · {tierStatus.message}
          </p>
        </section>

        {reward && (
          <section style={styles.rewardCard}>
            <p style={styles.rewardTitle}>{reward.title}</p>
            <p style={styles.rewardMessage}>{reward.message}</p>
          </section>
        )}

        <section style={styles.card}>
          <p style={styles.headerSmall}>MANUAL LOG</p>

          <h2 style={styles.sectionTitle}>훈련 직접 작성</h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>운동 종류</label>

              <select
                value={form.type}
                onChange={(event) => handleTypeChange(event.target.value)}
                style={styles.input}
              >
                {EXERCISE_OPTIONS.map((exercise) => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                ))}
              </select>
            </div>

            {form.type === CUSTOM_EXERCISE_VALUE && (
              <div style={styles.formGroup}>
                <label style={styles.label}>운동 이름 직접 작성</label>

                <input
                  value={form.customType}
                  onChange={(event) =>
                    updateFormField("customType", event.target.value)
                  }
                  placeholder="예: 샌드백 집중 훈련"
                  style={styles.input}
                />

                <p style={styles.inputHint}>
                  카드와 기록에 이 이름으로 표시돼.
                </p>
              </div>
            )}

            <div style={styles.grid2}>
              <div style={styles.formGroup}>
                <label style={styles.label}>운동 시간 / 분</label>

                <input
                  type="number"
                  min="1"
                  value={form.minutes}
                  onChange={(event) =>
                    updateFormField("minutes", event.target.value)
                  }
                  placeholder="예: 15"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>라운드 수</label>

                <input
                  type="number"
                  min="0"
                  value={form.rounds}
                  onChange={(event) =>
                    updateFormField("rounds", event.target.value)
                  }
                  placeholder="예: 5"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>날짜</label>

              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  updateFormField("date", event.target.value)
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>운동 강도</label>

              <div style={styles.grid2}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.id}
                    isActive={form.difficulty === option.id}
                    title={option.label}
                    description={option.description}
                    onClick={() => updateFormField("difficulty", option.id)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>내 메모</label>

              <input
                value={form.memo}
                onChange={(event) =>
                  updateFormField("memo", event.target.value)
                }
                placeholder="예: 오늘 샌드백 위주로 했다"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>공개용 자랑 코멘트</label>

              <textarea
                value={form.publicComment}
                onChange={(event) =>
                  updateFormField("publicComment", event.target.value)
                }
                placeholder="예: 오늘 첫 5라운드 완주. 마지막 라운드는 진짜 힘들었지만 버텼다."
                style={styles.textarea}
              />
            </div>

            <div style={{ ...styles.blackBox, marginBottom: "16px" }}>
              <p style={styles.smallMuted}>예상 획득 점수</p>

              <p style={styles.previewScore}>+{previewScore}점</p>

              <p style={styles.smallMuted}>
                분 단위로 계산 · 하루 최대 {dailyScoreLimit}점까지 반영
              </p>
            </div>

            <button type="submit" style={styles.submitButton}>
              성장 로그 등록하기
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div>
              <p style={styles.headerSmall}>RECENT LOG</p>
              <h2 style={styles.sectionTitle}>최근 기록</h2>
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllLogs}
                style={styles.deleteButton}
              >
                전체 초기화
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p style={{ ...styles.blackBox, marginTop: "16px" }}>
              아직 기록이 없어. 오늘 훈련 하나만 등록해보자.
            </p>
          ) : (
            <div style={{ marginTop: "16px" }}>
              {logs.slice(0, 12).map((log) => {
                const isEditing = editingId === log.id;
                const rounds = getRounds(log);

                return (
                  <div key={log.id} style={styles.logItem}>
                    {!isEditing ? (
                      <>
                        <div style={styles.rowBetween}>
                          <div>
                            <div style={styles.badgeRow}>
                              <span style={styles.sourceBadge}>
                                {log.sourceLabel ||
                                  (log.source === "timer"
                                    ? "자동 기록"
                                    : "수동 기록")}
                              </span>

                              {log.isEdited && (
                                <span style={styles.editedBadge}>수정됨</span>
                              )}
                            </div>

                            <p style={styles.logTitle}>{log.type}</p>

                            <p style={styles.logMeta}>
                              {log.minutes || log.duration}분 · {rounds}R ·{" "}
                              {log.difficultyLabel || "보통"} · {log.date}
                            </p>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <p style={styles.logScore}>+{log.score}점</p>

                            <div style={styles.actionRow}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                style={styles.smallButton}
                              >
                                수정
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log.id)}
                                style={styles.deleteButton}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>

                        {log.publicComment && (
                          <div style={styles.publicCommentBox}>
                            <span style={styles.commentLabel}>공개 코멘트</span>
                            <p style={styles.publicComment}>
                              {log.publicComment}
                            </p>
                          </div>
                        )}

                        {log.memo && (
                          <div style={styles.memoBox}>
                            <span style={styles.commentLabel}>내 메모</span>
                            <p style={styles.memoText}>{log.memo}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <p style={styles.editTitle}>기록 수정</p>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>운동 종류</label>

                          <select
                            value={editForm.type}
                            onChange={(event) =>
                              handleEditTypeChange(event.target.value)
                            }
                            style={styles.input}
                          >
                            {EXERCISE_OPTIONS.map((exercise) => (
                              <option key={exercise} value={exercise}>
                                {exercise}
                              </option>
                            ))}
                          </select>
                        </div>

                        {editForm.type === CUSTOM_EXERCISE_VALUE && (
                          <div style={styles.formGroup}>
                            <label style={styles.label}>
                              운동 이름 직접 작성
                            </label>

                            <input
                              value={editForm.customType}
                              onChange={(event) =>
                                updateEditField(
                                  "customType",
                                  event.target.value
                                )
                              }
                              placeholder="예: 샌드백 집중 훈련"
                              style={styles.input}
                            />

                            <p style={styles.inputHint}>
                              수정 저장하면 이 이름으로 기록돼.
                            </p>
                          </div>
                        )}

                        <div style={styles.grid2}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>운동 시간 / 분</label>

                            <input
                              type="number"
                              min="1"
                              value={editForm.minutes}
                              onChange={(event) =>
                                updateEditField("minutes", event.target.value)
                              }
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>라운드 수</label>

                            <input
                              type="number"
                              min="0"
                              value={editForm.rounds}
                              onChange={(event) =>
                                updateEditField("rounds", event.target.value)
                              }
                              style={styles.input}
                            />
                          </div>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>날짜</label>

                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(event) =>
                              updateEditField("date", event.target.value)
                            }
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>운동 강도</label>

                          <div style={styles.grid2}>
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <OptionButton
                                key={option.id}
                                isActive={editForm.difficulty === option.id}
                                title={option.label}
                                description={option.description}
                                onClick={() =>
                                  updateEditField("difficulty", option.id)
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>내 메모</label>

                          <input
                            value={editForm.memo}
                            onChange={(event) =>
                              updateEditField("memo", event.target.value)
                            }
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            공개용 자랑 코멘트
                          </label>

                          <textarea
                            value={editForm.publicComment}
                            onChange={(event) =>
                              updateEditField(
                                "publicComment",
                                event.target.value
                              )
                            }
                            style={styles.textarea}
                          />
                        </div>

                        <div style={styles.editButtonRow}>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(log.id)}
                            style={styles.submitButton}
                          >
                            수정 저장
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={styles.cancelButton}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#050505",
    color: "#ffffff",
    padding: "24px 16px 110px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "720px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "24px",
  },

  headerSmall: {
    color: "#f87171",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    margin: "0 0 8px",
  },

  title: {
    fontSize: "32px",
    lineHeight: 1.2,
    fontWeight: 900,
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.04em",
  },

  subtitle: {
    marginTop: "12px",
    color: "#d4d4d8",
    fontSize: "14px",
    lineHeight: 1.65,
  },

  card: {
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "20px",
  },

  rewardCard: {
    backgroundColor: "#451a1a",
    border: "1px solid #ef4444",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "20px",
  },

  rewardTitle: {
    margin: 0,
    color: "#fca5a5",
    fontSize: "18px",
    fontWeight: 900,
  },

  rewardMessage: {
    margin: "8px 0 0",
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  cardTitle: {
    fontSize: "14px",
    color: "#e4e4e7",
    fontWeight: 800,
    margin: "0 0 8px",
  },

  cardMainText: {
    margin: 0,
    fontWeight: 900,
    color: "#ffffff",
  },

  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  blackBox: {
    backgroundColor: "#050505",
    border: "1px solid #27272a",
    borderRadius: "18px",
    padding: "14px",
    color: "#ffffff",
  },

  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  muted: {
    color: "#d4d4d8",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  smallMuted: {
    color: "#a1a1aa",
    fontSize: "12px",
    fontWeight: 700,
    margin: 0,
  },

  redBadge: {
    display: "inline-block",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  selectedBadge: {
    backgroundColor: "#ffffff",
    color: "#111111",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 900,
  },

  progressTrack: {
    height: "12px",
    backgroundColor: "#3f3f46",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "10px",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#ef4444",
  },

  progressText: {
    margin: "12px 0 0",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
  },

  summaryNumber: {
    margin: "6px 0 0",
    fontSize: "22px",
    fontWeight: 900,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
  },

  inputHint: {
    margin: "8px 0 0",
    color: "#a1a1aa",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.5,
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.5,
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  formGroup: {
    marginBottom: "16px",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },

  submitButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
  },

  cancelButton: {
    width: "100%",
    backgroundColor: "#27272a",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
  },

  deleteButton: {
    backgroundColor: "#27272a",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  smallButton: {
    backgroundColor: "#ffffff",
    color: "#111111",
    border: "none",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  previewScore: {
    margin: "6px 0",
    fontSize: "28px",
    fontWeight: 900,
    color: "#f87171",
  },

  logItem: {
    backgroundColor: "#050505",
    border: "1px solid #27272a",
    borderRadius: "20px",
    padding: "16px",
    color: "#ffffff",
    marginBottom: "12px",
  },

  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },

  sourceBadge: {
    backgroundColor: "#1f2937",
    color: "#dbeafe",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: 900,
  },

  editedBadge: {
    backgroundColor: "#451a1a",
    color: "#fca5a5",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: 900,
  },

  logTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 900,
  },

  logMeta: {
    margin: "7px 0 0",
    color: "#d4d4d8",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  logScore: {
    margin: "0 0 8px",
    color: "#f87171",
    fontWeight: 900,
  },

  actionRow: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
  },

  publicCommentBox: {
    marginTop: "14px",
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "16px",
    padding: "13px",
  },

  memoBox: {
    marginTop: "10px",
    backgroundColor: "#111111",
    border: "1px solid #27272a",
    borderRadius: "16px",
    padding: "13px",
  },

  commentLabel: {
    display: "block",
    color: "#f87171",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },

  publicComment: {
    margin: 0,
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 800,
  },

  memoText: {
    margin: 0,
    color: "#d4d4d8",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  editTitle: {
    margin: "0 0 14px",
    color: "#f87171",
    fontSize: "16px",
    fontWeight: 900,
  },

  editButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
};