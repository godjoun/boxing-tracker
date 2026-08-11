import { useCallback, useEffect, useState } from "react";
import {
  formatEventV0Date,
  getEventV0PublicEvent,
  getMyEventV0Status,
  registerEventV0Sparring,
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
 * Views: hub | join | status
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
          // Restore whenever this auth.uid() already has a participant row
          // (waiting, paired, or registered without open request).
          if (status.participant) {
            setView("status");
          }
        } catch (err) {
          // No session → getMyEventV0Status returns nulls (no throw).
          // Real query anomalies (e.g. duplicate rows) must surface.
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

  async function handleManualRefresh() {
    setError("");
    try {
      await refreshStatus();
    } catch (err) {
      setError(err?.message || "새로고침에 실패했습니다.");
    }
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
                  setError("아직 등록되지 않았습니다. 먼저 스파링 참가해 주세요.");
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

      {view === "join" ? (
        <form className="event-v0-form" onSubmit={handleRegister}>
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
              onClick={() => {
                setError("");
                setView("hub");
              }}
              disabled={submitting}
            >
              뒤로
            </button>
            <button
              type="submit"
              className="event-v0-cta"
              disabled={submitting || !experience}
            >
              {submitting ? "등록 중…" : "스파링 참가 등록"}
            </button>
          </div>
        </form>
      ) : null}

      {view === "status" ? (
        <section className="event-v0-status" aria-live="polite">
          {activePairing ? (
            <div className="event-v0-pairing">
              <p className="event-v0-status-badge is-confirmed">대진 확정</p>
              <p className="event-v0-order-label">대진 번호</p>
              <p className="event-v0-order-number" aria-label={`대진 ${activePairing.orderNumber}번`}>
                {activePairing.orderNumber}
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
              <p className="event-v0-status-badge">스파링 완료</p>
              <p className="event-v0-waiting-copy">
                다시 참가하려면 운영자에게 알려주세요.
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
