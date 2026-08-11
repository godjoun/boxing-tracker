import { useCallback, useEffect, useState } from "react";
import {
  cancelMyEventV0SparringRequest,
  createMyEventV0SparringRequest,
  formatEventV0Date,
  getEventV0PublicEvent,
  getMyEventV0Status,
  registerEventV0Sparring,
  updateMyEventV0Participant,
} from "../api/eventV0Api";
import "./EventV0ParticipantPage.css";

const POLL_MS = 10_000;

const EVENT_V0_EXPERIENCE_OPTIONS = [
  "초보 (6개월 미만)",
  "6개월~1년",
  "1~2년",
  "2~3년",
  "4년 이상",
];

/**
 * EVENT v0 participant QR surface — mobile-first, no app chrome.
 * Views: hub | join | status | edit
 */
export default function EventV0ParticipantPage({ eventId }) {
  const [view, setView] = useState("hub");
  const [event, setEvent] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [openRequest, setOpenRequest] = useState(null);
  const [activePairing, setActivePairing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gymName, setGymName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [experience, setExperience] = useState("");

  const refreshStatus = useCallback(async () => {
    const status = await getMyEventV0Status(eventId);
    setParticipant(status.participant);
    setOpenRequest(status.openRequest);
    setActivePairing(status.activePairing);
    return status;
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");
      try {
        const pub = await getEventV0PublicEvent(eventId);
        if (cancelled) return;
        if (!pub) {
          setEvent(null);
          setError("행사를 찾을 수 없습니다.");
          return;
        }
        setEvent(pub);

        try {
          const status = await refreshStatus();
          if (cancelled) return;
          if (status.participant) {
            setView("status");
          }
        } catch (err) {
          if (!cancelled) {
            setError(err?.message || "상태를 불러오지 못했습니다.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "행사를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshStatus]);

  useEffect(() => {
    if (view !== "status") return undefined;

    let cancelled = false;

    async function tick() {
      try {
        await refreshStatus();
        if (!cancelled) setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "상태를 갱신하지 못했습니다.");
        }
      }
    }

    const timer = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [view, refreshStatus]);

  function fillFormFromParticipant(p) {
    setDisplayName(p?.displayName || "");
    setGymName(p?.gymName || "");
    setWeightKg(p?.weightKg == null ? "" : String(p.weightKg));
    setExperience(p?.experience || "");
  }

  async function handleRegister(submitEvent) {
    submitEvent.preventDefault();
    setError("");
    if (!experience) {
      setError("복싱 경력을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerEventV0Sparring({
        eventId,
        displayName,
        gymName,
        weightKg,
        experience,
      });
      setParticipant(result.participant);
      await refreshStatus();
      setView("status");
    } catch (err) {
      setError(err?.message || "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(submitEvent) {
    submitEvent.preventDefault();
    setError("");
    if (!experience) {
      setError("복싱 경력을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateMyEventV0Participant({
        eventId,
        displayName,
        gymName,
        weightKg,
        experience,
      });
      setParticipant(updated);
      await refreshStatus();
      setView("status");
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("already in an active pairing")) {
        setError("대진이 확정된 뒤에는 운영자에게 알려주세요.");
        await refreshStatus();
        setView("status");
      } else {
        setError(err?.message || "수정에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelWaiting() {
    setError("");
    if (!window.confirm("스파링 대기를 취소할까요?")) return;
    setSubmitting(true);
    try {
      await cancelMyEventV0SparringRequest(eventId);
      await refreshStatus();
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("already in an active pairing")) {
        setError("대진이 확정된 뒤에는 운영자에게 알려주세요.");
        await refreshStatus();
      } else {
        setError(err?.message || "대기 취소에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequeue() {
    setError("");
    setSubmitting(true);
    try {
      await createMyEventV0SparringRequest(eventId);
      await refreshStatus();
    } catch (err) {
      setError(err?.message || "대기 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualRefresh() {
    setError("");
    try {
      await refreshStatus();
    } catch (err) {
      setError(err?.message || "새로고침에 실패했습니다.");
    }
  }

  function renderProfileForm({ onSubmit, submitLabel, onBack }) {
    return (
      <form className="event-v0-form" onSubmit={onSubmit}>
        <label>
          이름 / 닉네임
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            autoComplete="nickname"
            required
            enterKeyHint="next"
          />
        </label>
        <label>
          소속 체육관
          <input
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            maxLength={80}
            autoComplete="organization"
            required
            enterKeyHint="next"
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
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
            enterKeyHint="next"
          />
        </label>
        <fieldset className="event-v0-experience">
          <legend>복싱 경력</legend>
          <div className="event-v0-chips" role="group" aria-label="복싱 경력">
            {EVENT_V0_EXPERIENCE_OPTIONS.map((level) => (
              <button
                key={level}
                type="button"
                className={`event-v0-chip${
                  experience === level ? " is-active" : ""
                }`}
                aria-pressed={experience === level}
                onClick={() => setExperience(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="event-v0-form-actions">
          <button
            type="button"
            className="event-v0-cta is-secondary"
            onClick={onBack}
            disabled={submitting}
          >
            뒤로
          </button>
          <button
            type="submit"
            className="event-v0-cta"
            disabled={submitting || !experience}
          >
            {submitting ? "저장 중…" : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  if (loading) {
    return (
      <main className="event-v0" aria-busy="true">
        <p className="event-v0-note">불러오는 중…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="event-v0">
        <p className="event-v0-error" role="alert">
          {error || "행사를 찾을 수 없습니다."}
        </p>
      </main>
    );
  }

  const dateLabel = formatEventV0Date(event.eventDate);
  const gymsLabel = [event.gymA, event.gymB].filter(Boolean).join(" × ");
  const canSelfEdit = Boolean(participant) && !activePairing;
  const canCancelWaiting =
    Boolean(openRequest?.status === "waiting") && !activePairing;
  const canRequeue =
    Boolean(participant) && !activePairing && !openRequest;

  return (
    <main className="event-v0" aria-label="스파링 행사">
      <header className="event-v0-head">
        <p className="event-v0-kicker">스파링 교류</p>
        <h1>{event.title || "EVENT"}</h1>
        {gymsLabel ? <p className="event-v0-gyms">{gymsLabel}</p> : null}
        <dl className="event-v0-meta">
          {dateLabel ? (
            <div>
              <dt>날짜</dt>
              <dd>{dateLabel}</dd>
            </div>
          ) : null}
          {event.location ? (
            <div>
              <dt>장소</dt>
              <dd>{event.location}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      {view === "hub" ? (
        <section className="event-v0-actions" aria-label="선택">
          <button
            type="button"
            className="event-v0-cta"
            onClick={() => {
              setError("");
              setDisplayName("");
              setGymName("");
              setWeightKg("");
              setExperience("");
              setView("join");
            }}
          >
            스파링 참가
          </button>
          <button
            type="button"
            className="event-v0-cta is-secondary"
            onClick={async () => {
              setError("");
              try {
                const status = await refreshStatus();
                if (!status.participant) {
                  setError(
                    "아직 등록되지 않았습니다. 먼저 스파링 참가해 주세요."
                  );
                  return;
                }
                setView("status");
              } catch (err) {
                setError(err?.message || "대진을 불러오지 못했습니다.");
              }
            }}
          >
            대진 확인
          </button>
        </section>
      ) : null}

      {view === "join"
        ? renderProfileForm({
            onSubmit: handleRegister,
            submitLabel: "스파링 참가 등록",
            onBack: () => {
              setError("");
              setView("hub");
            },
          })
        : null}

      {view === "edit"
        ? renderProfileForm({
            onSubmit: handleSaveEdit,
            submitLabel: "정보 저장",
            onBack: () => {
              setError("");
              setView("status");
            },
          })
        : null}

      {view === "status" ? (
        <section className="event-v0-status" aria-live="polite">
          {activePairing ? (
            <div className="event-v0-pairing">
              <p className="event-v0-status-badge is-confirmed">대진 확정</p>
              <p className="event-v0-order-label">대진 번호</p>
              <p
                className="event-v0-order-number"
                aria-label={`대진 ${
                  activePairing.displayOrder ?? activePairing.orderNumber
                }번`}
              >
                {activePairing.displayOrder ?? activePairing.orderNumber}
              </p>
              <p className="event-v0-vs">
                <span>{participant?.displayName || "나"}</span>
                <em>VS</em>
                <span>{activePairing.opponentDisplayName || "상대"}</span>
              </p>
              {activePairing.opponentGymName ? (
                <p className="event-v0-opponent-meta">
                  상대 체육관 · {activePairing.opponentGymName}
                </p>
              ) : null}
              {activePairing.opponentWeightKg != null ? (
                <p className="event-v0-opponent-meta">
                  체중 · {activePairing.opponentWeightKg}kg
                </p>
              ) : null}
              <p className="event-v0-note">
                대진이 확정된 뒤에는 운영자에게 알려주세요.
              </p>
            </div>
          ) : openRequest ? (
            <div className="event-v0-waiting">
              <p className="event-v0-status-badge">스파링 대기 중</p>
              <p className="event-v0-waiting-copy">
                관장님이 대진을 정하면 이 화면에서 확인할 수 있습니다.
              </p>
              {participant ? (
                <p className="event-v0-waiting-self">
                  {participant.displayName} · {participant.gymName}
                  {participant.weightKg != null
                    ? ` · ${participant.weightKg}kg`
                    : ""}
                </p>
              ) : null}
              {openRequest.status === "waiting" ? (
                <p className="event-v0-note">대기 요청이 접수되었습니다.</p>
              ) : null}
            </div>
          ) : (
            <div className="event-v0-waiting">
              <p className="event-v0-status-badge">
                현재 스파링 대기 중이 아닙니다.
              </p>
              <p className="event-v0-waiting-copy">
                다시 대기하려면 아래에서 신청할 수 있습니다.
              </p>
              {participant ? (
                <p className="event-v0-waiting-self">
                  {participant.displayName} · {participant.gymName}
                  {participant.weightKg != null
                    ? ` · ${participant.weightKg}kg`
                    : ""}
                </p>
              ) : null}
            </div>
          )}

          {canSelfEdit ? (
            <button
              type="button"
              className="event-v0-cta is-secondary"
              disabled={submitting}
              onClick={() => {
                setError("");
                fillFormFromParticipant(participant);
                setView("edit");
              }}
            >
              내 정보 수정
            </button>
          ) : null}

          {canCancelWaiting ? (
            <button
              type="button"
              className="event-v0-cta is-secondary"
              disabled={submitting}
              onClick={handleCancelWaiting}
            >
              {submitting ? "처리 중…" : "스파링 대기 취소"}
            </button>
          ) : null}

          {canRequeue ? (
            <button
              type="button"
              className="event-v0-cta"
              disabled={submitting}
              onClick={handleRequeue}
            >
              {submitting ? "신청 중…" : "스파링 대기 신청"}
            </button>
          ) : null}

          <button
            type="button"
            className="event-v0-cta is-secondary"
            onClick={handleManualRefresh}
          >
            새로고침
          </button>
          <button
            type="button"
            className="event-v0-link"
            onClick={() => {
              setError("");
              setView("hub");
            }}
          >
            처음으로
          </button>
        </section>
      ) : null}

      {error ? (
        <p className="event-v0-error" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}
