import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEventV0Date, getEventV0PublicEvent } from "../api/eventV0Api";
import {
  operatorAddParticipant,
  operatorCancelPairing,
  operatorChangeOpponent,
  operatorChangeOrder,
  operatorCompletePairing,
  operatorCreatePairing,
  operatorCreateSparringRequest,
  operatorLoadBoard,
  operatorUpdateParticipant,
  verifyEventV0OperatorSecret,
} from "../api/eventV0OperatorApi";
import {
  clearEventV0OperatorSecret,
  getEventV0OperatorSecret,
  isInvalidOperatorSecretError,
  setEventV0OperatorSecret,
} from "../utils/eventV0OperatorSession";
import { computeEventV0DisplayOrder } from "../utils/eventV0DisplayOrder";
import { groupEventV0WaitingByWeightBand } from "../utils/eventV0WeightBands";
import "./EventV0OperatorPage.css";

const EXPERIENCE_OPTIONS = [
  "초보 (6개월 미만)",
  "6개월~1년",
  "1~2년",
  "2~3년",
  "4년 이상",
];

function emptyForm() {
  return {
    displayName: "",
    gymName: "",
    weightKg: "",
    experience: "",
  };
}

function weightLabel(kg) {
  return kg == null || Number.isNaN(Number(kg)) ? "—" : `${kg}kg`;
}

function formatOperatorError(error) {
  if (isInvalidOperatorSecretError(error)) {
    return "운영자 키를 확인해주세요.";
  }
  return error?.message || "요청에 실패했습니다.";
}

/**
 * EVENT v0 operator mobile surface.
 * Secret stays in sessionStorage only — never URL.
 */
export default function EventV0OperatorPage({ eventId }) {
  const [event, setEvent] = useState(null);
  const [booting, setBooting] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("people"); // people | board
  const [participants, setParticipants] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [pairings, setPairings] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [actionPairingId, setActionPairingId] = useState(null);
  const [actionMode, setActionMode] = useState(null); // opponent | order
  const [replaceSideId, setReplaceSideId] = useState("");
  const [newOpponentId, setNewOpponentId] = useState("");
  const [swapTargetOrder, setSwapTargetOrder] = useState("");

  const participantMap = useMemo(() => {
    const map = new Map();
    for (const p of participants) map.set(p.id, p);
    return map;
  }, [participants]);

  const waitingIdSet = useMemo(
    () => new Set(waiting.map((w) => w.participantId)),
    [waiting]
  );

  const activePairings = useMemo(
    () =>
      pairings
        .filter((p) => p.status === "active")
        .slice()
        .sort((a, b) => a.orderNumber - b.orderNumber),
    [pairings]
  );

  /** participantId → field display order (skips cancelled) */
  const activeDisplayByParticipantId = useMemo(() => {
    const map = new Map();
    for (const pair of activePairings) {
      const display =
        pair.displayOrder ??
        computeEventV0DisplayOrder(pair.orderNumber, pairings);
      map.set(pair.participantAId, display);
      map.set(pair.participantBId, display);
    }
    return map;
  }, [activePairings, pairings]);

  /** true if participant is in an active pairing */
  const activePairedIdSet = useMemo(() => {
    const set = new Set();
    for (const pair of activePairings) {
      set.add(pair.participantAId);
      set.add(pair.participantBId);
    }
    return set;
  }, [activePairings]);

  /** Waiting only — 5kg bands, earliest request first within band */
  const waitingByWeightBand = useMemo(
    () => groupEventV0WaitingByWeightBand(waiting),
    [waiting]
  );

  const waitingQueueByParticipantId = useMemo(() => {
    const map = new Map();
    for (const group of waitingByWeightBand) {
      for (const item of group.items) {
        map.set(item.participantId, item.queueIndex);
      }
    }
    return map;
  }, [waitingByWeightBand]);

  /** Not currently waiting (paired or idle) — keep edit / requeue access */
  const nonWaitingParticipants = useMemo(
    () => participants.filter((p) => !waitingIdSet.has(p.id)),
    [participants, waitingIdSet]
  );

  const refreshBoard = useCallback(
    async (secret) => {
      const key = secret || getEventV0OperatorSecret(eventId);
      const board = await operatorLoadBoard(eventId, key);
      setParticipants(board.participants);
      setWaiting(board.waiting);
      setPairings(board.pairings);

      const waitingIds = new Set(board.waiting.map((w) => w.participantId));
      const pairedIds = new Set();
      for (const pair of board.pairings) {
        if (pair.status !== "active") continue;
        pairedIds.add(pair.participantAId);
        pairedIds.add(pair.participantBId);
      }
      // Drop selections that are no longer eligible for pairing.
      setSelectedIds((current) =>
        current.filter((id) => waitingIds.has(id) && !pairedIds.has(id))
      );

      return board;
    },
    [eventId]
  );

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setBooting(true);
      setError("");
      try {
        const pub = await getEventV0PublicEvent(eventId);
        if (cancelled) return;
        if (!pub) {
          setError("행사를 찾을 수 없습니다.");
          return;
        }
        setEvent(pub);

        const saved = getEventV0OperatorSecret(eventId);
        if (saved) {
          try {
            await refreshBoard(saved);
            if (!cancelled) setUnlocked(true);
          } catch (err) {
            clearEventV0OperatorSecret(eventId);
            if (!cancelled && isInvalidOperatorSecretError(err)) {
              setError("운영자 키를 확인해주세요.");
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(formatOperatorError(err));
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshBoard]);

  async function handleUnlock(submitEvent) {
    submitEvent.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await verifyEventV0OperatorSecret(eventId, secretInput);
      setEventV0OperatorSecret(eventId, secretInput);
      await refreshBoard(secretInput.trim());
      setSecretInput("");
      setUnlocked(true);
    } catch (err) {
      clearEventV0OperatorSecret(eventId);
      setError(formatOperatorError(err));
    } finally {
      setBusy(false);
    }
  }

  function handleLock() {
    clearEventV0OperatorSecret(eventId);
    setUnlocked(false);
    setSelectedIds([]);
    setActionPairingId(null);
    setActionMode(null);
    setNotice("");
    setError("");
  }

  async function runAction(fn, successMessage) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
      await refreshBoard();
      if (successMessage) setNotice(successMessage);
    } catch (err) {
      if (isInvalidOperatorSecretError(err)) {
        clearEventV0OperatorSecret(eventId);
        setUnlocked(false);
      }
      setError(formatOperatorError(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(participantId) {
    // Only true waiting (not already in an active pairing) can enter selection.
    if (activePairedIdSet.has(participantId)) return;
    if (!waitingIdSet.has(participantId)) return;

    setSelectedIds((current) => {
      if (current.includes(participantId)) {
        return current.filter((id) => id !== participantId);
      }
      if (current.length >= 2) return current;
      return [...current, participantId];
    });
  }

  async function handleCreatePairing() {
    if (selectedIds.length !== 2) {
      setError("대기 중인 참가자 두 명을 선택해 주세요.");
      return;
    }
    const [a, b] = selectedIds;
    await runAction(async () => {
      await operatorCreatePairing(
        eventId,
        getEventV0OperatorSecret(eventId),
        a,
        b
      );
      setSelectedIds([]);
    }, "대진을 만들었습니다.");
  }

  async function handleAddParticipant(submitEvent) {
    submitEvent.preventDefault();
    if (!addForm.experience) {
      setError("복싱 경력을 선택해 주세요.");
      return;
    }
    await runAction(async () => {
      await operatorAddParticipant(eventId, getEventV0OperatorSecret(eventId), {
        displayName: addForm.displayName,
        gymName: addForm.gymName,
        weightKg: addForm.weightKg,
        experience: addForm.experience,
      });
      setAddForm(emptyForm());
      setShowAdd(false);
    }, "참가자를 추가했습니다.");
  }

  function startEdit(participant) {
    setEditId(participant.id);
    setEditForm({
      displayName: participant.displayName || "",
      gymName: participant.gymName || "",
      weightKg:
        participant.weightKg == null ? "" : String(participant.weightKg),
      experience: participant.experience || "",
    });
    setShowAdd(false);
  }

  async function handleSaveEdit(submitEvent) {
    submitEvent.preventDefault();
    if (!editForm.experience) {
      setError("복싱 경력을 선택해 주세요.");
      return;
    }
    await runAction(async () => {
      await operatorUpdateParticipant(
        eventId,
        getEventV0OperatorSecret(eventId),
        editId,
        {
          displayName: editForm.displayName,
          gymName: editForm.gymName,
          weightKg: editForm.weightKg,
          experience: editForm.experience,
        }
      );
      setEditId(null);
      setEditForm(emptyForm());
    }, "참가자 정보를 수정했습니다.");
  }

  async function handleRequeue(participantId) {
    await runAction(async () => {
      await operatorCreateSparringRequest(
        eventId,
        getEventV0OperatorSecret(eventId),
        participantId
      );
    }, "스파링 대기로 등록했습니다.");
  }

  async function handleComplete(pairingId) {
    if (!window.confirm("이 대진을 스파링 완료로 처리할까요?")) return;
    await runAction(async () => {
      await operatorCompletePairing(
        eventId,
        getEventV0OperatorSecret(eventId),
        pairingId
      );
      setActionPairingId(null);
      setActionMode(null);
    }, "스파링을 완료 처리했습니다.");
  }

  async function handleCancel(pairingId) {
    if (!window.confirm("이 대진을 취소할까요? 두 사람은 다시 대기 상태가 됩니다.")) {
      return;
    }
    await runAction(async () => {
      await operatorCancelPairing(
        eventId,
        getEventV0OperatorSecret(eventId),
        pairingId
      );
      setActionPairingId(null);
      setActionMode(null);
    }, "대진을 취소했습니다.");
  }

  async function handleOpponentChange() {
    if (!actionPairingId || !replaceSideId || !newOpponentId) {
      setError("교체할 쪽과 새 상대를 선택해 주세요.");
      return;
    }
    await runAction(async () => {
      await operatorChangeOpponent(
        eventId,
        getEventV0OperatorSecret(eventId),
        actionPairingId,
        replaceSideId,
        newOpponentId
      );
      setActionPairingId(null);
      setActionMode(null);
      setReplaceSideId("");
      setNewOpponentId("");
    }, "상대를 변경했습니다.");
  }

  async function handleOrderChange() {
    if (!actionPairingId || !swapTargetOrder) {
      setError("바꿀 대진 번호를 선택해 주세요.");
      return;
    }
    await runAction(async () => {
      await operatorChangeOrder(
        eventId,
        getEventV0OperatorSecret(eventId),
        actionPairingId,
        Number(swapTargetOrder)
      );
      setActionPairingId(null);
      setActionMode(null);
      setSwapTargetOrder("");
    }, "순서를 변경했습니다.");
  }

  if (booting) {
    return (
      <main className="event-v0-op">
        <p className="event-v0-op-note">불러오는 중…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="event-v0-op">
        <p className="event-v0-op-error" role="alert">
          {error || "행사를 찾을 수 없습니다."}
        </p>
      </main>
    );
  }

  const dateLabel = formatEventV0Date(event.eventDate);

  if (!unlocked) {
    return (
      <main className="event-v0-op" aria-label="운영자 진입">
        <header className="event-v0-op-head">
          <p className="event-v0-op-kicker">EVENT v0 운영</p>
          <h1>{event.title || "EVENT"}</h1>
          {dateLabel ? <p className="event-v0-op-meta">{dateLabel}</p> : null}
          {event.location ? (
            <p className="event-v0-op-meta">{event.location}</p>
          ) : null}
        </header>
        <form className="event-v0-op-gate" onSubmit={handleUnlock}>
          <label>
            운영자 키
            <input
              type="password"
              autoComplete="current-password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="event-v0-op-cta" disabled={busy}>
            {busy ? "확인 중…" : "운영 시작"}
          </button>
        </form>
        {error ? (
          <p className="event-v0-op-error" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    );
  }

  return (
    <main className="event-v0-op" aria-label="운영 화면">
      <header className="event-v0-op-head">
        <div className="event-v0-op-head-row">
          <p className="event-v0-op-kicker">EVENT v0</p>
          <button type="button" className="event-v0-op-text-btn" onClick={handleLock}>
            잠금
          </button>
        </div>
        <h1>{event.title || "EVENT"}</h1>
        <p className="event-v0-op-summary">
          참가자 {participants.length}명 · 대기 {waiting.length}명 · 대진{" "}
          {activePairings.length}개
        </p>
      </header>

      <nav className="event-v0-op-tabs" aria-label="운영 탭">
        <button
          type="button"
          className={`event-v0-op-tab${tab === "people" ? " is-active" : ""}`}
          onClick={() => setTab("people")}
        >
          참가자/대기
        </button>
        <button
          type="button"
          className={`event-v0-op-tab${tab === "board" ? " is-active" : ""}`}
          onClick={() => setTab("board")}
        >
          대진표
        </button>
      </nav>

      <div className="event-v0-op-toolbar">
        <button
          type="button"
          className="event-v0-op-cta is-secondary"
          disabled={busy}
          onClick={() =>
            runAction(async () => {
              await refreshBoard();
            }, "목록을 새로고침했습니다.")
          }
        >
          새로고침
        </button>
      </div>

      {notice ? <p className="event-v0-op-notice">{notice}</p> : null}
      {error ? (
        <p className="event-v0-op-error" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "people" ? (
        <section className="event-v0-op-section" aria-label="참가자와 대기">
          <div className="event-v0-op-create-bar">
            <p>
              선택 {selectedIds.length}/2
              {selectedIds.length === 0
                ? " · 대기 중 참가자를 탭하세요"
                : selectedIds.length === 1
                  ? " · 한 명 더 선택"
                  : " · 대진 생성 가능"}
            </p>
            <button
              type="button"
              className="event-v0-op-cta"
              disabled={busy || selectedIds.length !== 2}
              onClick={handleCreatePairing}
            >
              대진 만들기
            </button>
          </div>

          <div className="event-v0-op-people-board">
            {waiting.length === 0 ? (
              <p className="event-v0-op-note">대기 중인 참가자가 없습니다.</p>
            ) : null}

            {waitingByWeightBand.map((group) => (
              <div
                key={group.bandFloor == null ? "none" : String(group.bandFloor)}
                className="event-v0-op-weight-group"
              >
                <h2 className="event-v0-op-weight-head">
                  {group.label} · {group.items.length}명
                </h2>
                <ul className="event-v0-op-list">
                  {group.items.map((w) => {
                    const p = participantMap.get(w.participantId) || {
                      id: w.participantId,
                      displayName: w.displayName,
                      gymName: w.gymName,
                      weightKg: w.weightKg,
                      experience: w.experience,
                    };
                    const inActive = activePairedIdSet.has(p.id);
                    const canSelect = !inActive;
                    const selected = selectedIds.includes(p.id);
                    const queueIndex = waitingQueueByParticipantId.get(p.id);
                    const activeDisplay = activeDisplayByParticipantId.get(p.id);

                    let statusText = "대기 중 · 탭해서 선택";
                    if (inActive) {
                      statusText = `대진 중 · ${activeDisplay}번`;
                    } else if (selected) {
                      statusText = "선택됨 ✓";
                    }

                    const cardClass = [
                      "event-v0-op-card",
                      selected ? "is-selected" : "",
                      inActive ? "is-paired" : "",
                      canSelect ? "is-waiting" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <li key={p.id} className={cardClass}>
                        <button
                          type="button"
                          className="event-v0-op-card-main"
                          disabled={!canSelect || busy}
                          aria-disabled={!canSelect || busy}
                          aria-pressed={selected}
                          onClick={() => {
                            if (canSelect) toggleSelect(p.id);
                          }}
                        >
                          <strong>{p.displayName}</strong>
                          <span>
                            {p.gymName} · {weightLabel(p.weightKg)} ·{" "}
                            {p.experience || "경력 없음"}
                          </span>
                          {queueIndex != null && canSelect ? (
                            <span className="event-v0-op-queue">
                              대기 {queueIndex}번째
                            </span>
                          ) : null}
                          <em
                            className={`event-v0-op-status${
                              inActive
                                ? " is-paired"
                                : selected
                                  ? " is-selected"
                                  : canSelect
                                    ? " is-waiting"
                                    : ""
                            }`}
                          >
                            {statusText}
                          </em>
                        </button>
                        <div className="event-v0-op-card-actions">
                          <button
                            type="button"
                            className="event-v0-op-mini"
                            disabled={busy}
                            onClick={() => startEdit(p)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="event-v0-op-mini"
                            disabled
                            onClick={() => handleRequeue(p.id)}
                          >
                            다시 대기
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {nonWaitingParticipants.length > 0 ? (
              <div className="event-v0-op-weight-group">
                <h2 className="event-v0-op-weight-head">
                  대기 아님 · {nonWaitingParticipants.length}명
                </h2>
                <ul className="event-v0-op-list">
                  {nonWaitingParticipants.map((p) => {
                    const activeDisplay = activeDisplayByParticipantId.get(p.id);
                    const inActive = activePairedIdSet.has(p.id);

                    let statusText = "대기 아님";
                    if (inActive) {
                      statusText = `대진 중 · ${activeDisplay}번`;
                    }

                    const cardClass = [
                      "event-v0-op-card",
                      inActive ? "is-paired" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <li key={p.id} className={cardClass}>
                        <button
                          type="button"
                          className="event-v0-op-card-main"
                          disabled
                          aria-disabled
                        >
                          <strong>{p.displayName}</strong>
                          <span>
                            {p.gymName} · {weightLabel(p.weightKg)} ·{" "}
                            {p.experience || "경력 없음"}
                          </span>
                          <em
                            className={`event-v0-op-status${
                              inActive ? " is-paired" : ""
                            }`}
                          >
                            {statusText}
                          </em>
                        </button>
                        <div className="event-v0-op-card-actions">
                          <button
                            type="button"
                            className="event-v0-op-mini"
                            disabled={busy}
                            onClick={() => startEdit(p)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="event-v0-op-mini"
                            disabled={busy || inActive}
                            onClick={() => handleRequeue(p.id)}
                          >
                            다시 대기
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          {editId ? (
            <form className="event-v0-op-form" onSubmit={handleSaveEdit}>
              <h2>참가자 수정</h2>
              <label>
                이름 / 닉네임
                <input
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  maxLength={40}
                  required
                />
              </label>
              <label>
                소속 체육관
                <input
                  value={editForm.gymName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, gymName: e.target.value }))
                  }
                  maxLength={80}
                  required
                />
              </label>
              <label>
                체중 (kg)
                <input
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  step={0.1}
                  value={editForm.weightKg}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, weightKg: e.target.value }))
                  }
                  required
                />
              </label>
              <fieldset>
                <legend>복싱 경력</legend>
                <div className="event-v0-op-chips">
                  {EXPERIENCE_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`event-v0-op-chip${
                        editForm.experience === level ? " is-active" : ""
                      }`}
                      onClick={() =>
                        setEditForm((f) => ({ ...f, experience: level }))
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="event-v0-op-form-actions">
                <button
                  type="button"
                  className="event-v0-op-cta is-secondary"
                  onClick={() => setEditId(null)}
                >
                  취소
                </button>
                <button type="submit" className="event-v0-op-cta" disabled={busy}>
                  저장
                </button>
              </div>
            </form>
          ) : null}

          {!showAdd ? (
            <button
              type="button"
              className="event-v0-op-cta is-secondary"
              onClick={() => {
                setShowAdd(true);
                setEditId(null);
              }}
            >
              참가자 직접 추가
            </button>
          ) : (
            <form className="event-v0-op-form" onSubmit={handleAddParticipant}>
              <h2>참가자 직접 추가</h2>
              <label>
                이름 / 닉네임
                <input
                  value={addForm.displayName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  maxLength={40}
                  required
                />
              </label>
              <label>
                소속 체육관
                <input
                  value={addForm.gymName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, gymName: e.target.value }))
                  }
                  maxLength={80}
                  required
                />
              </label>
              <label>
                체중 (kg)
                <input
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  step={0.1}
                  value={addForm.weightKg}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, weightKg: e.target.value }))
                  }
                  required
                />
              </label>
              <fieldset>
                <legend>복싱 경력</legend>
                <div className="event-v0-op-chips">
                  {EXPERIENCE_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`event-v0-op-chip${
                        addForm.experience === level ? " is-active" : ""
                      }`}
                      onClick={() =>
                        setAddForm((f) => ({ ...f, experience: level }))
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="event-v0-op-form-actions">
                <button
                  type="button"
                  className="event-v0-op-cta is-secondary"
                  onClick={() => setShowAdd(false)}
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="event-v0-op-cta"
                  disabled={busy || !addForm.experience}
                >
                  추가
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {tab === "board" ? (
        <section className="event-v0-op-section" aria-label="대진표">
          {activePairings.length === 0 ? (
            <p className="event-v0-op-note">진행 중인 대진이 없습니다.</p>
          ) : null}

          <ul className="event-v0-op-board">
            {activePairings.map((pair) => {
              const a = participantMap.get(pair.participantAId);
              const b = participantMap.get(pair.participantBId);
              const open = actionPairingId === pair.id;
              const displayOrder =
                pair.displayOrder ??
                computeEventV0DisplayOrder(pair.orderNumber, pairings);
              return (
                <li key={pair.id} className="event-v0-op-board-row">
                  <div className="event-v0-op-board-main">
                    <span className="event-v0-op-order">{displayOrder}</span>
                    <div className="event-v0-op-fighters">
                      <p>
                        {a?.displayName || "?"} {weightLabel(a?.weightKg)}
                      </p>
                      <p>
                        {b?.displayName || "?"} {weightLabel(b?.weightKg)}
                      </p>
                      <em>진행 대기</em>
                    </div>
                  </div>
                  <div className="event-v0-op-board-actions">
                    <button
                      type="button"
                      className="event-v0-op-mini"
                      disabled={busy}
                      onClick={() => {
                        setActionPairingId(pair.id);
                        setActionMode("opponent");
                        setReplaceSideId("");
                        setNewOpponentId("");
                      }}
                    >
                      상대 변경
                    </button>
                    <button
                      type="button"
                      className="event-v0-op-mini"
                      disabled={busy || activePairings.length < 2}
                      onClick={() => {
                        setActionPairingId(pair.id);
                        setActionMode("order");
                        setSwapTargetOrder("");
                      }}
                    >
                      순서 변경
                    </button>
                    <button
                      type="button"
                      className="event-v0-op-mini"
                      disabled={busy}
                      onClick={() => handleCancel(pair.id)}
                    >
                      대진 취소
                    </button>
                    <button
                      type="button"
                      className="event-v0-op-mini is-accent"
                      disabled={busy}
                      onClick={() => handleComplete(pair.id)}
                    >
                      스파링 완료
                    </button>
                  </div>

                  {open && actionMode === "opponent" ? (
                    <div className="event-v0-op-inline">
                      <p>상대 변경 · 대진 번호 {displayOrder} 유지</p>
                      <label>
                        교체할 쪽
                        <select
                          value={replaceSideId}
                          onChange={(e) => setReplaceSideId(e.target.value)}
                        >
                          <option value="">선택</option>
                          <option value={pair.participantAId}>
                            {a?.displayName || "A"}
                          </option>
                          <option value={pair.participantBId}>
                            {b?.displayName || "B"}
                          </option>
                        </select>
                      </label>
                      <label>
                        새 상대 (대기자)
                        <select
                          value={newOpponentId}
                          onChange={(e) => setNewOpponentId(e.target.value)}
                        >
                          <option value="">선택</option>
                          {waiting.map((w) => (
                            <option key={w.participantId} value={w.participantId}>
                              {w.displayName} · {weightLabel(w.weightKg)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="event-v0-op-form-actions">
                        <button
                          type="button"
                          className="event-v0-op-cta is-secondary"
                          onClick={() => {
                            setActionPairingId(null);
                            setActionMode(null);
                          }}
                        >
                          닫기
                        </button>
                        <button
                          type="button"
                          className="event-v0-op-cta"
                          disabled={busy}
                          onClick={handleOpponentChange}
                        >
                          상대 바꾸기
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {open && actionMode === "order" ? (
                    <div className="event-v0-op-inline">
                      <p>순서 변경 · 다른 active 대진과 번호 교환</p>
                      <label>
                        바꿀 번호
                        <select
                          value={swapTargetOrder}
                          onChange={(e) => setSwapTargetOrder(e.target.value)}
                        >
                          <option value="">선택</option>
                          {activePairings
                            .filter((p) => p.id !== pair.id)
                            .map((p) => (
                              <option key={p.id} value={p.orderNumber}>
                                {computeEventV0DisplayOrder(
                                  p.orderNumber,
                                  pairings
                                )}
                                번
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="event-v0-op-form-actions">
                        <button
                          type="button"
                          className="event-v0-op-cta is-secondary"
                          onClick={() => {
                            setActionPairingId(null);
                            setActionMode(null);
                          }}
                        >
                          닫기
                        </button>
                        <button
                          type="button"
                          className="event-v0-op-cta"
                          disabled={busy}
                          onClick={handleOrderChange}
                        >
                          순서 바꾸기
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {pairings.some((p) => p.status !== "active") ? (
            <details className="event-v0-op-history">
              <summary>완료/취소된 대진</summary>
              <ul>
                {pairings
                  .filter((p) => p.status !== "active")
                  .map((p) => {
                    const a = participantMap.get(p.participantAId);
                    const b = participantMap.get(p.participantBId);
                    return (
                      <li key={p.id}>
                        <strong>{p.orderNumber}</strong>{" "}
                        {a?.displayName || "?"} vs {b?.displayName || "?"} ·{" "}
                        {p.status === "completed" ? "완료" : "취소"}
                      </li>
                    );
                  })}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
