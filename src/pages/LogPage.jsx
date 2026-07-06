import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { getCompletionDelta, getFighterProgress } from "../utils/fighterProgress";
import {
  SPARRING_UNLOCK_LEVEL,
  isSparringUnlocked,
} from "../utils/featureUnlocks";
import { calculateLogScore, CONDITION_OPTIONS } from "../utils/trainingStats";
import "./LogPage.css";

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

function calculatePreviewScore(minutes, difficulty, rounds = 0, type = "") {
  return calculateLogScore({
    minutes,
    difficulty,
    rounds,
    type,
  });
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

function createEmptyForm() {
  return {
    type: "복싱",
    customType: "",
    minutes: "",
    rounds: "",
    date: getTodayString(),
    difficulty: "normal",
    condition: "normal",
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
      className={`log-option${isActive ? " is-active" : ""}`}
    >
      <p className="log-option-title">{title}</p>
      <p className="log-option-desc">{description}</p>
    </button>
  );
}

export default function LogPage({ onGoProfileCardMaker, onGoProfile, fighterLevel = 1 } = {}) {
  const {
    logs,
    weeklyLogs,
    addLog,
    updateLog,
    deleteLog,
    resetAllLogs,
    weeklyScore,
    dailyScoreLimit,
    seasonInfo,
  } = useTraining();

  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [reward, setReward] = useState(null);

  const safeWeeklyLogs = Array.isArray(weeklyLogs) ? weeklyLogs : logs;
  const fighter = useMemo(() => getFighterProgress(logs), [logs]);

  const previewScore = calculatePreviewScore(
    form.minutes,
    form.difficulty,
    form.rounds,
    form.type === CUSTOM_EXERCISE_VALUE ? form.customType : form.type
  );
  const progressPercent = fighter.progressPercent;
  const progressText = fighter.isMaxLevel
    ? "최대 레벨에 도달했습니다"
    : `다음 레벨까지 ${fighter.xpToNextLevel} EXP`;

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

    const savedLog = addLog({
      type: finalExerciseName,
      minutes: Number(form.minutes),
      duration: Number(form.minutes),
      rounds: Number(form.rounds || 0),
      totalRounds: Number(form.rounds || 0),
      completedRounds: Number(form.rounds || 0),
      date: form.date || getTodayString(),
      difficulty: form.difficulty,
      condition: form.condition,
      memo: form.memo,
      publicComment: form.publicComment,
      source: "manual",
    });

    setReward({
      type: "growth",
      delta: getCompletionDelta(logs, savedLog),
      logId: savedLog.id,
      minutes: Number(form.minutes),
      rounds: Number(form.rounds || 0),
      message: form.publicComment.trim() || null,
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
      condition: log.condition || "normal",
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
      condition: editForm.condition,
      memo: editForm.memo,
      publicComment: editForm.publicComment,
    });

    setReward({
      type: "edit",
      title: "기록 수정 완료",
      message: "변경 내용이 저장됐습니다.",
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

  function handleOpenProfile() {
    if (typeof onGoProfile === "function") {
      onGoProfile();
    }
  }

  function handleOpenCardFromReward(logId) {
    if (logId) {
      localStorage.setItem("fitness-league-card-maker-log-id", logId);
    }

    const goCardMaker = onGoProfileCardMaker || onGoProfile;

    if (typeof goCardMaker === "function") {
      goCardMaker();
      return;
    }

    alert("프로필 탭의 카드 만들기로 이동해 주세요.");
  }

  function handleMakeCard(logId) {
    handleOpenCardFromReward(logId);
  }

  return (
    <main className="log-page">
      <div className="log-container">
        <header className="log-hero">
          <h1 className="log-title">훈련 기록</h1>
          <p className="log-subtitle">
            타이머로 저장된 기록은 자동으로 남고, 여기서 직접 추가할 수 있어요.
          </p>
        </header>

        <section className="log-card log-season-card">
          <div className="log-season-head">
            <div>
              <p className="log-season-label">성장 현황</p>
              <p className="log-season-range">
                {fighter.levelLabel} · {fighter.fighterTitle}
              </p>
            </div>

            <span className="log-season-badge">{fighter.fighterTitleEn}</span>
          </div>

          <div className="log-score-panel">
            <div className="log-score-row">
              <span>레벨 경험치</span>
              <span className="log-score-value">
                {fighter.isMaxLevel
                  ? "MAX LEVEL"
                  : `${fighter.currentLevelExp} / ${fighter.nextLevelExp} EXP`}
              </span>
            </div>

            <div className="log-progress-track">
              <div
                className="log-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="log-progress-text">{progressText}</p>
          </div>

          <div className="log-score-panel">
            <div className="log-score-row">
              <span>이번 주 점수</span>
              <span className="log-score-value">{weeklyScore}점</span>
            </div>
            <p className="log-progress-text">
              {seasonInfo?.startText || "이번 주"} – {seasonInfo?.endText || "주간"}{" "}
              · D-{seasonInfo?.daysLeft ?? 0}
            </p>
          </div>

          <div className="log-stat-grid">
            <div className="log-stat-box">
              <p className="log-stat-label">훈련 횟수</p>
              <p className="log-stat-number">{weeklySummary.workoutCount}</p>
            </div>

            <div className="log-stat-box">
              <p className="log-stat-label">운동 시간</p>
              <p className="log-stat-number">{weeklySummary.totalMinutes}</p>
            </div>

            <div className="log-stat-box">
              <p className="log-stat-label">라운드</p>
              <p className="log-stat-number">{weeklySummary.totalRounds}</p>
            </div>
          </div>

          <p className="log-tier-status">
            누적 {fighter.totalRounds}R · 총 EXP {fighter.totalExp}
          </p>
        </section>

        {reward?.type === "growth" && reward.delta ? (
          <section className="log-growth-reward" aria-live="polite">
            <p className="log-growth-kicker">주인공 스펙 상승</p>

            {reward.delta.didLevelUp ? (
              <span className="log-growth-levelup">LEVEL UP</span>
            ) : null}

            <div className="log-growth-grid">
              <div className="log-growth-stat">
                <span>기록 라운드</span>
                <strong>{reward.rounds}R</strong>
              </div>
              <div className="log-growth-stat">
                <span>이번 주</span>
                <strong>{reward.delta.weeklyRounds}R</strong>
                {reward.delta.weeklyRoundsAdded > 0 ? (
                  <em>+{reward.delta.weeklyRoundsAdded}R</em>
                ) : null}
              </div>
              <div className="log-growth-stat">
                <span>훈련 시간</span>
                <strong>{reward.minutes}분</strong>
              </div>
              <div className="log-growth-stat">
                <span>획득 EXP</span>
                <strong className="log-growth-exp">
                  +{reward.delta.gainedExp}
                </strong>
              </div>
            </div>

            <div className="log-growth-level-head">
              <strong>{reward.delta.levelLabel}</strong>
              <span>
                {reward.delta.isMaxLevel
                  ? "MAX LEVEL"
                  : `${reward.delta.currentLevelExp} / ${reward.delta.nextLevelExp} EXP`}
              </span>
            </div>
            <div className="log-growth-level-track">
              <div
                style={{ width: `${reward.delta.currentLevelExp}%` }}
              />
            </div>
            <p className="log-growth-level-note">
              {reward.delta.isMaxLevel
                ? "최대 레벨에 도달했습니다"
                : `다음 레벨까지 ${reward.delta.expToNextLevel} EXP`}
            </p>

            {reward.delta.didLevelUp && reward.delta.newTitle ? (
              <div className="log-growth-unlocks">
                <span>NEW TITLE · 새 칭호</span>
                <p className="log-growth-title-ko">{reward.delta.newTitle.ko}</p>
                <p className="log-growth-title-en">{reward.delta.newTitle.en}</p>
                <small className="log-growth-title-flavor">
                  {reward.delta.newTitle.flavor}
                </small>
                {reward.delta.currentLevel === SPARRING_UNLOCK_LEVEL &&
                isSparringUnlocked(reward.delta.currentLevel) ? (
                  <p className="log-growth-title-extra">
                    스파링 상대찾기 이용 가능
                  </p>
                ) : null}
              </div>
            ) : null}

            {reward.message ? (
              <p className="log-growth-message">{reward.message}</p>
            ) : null}

            <div className="log-growth-actions">
              {typeof onGoProfile === "function" ? (
                <button
                  type="button"
                  className="log-growth-btn log-growth-btn-primary"
                  onClick={handleOpenProfile}
                >
                  명패 보기
                </button>
              ) : null}
              <button
                type="button"
                className="log-growth-btn"
                onClick={() => handleOpenCardFromReward(reward.logId)}
              >
                훈련 카드 만들기
              </button>
            </div>
          </section>
        ) : null}

        {reward?.type === "edit" ? (
          <section className="log-reward">
            <strong>{reward.title}</strong>
            <p>{reward.message}</p>
          </section>
        ) : null}

        <section className="log-card log-form-card">
          <div className="log-section-head">
            <h2>직접 작성</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="log-form-block">
              <p className="log-form-block-title">기본</p>

              <div className="log-field">
                <label className="log-label">운동 종류</label>
                <select
                  value={form.type}
                  onChange={(event) => handleTypeChange(event.target.value)}
                  className="log-input"
                >
                  {EXERCISE_OPTIONS.map((exercise) => (
                    <option key={exercise} value={exercise}>
                      {exercise}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === CUSTOM_EXERCISE_VALUE && (
                <div className="log-field">
                  <label className="log-label">운동 이름 직접 작성</label>
                  <input
                    value={form.customType}
                    onChange={(event) =>
                      updateFormField("customType", event.target.value)
                    }
                    placeholder="예: 샌드백 집중 훈련"
                    className="log-input"
                  />
                  <p className="log-hint">카드와 기록에 이 이름으로 표시돼요.</p>
                </div>
              )}

              <div className="log-grid-2">
                <div className="log-field">
                  <label className="log-label">운동 시간 (분)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minutes}
                    onChange={(event) =>
                      updateFormField("minutes", event.target.value)
                    }
                    placeholder="15"
                    className="log-input"
                  />
                </div>

                <div className="log-field">
                  <label className="log-label">라운드 (R)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.rounds}
                    onChange={(event) =>
                      updateFormField("rounds", event.target.value)
                    }
                    placeholder="5"
                    className="log-input"
                  />
                </div>
              </div>

              <div className="log-field">
                <label className="log-label">날짜</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    updateFormField("date", event.target.value)
                  }
                  className="log-input"
                />
              </div>
            </div>

            <div className="log-form-block">
              <p className="log-form-block-title">강도 · 컨디션</p>

              <div className="log-field">
                <label className="log-label">운동 강도</label>
                <div className="log-chip-grid">
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

              <div className="log-field">
                <label className="log-label">오늘 컨디션</label>
                <div className="log-chip-grid">
                  {CONDITION_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.id}
                      isActive={form.condition === option.id}
                      title={option.label}
                      description="훈련 당시 몸 상태"
                      onClick={() => updateFormField("condition", option.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="log-form-block">
              <p className="log-form-block-title">메모</p>

              <div className="log-field">
                <label className="log-label">내 메모</label>
                <input
                  value={form.memo}
                  onChange={(event) =>
                    updateFormField("memo", event.target.value)
                  }
                  placeholder="예: 오늘 샌드백 위주로 했다"
                  className="log-input"
                />
              </div>

              <div className="log-field">
                <label className="log-label">공개용 코멘트</label>
                <textarea
                  value={form.publicComment}
                  onChange={(event) =>
                    updateFormField("publicComment", event.target.value)
                  }
                  placeholder="예: 오늘 첫 5라운드 완주. 마지막 라운드는 진짜 힘들었지만 버텼다."
                  className="log-textarea"
                />
              </div>
            </div>

            <div className="log-preview">
              <div className="log-preview-copy">
                <p className="log-preview-label">예상 획득 점수</p>
                <p className="log-preview-note">
                  라운드 · 분 · 난이도 기준 · 하루 최대 {dailyScoreLimit}점
                </p>
              </div>
              <strong className="log-preview-score">+{previewScore}</strong>
            </div>

            <button type="submit" className="log-submit">
              기록 저장
            </button>
          </form>
        </section>

        <section className="log-card log-recent-card">
          <div className="log-recent-head">
            <h2>최근 기록</h2>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllLogs}
                className="log-reset-btn"
              >
                전체 초기화
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="log-empty">
              아직 기록이 없어요. 오늘 훈련 하나만 등록해 보세요.
            </p>
          ) : (
            <div className="log-list">
              {logs.slice(0, 12).map((log) => {
                const isEditing = editingId === log.id;
                const rounds = getRounds(log);

                return (
                  <div key={log.id} className="log-item">
                    {!isEditing ? (
                      <>
                        <div className="log-item-head">
                          <div>
                            <div className="log-badge-row">
                              <span className="log-source-badge">
                                {log.sourceLabel ||
                                  (log.source === "timer"
                                    ? "자동 기록"
                                    : "수동 기록")}
                              </span>

                              {log.isEdited && (
                                <span className="log-edited-badge">수정됨</span>
                              )}
                            </div>

                            <p className="log-item-type">{log.type}</p>

                            <p className="log-item-meta">
                              {log.minutes || log.duration}분 · {rounds}R ·{" "}
                              {log.difficultyLabel || "보통"} ·{" "}
                              {log.conditionLabel || "보통"} · {log.date}
                            </p>
                          </div>

                          <div>
                            <p className="log-item-score">+{log.score}점</p>

                            <div className="log-action-row">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                className="log-btn-sm log-btn-edit"
                              >
                                수정
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMakeCard(log.id)}
                                className="log-btn-sm log-btn-card"
                              >
                                카드
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log.id)}
                                className="log-btn-sm log-btn-delete"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>

                        {log.publicComment && (
                          <div className="log-quote-box">
                            <span className="log-quote-label">공개 코멘트</span>
                            <p className="log-quote-text">{log.publicComment}</p>
                          </div>
                        )}

                        {log.memo && (
                          <div className="log-quote-box is-memo">
                            <span className="log-quote-label">내 메모</span>
                            <p className="log-quote-text">{log.memo}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <p className="log-edit-head">기록 수정</p>

                        <div className="log-field">
                          <label className="log-label">운동 종류</label>
                          <select
                            value={editForm.type}
                            onChange={(event) =>
                              handleEditTypeChange(event.target.value)
                            }
                            className="log-input"
                          >
                            {EXERCISE_OPTIONS.map((exercise) => (
                              <option key={exercise} value={exercise}>
                                {exercise}
                              </option>
                            ))}
                          </select>
                        </div>

                        {editForm.type === CUSTOM_EXERCISE_VALUE && (
                          <div className="log-field">
                            <label className="log-label">
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
                              className="log-input"
                            />
                            <p className="log-hint">
                              저장하면 이 이름으로 기록돼요.
                            </p>
                          </div>
                        )}

                        <div className="log-grid-2">
                          <div className="log-field">
                            <label className="log-label">운동 시간 (분)</label>
                            <input
                              type="number"
                              min="1"
                              value={editForm.minutes}
                              onChange={(event) =>
                                updateEditField("minutes", event.target.value)
                              }
                              className="log-input"
                            />
                          </div>

                          <div className="log-field">
                            <label className="log-label">라운드 (R)</label>
                            <input
                              type="number"
                              min="0"
                              value={editForm.rounds}
                              onChange={(event) =>
                                updateEditField("rounds", event.target.value)
                              }
                              className="log-input"
                            />
                          </div>
                        </div>

                        <div className="log-field">
                          <label className="log-label">날짜</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(event) =>
                              updateEditField("date", event.target.value)
                            }
                            className="log-input"
                          />
                        </div>

                        <div className="log-field">
                          <label className="log-label">운동 강도</label>
                          <div className="log-chip-grid">
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

                        <div className="log-field">
                          <label className="log-label">오늘 컨디션</label>
                          <div className="log-chip-grid">
                            {CONDITION_OPTIONS.map((option) => (
                              <OptionButton
                                key={option.id}
                                isActive={editForm.condition === option.id}
                                title={option.label}
                                description="훈련 당시 몸 상태"
                                onClick={() =>
                                  updateEditField("condition", option.id)
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className="log-field">
                          <label className="log-label">내 메모</label>
                          <input
                            value={editForm.memo}
                            onChange={(event) =>
                              updateEditField("memo", event.target.value)
                            }
                            className="log-input"
                          />
                        </div>

                        <div className="log-field">
                          <label className="log-label">공개용 코멘트</label>
                          <textarea
                            value={editForm.publicComment}
                            onChange={(event) =>
                              updateEditField(
                                "publicComment",
                                event.target.value
                              )
                            }
                            className="log-textarea"
                          />
                        </div>

                        <div className="log-edit-actions">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(log.id)}
                            className="log-submit"
                          >
                            수정 저장
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="log-btn-cancel"
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