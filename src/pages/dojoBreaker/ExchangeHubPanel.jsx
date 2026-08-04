import { useEffect, useMemo, useState } from "react";
import { useTraining } from "../../store/TrainingContext";
import {
  listExchangeEventsAsync,
  listPastExchangeEventsAsync,
} from "../../utils/dojoExchange";

const PURPOSE_TABS = [
  { id: "feed", label: "피드" },
  { id: "schedule", label: "일정" },
  { id: "propose", label: "제안" },
];

function formatWhen(startsAt) {
  if (!startsAt) return "";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return String(startsAt).slice(0, 16);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}.${day} ${hours}:${minutes}`;
}

function getDayDiff(startsAt) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - start) / 86400000);
}

function getStatus(event, { isPast = false } = {}) {
  if (isPast || event.isPast) {
    return { id: "done", label: "완료" };
  }
  const diff = getDayDiff(event.startsAt || event.starts_at);
  if (diff === 0) return { id: "ongoing", label: "진행" };
  if (diff != null && diff < 0) return { id: "done", label: "완료" };
  return { id: "upcoming", label: "예정" };
}

function dDayLabel(startsAt) {
  const diff = getDayDiff(startsAt);
  if (diff == null) return "";
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** 피드 카드: 상태 → 제목 → 관·일시. 사진 자리만, 좋아요 없음 */
function FeedCard({ event, isPast = false, onOpen }) {
  const status = getStatus(event, { isPast });
  const when = formatWhen(event.startsAt || event.starts_at);
  const gym = event.gymName || event.gym_name || "";
  const title = event.title || gym || "교류";

  return (
    <button
      type="button"
      className={`ex-feed-card${isPast || status.id === "done" ? " is-muted" : ""}`}
      onClick={onOpen}
    >
      <div className="ex-feed-card-media" aria-hidden="true">
        <em className={`ex-chip is-${status.id}`}>{status.label}</em>
      </div>
      <div className="ex-feed-card-body">
        <strong>{title}</strong>
        <span>{[gym && title !== gym ? gym : null, when].filter(Boolean).join(" · ") || "일정 확인"}</span>
      </div>
    </button>
  );
}

/** 일정 카드: D-day → 관 → 시각 */
function ScheduleCard({ event, isPast = false, onOpen }) {
  const status = getStatus(event, { isPast });
  const when = formatWhen(event.startsAt || event.starts_at);
  const gym = event.gymName || event.gym_name || "";
  const day = dDayLabel(event.startsAt || event.starts_at);

  return (
    <button
      type="button"
      className={`ex-schedule-card${isPast || status.id === "done" ? " is-muted" : ""}`}
      onClick={onOpen}
    >
      <div className="ex-schedule-card-top">
        <em className={`ex-chip is-${status.id}`}>
          {isPast ? status.label : day || status.label}
        </em>
        <span>{when || "시간 미정"}</span>
      </div>
      <strong>{gym || event.title || "교류"}</strong>
      {event.title && gym ? <span>{event.title}</span> : null}
    </button>
  );
}

function PurposeHead({ kicker, title, lead }) {
  return (
    <header className="exchange-purpose-head">
      <p className="exchange-hub-kicker">{kicker}</p>
      <h2>{title}</h2>
      {lead ? <p className="exchange-hub-lead">{lead}</p> : null}
    </header>
  );
}

export default function ExchangeHubPanel({
  onOpenMeetings,
  onOpenEvent,
  onComposeMeeting,
  onOpenRivals,
  onOpenMe,
}) {
  const { userId } = useTraining();
  const [purpose, setPurpose] = useState("feed"); // feed | schedule | propose
  const [scheduleTab, setScheduleTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  function openCompose() {
    (onComposeMeeting || onOpenMeetings)?.();
  }

  function openEvent(event, isPast = false) {
    if (onOpenEvent) {
      onOpenEvent(event, { isPast });
      return;
    }
    onOpenMeetings?.();
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [upcoming, past] = await Promise.all([
          listExchangeEventsAsync(userId),
          listPastExchangeEventsAsync(userId),
        ]);
        if (cancelled) return;
        setEvents(Array.isArray(upcoming?.events) ? upcoming.events : []);
        setPastEvents(Array.isArray(past?.events) ? past.events : []);
      } catch {
        if (!cancelled) {
          setEvents([]);
          setPastEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const scheduleBuckets = useMemo(() => {
    const upcoming = [];
    const ongoing = [];
    for (const event of events) {
      const status = getStatus(event);
      if (status.id === "ongoing") ongoing.push(event);
      else if (status.id === "upcoming") upcoming.push(event);
    }
    return { upcoming, ongoing, done: pastEvents };
  }, [events, pastEvents]);

  const feedCards = useMemo(() => {
    const open = events.slice(0, 10);
    const done = pastEvents.slice(0, 3).map((event) => ({ ...event, isPast: true }));
    return [...open, ...done];
  }, [events, pastEvents]);

  const scheduleItems = scheduleBuckets[scheduleTab] || [];

  return (
    <div className="exchange-hub" aria-label="교류">
      <nav className="exchange-purpose-nav" aria-label="교류 목적">
        {PURPOSE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={purpose === tab.id ? "is-active" : ""}
            aria-current={purpose === tab.id ? "page" : undefined}
            onClick={() => setPurpose(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {purpose === "feed" ? (
        <section className="exchange-purpose" aria-label="교류 피드">
          <PurposeHead
            kicker="EXCHANGE"
            title="교류 피드"
            lead="함께 훈련할 일정을 고릅니다."
          />

          <div className="exchange-purpose-body">
            {loading ? (
              <p className="exchange-hub-empty">불러오는 중…</p>
            ) : feedCards.length === 0 ? (
              <div className="exchange-hub-empty-card">
                <strong>아직 올라온 교류가 없습니다</strong>
                <span>모임을 올려 첫 만남을 만드세요.</span>
              </div>
            ) : (
              <div className="ex-feed-list">
                {feedCards.map((event) => (
                  <FeedCard
                    key={`feed-${event.id}-${event.isPast ? "p" : "o"}`}
                    event={event}
                    isPast={Boolean(event.isPast)}
                    onOpen={() => openEvent(event, Boolean(event.isPast))}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="exchange-purpose-foot">
            <button type="button" className="exchange-purpose-cta" onClick={openCompose}>
              모임 올리기
            </button>
          </div>
        </section>
      ) : null}

      {purpose === "schedule" ? (
        <section className="exchange-purpose" aria-label="교류 일정">
          <PurposeHead
            kicker="SCHEDULE"
            title="교류 일정"
            lead="예정된 만남을 D-day로 봅니다."
          />

          <div className="exchange-schedule-tabs" role="tablist" aria-label="일정 상태">
            {[
              { id: "upcoming", label: "예정", count: scheduleBuckets.upcoming.length },
              { id: "ongoing", label: "진행", count: scheduleBuckets.ongoing.length },
              { id: "done", label: "완료", count: scheduleBuckets.done.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={scheduleTab === tab.id}
                className={scheduleTab === tab.id ? "is-active" : ""}
                onClick={() => setScheduleTab(tab.id)}
              >
                {tab.label}
                <em aria-hidden="true"> {tab.count}</em>
              </button>
            ))}
          </div>

          <div className="exchange-purpose-body">
            {loading ? (
              <p className="exchange-hub-empty">불러오는 중…</p>
            ) : scheduleItems.length === 0 ? (
              <div className="exchange-hub-empty-card">
                <strong>
                  {scheduleTab === "upcoming"
                    ? "예정된 일정이 없습니다"
                    : scheduleTab === "ongoing"
                      ? "오늘 진행 중인 일정이 없습니다"
                      : "완료된 일정이 없습니다"}
                </strong>
                <span>
                  {scheduleTab === "done"
                    ? "끝난 교류는 프로필 흔적으로 이어집니다."
                    : "일정을 만들면 여기에 모입니다."}
                </span>
              </div>
            ) : (
              <div className="ex-schedule-list">
                {scheduleItems.map((event) => (
                  <ScheduleCard
                    key={`sch-${event.id}`}
                    event={event}
                    isPast={scheduleTab === "done"}
                    onOpen={() => openEvent(event, scheduleTab === "done")}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="exchange-purpose-foot">
            {scheduleTab === "done" ? (
              <button type="button" className="exchange-purpose-cta is-secondary" onClick={onOpenMe}>
                내 활동에서 흔적 보기
              </button>
            ) : (
              <button type="button" className="exchange-purpose-cta" onClick={openCompose}>
                일정 만들기
              </button>
            )}
          </div>
        </section>
      ) : null}

      {purpose === "propose" ? (
        <section className="exchange-purpose" aria-label="교류 제안">
          <PurposeHead
            kicker="PROPOSE"
            title="교류 제안"
            lead="다음 만남을 제안합니다."
          />

          <div className="exchange-purpose-body">
            <div className="exchange-propose-stack">
              <article className="exchange-propose-card">
                <strong>훈련 모임</strong>
                <span>지역 복서에게 일정을 올립니다.</span>
              </article>
              <article className="exchange-propose-card">
                <strong>라이벌 1:1</strong>
                <span>공개 카드로 스파링 가능한 사람을 찾습니다.</span>
              </article>
              <article className="exchange-propose-card is-later">
                <strong>관 ↔ 관</strong>
                <span>출시 후 이 자리에 옵니다.</span>
              </article>
            </div>
          </div>

          <div className="exchange-purpose-foot">
            <button type="button" className="exchange-purpose-cta" onClick={openCompose}>
              모임으로 제안하기
            </button>
            <button type="button" className="exchange-purpose-text" onClick={onOpenRivals}>
              라이벌 보러 가기
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
