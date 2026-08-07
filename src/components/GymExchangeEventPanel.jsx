import { useEffect, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import {
  getMyGymExchangeParticipation,
  joinGymExchange,
  updateMySparringRounds,
} from "../api/gymExchangeParticipationApi";
import {
  formatGymExchangeDate,
  getGymExchangeStatusLabel,
} from "../data/gymExchangeEvent";
import "./GymExchangeEventPanel.css";

function defaultNickname(profile) {
  return profile?.nickname && profile.nickname !== "나" ? profile.nickname : "";
}

/**
 * 체육관 교류 이벤트 상세 — 함께하기 안에서 표시.
 * 참가 시에만 anonymous auth 세션 확보.
 */
export default function GymExchangeEventPanel({ event, onClose }) {
  const { profile } = useTraining();
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [savingRounds, setSavingRounds] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [nickname, setNickname] = useState(() => defaultNickname(profile));
  const [gymName, setGymName] = useState(() => profile?.homeGymName || "");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMyGymExchangeParticipation(event.id)
      .then((row) => {
        if (!cancelled) setParticipation(row);
      })
      .catch((err) => {
        if (!cancelled) {
          setParticipation(null);
          setError(err?.message || "참가 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [event.id]);

  async function handleJoin(submitEvent) {
    submitEvent.preventDefault();
    setError("");
    setJoining(true);
    try {
      const row = await joinGymExchange(event.id, nickname, gymName);
      setParticipation(row);
      setShowJoinForm(false);
    } catch (err) {
      setError(err?.message || "참가에 실패했습니다.");
    } finally {
      setJoining(false);
    }
  }

  async function changeRounds(delta) {
    if (!participation || savingRounds) return;
    const current = Number(participation.sparringRounds) || 0;
    const next = current + delta;
    if (next < 0) return;

    setError("");
    setSavingRounds(true);
    try {
      const row = await updateMySparringRounds(event.id, next);
      setParticipation(row);
    } catch (err) {
      setError(err?.message || "라운드 저장에 실패했습니다.");
      try {
        const fresh = await getMyGymExchangeParticipation(event.id, {
          ensureAuth: true,
        });
        if (fresh) setParticipation(fresh);
      } catch {
        /* keep last known participation */
      }
    } finally {
      setSavingRounds(false);
    }
  }

  const statusLabel = getGymExchangeStatusLabel(event.status);
  const dateLabel = formatGymExchangeDate(event.date);
  const rounds = Number(participation?.sparringRounds) || 0;

  return (
    <section className="gym-exchange-detail" aria-label="체육관 교류 상세">
      <header className="gym-exchange-detail-head">
        <button
          type="button"
          className="gym-exchange-detail-back"
          onClick={onClose}
          aria-label="뒤로"
        >
          ←
        </button>
        <div>
          <p className="gym-exchange-kicker">체육관 교류</p>
          <h2>{event.title}</h2>
        </div>
      </header>

      <div className="gym-exchange-detail-body">
        <p className="gym-exchange-gyms">
          {event.gymA} × {event.gymB}
        </p>
        <dl className="gym-exchange-meta">
          <div>
            <dt>날짜</dt>
            <dd>{dateLabel || "—"}</dd>
          </div>
          <div>
            <dt>장소</dt>
            <dd>{event.location || "—"}</dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd>{statusLabel || "—"}</dd>
          </div>
        </dl>

        {loading ? (
          <p className="gym-exchange-note">불러오는 중…</p>
        ) : participation ? (
          <div className="gym-exchange-joined">
            <p className="gym-exchange-joined-badge">참가 중</p>
            <p className="gym-exchange-joined-gym">
              내 소속 · {participation.gymName}
            </p>

            <div className="gym-exchange-rounds" aria-label="스파링 라운드">
              <span className="gym-exchange-rounds-label">스파링</span>
              <div className="gym-exchange-rounds-controls">
                <button
                  type="button"
                  className="gym-exchange-round-btn"
                  disabled={savingRounds || rounds <= 0}
                  onClick={() => changeRounds(-1)}
                  aria-label="라운드 감소"
                >
                  −
                </button>
                <strong aria-live="polite">{rounds}R</strong>
                <button
                  type="button"
                  className="gym-exchange-round-btn"
                  disabled={savingRounds}
                  onClick={() => changeRounds(1)}
                  aria-label="라운드 증가"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : showJoinForm ? (
          <form className="gym-exchange-join-form" onSubmit={handleJoin}>
            <label>
              닉네임
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                autoComplete="nickname"
                required
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
              />
            </label>
            <div className="gym-exchange-join-actions">
              <button
                type="button"
                className="gym-exchange-btn is-secondary"
                onClick={() => setShowJoinForm(false)}
                disabled={joining}
              >
                취소
              </button>
              <button
                type="submit"
                className="gym-exchange-btn"
                disabled={joining}
              >
                {joining ? "참가 중…" : "참가 확정"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="gym-exchange-btn"
            onClick={() => setShowJoinForm(true)}
          >
            참가하기
          </button>
        )}

        {error ? (
          <p className="gym-exchange-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
