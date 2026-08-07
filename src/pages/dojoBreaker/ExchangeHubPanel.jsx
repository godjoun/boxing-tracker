import { useEffect, useMemo, useState } from "react";
import { useTraining } from "../../store/TrainingContext";
import {
  formatGymExchangeDate,
  getGymExchangeStatusLabel,
  listPublishableGymExchangeEvents,
} from "../../data/gymExchangeEvent";
import {
  listExchangeEventsAsync,
  listPastExchangeEventsAsync,
} from "../../utils/dojoExchange";
import { RELEASE_SCOPE } from "../../utils/releaseScope";
import "../../components/GymExchangeEventPanel.css";

/**
 * 교류 도구 카테고리 (커뮤니티 첫 화면 피드는 상위 탭).
 * 뱃지·랭킹은 틀만 두고 MVP 본기능은 제외(철학).
 */
const CATEGORIES = [
  { id: "propose", label: "제안" },
  { id: "schedule", label: "일정" },
  { id: "badges", label: "뱃지" },
  { id: "ranking", label: "랭킹" },
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

/** 교류 일정 — D-day → 관 → 시각 */
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

function CategoryHead({ title, lead }) {
  return (
    <header className="exchange-purpose-head">
      <h2>{title}</h2>
      {lead ? <p className="exchange-hub-lead">{lead}</p> : null}
    </header>
  );
}

function GymExchangeEventCard({ event, onOpen }) {
  return (
    <button
      type="button"
      className="gym-exchange-event-card"
      onClick={() => onOpen?.(event)}
      data-testid="gym-exchange-event-card"
    >
      <div className="gym-exchange-event-card-top">
        <em>{getGymExchangeStatusLabel(event.status)}</em>
        <span>{formatGymExchangeDate(event.date)}</span>
      </div>
      <strong>{event.title}</strong>
      <p>
        {event.gymA} × {event.gymB}
      </p>
      <small>{event.location}</small>
      <small>상세 보기</small>
    </button>
  );
}

export default function ExchangeHubPanel({
  onOpenMeetings,
  onOpenEvent,
  onOpenGymExchangeEvent,
  onComposeMeeting,
  onOpenGyms,
  onOpenRivals,
  onOpenMe,
}) {
  const { userId } = useTraining();
  const [category, setCategory] = useState("schedule");
  const [scheduleTab, setScheduleTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const gymExchangeEvents = useMemo(
    () => listPublishableGymExchangeEvents(),
    []
  );

  function openMeetingCompose() {
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

  const scheduleItems = scheduleBuckets[scheduleTab] || [];

  return (
    <div className="exchange-hub" aria-label="교류">
      <nav className="exchange-category-nav" aria-label="교류 카테고리">
        {CATEGORIES.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={category === tab.id ? "is-active" : ""}
            aria-current={category === tab.id ? "page" : undefined}
            onClick={() => setCategory(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 교류 제안 — 체육관 상세에서 기존 문의·대화로 연결 */}
      {category === "propose" ? (
        <section className="exchange-frame is-propose" aria-label="교류 제안">
          <CategoryHead
            title="교류 제안"
            lead="함께 훈련하고 싶은 체육관을 고른 뒤 메시지를 보내세요."
          />

          <div className="exchange-purpose-body">
            <div className="ex-propose-form" aria-label="제안 구성">
              <div className="ex-propose-field">
                <span>1. 체육관 찾기</span>
                <div className="ex-propose-field-value">지역에서 관을 검색합니다</div>
              </div>
              <div className="ex-propose-field">
                <span>2. 정보 확인</span>
                <div className="ex-propose-field-value">소개 · 위치 · 이용 정보를 봅니다</div>
              </div>
              <div className="ex-propose-field">
                <span>3. 교류 제안</span>
                <div className="ex-propose-field-value">일시 · 인원 · 메시지를 보냅니다</div>
              </div>
              <div className="ex-propose-field is-later">
                <span>정식 관 ↔ 관</span>
                <div className="ex-propose-field-value">수락 · 일정 · 완료 기록은 이후</div>
              </div>
            </div>
          </div>

          <div className="exchange-purpose-foot">
            <button type="button" className="exchange-purpose-cta" onClick={onOpenGyms}>
              체육관 찾기
            </button>
            {RELEASE_SCOPE.rivals ? (
              <button type="button" className="exchange-purpose-text" onClick={onOpenRivals}>
                라이벌에게 관심 보내기
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 4. 교류 일정 */}
      {category === "schedule" ? (
        <section className="exchange-frame is-schedule" aria-label="교류 일정">
          <CategoryHead
            title="교류 일정"
            lead="예정 · 진행 · 완료를 D-day로 관리합니다."
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
            {gymExchangeEvents.length > 0 ? (
              <div
                className="gym-exchange-event-list"
                aria-label="체육관 교류 이벤트"
              >
                {gymExchangeEvents.map((event) => (
                  <GymExchangeEventCard
                    key={`gx-${event.id}`}
                    event={event}
                    onOpen={onOpenGymExchangeEvent}
                  />
                ))}
              </div>
            ) : null}

            {loading ? (
              <p className="exchange-hub-empty">불러오는 중…</p>
            ) : scheduleItems.length === 0 && gymExchangeEvents.length === 0 ? (
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
            ) : scheduleItems.length === 0 ? null : (
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
                프로필 흔적 보기
              </button>
            ) : (
              <button type="button" className="exchange-purpose-cta" onClick={openMeetingCompose}>
                + 일정 만들기
              </button>
            )}
          </div>
        </section>
      ) : null}

      {/* 5. 뱃지 — 보드 자리, MVP는 프로필 흔적으로 대체 */}
      {category === "badges" ? (
        <section className="exchange-frame is-deferred" aria-label="교류 뱃지">
          <CategoryHead
            title="교류 뱃지"
            lead="배지 그리드 대신, 완료한 교류가 프로필 흔적으로 남습니다."
          />
          <div className="exchange-hub-empty-card">
            <strong>프로필 「교류의 흔적」</strong>
            <span>횟수·이력으로 신뢰를 남깁니다. 배지 경쟁 UI는 넣지 않습니다.</span>
          </div>
          <div className="exchange-purpose-foot">
            <button type="button" className="exchange-purpose-cta" onClick={onOpenMe}>
              내 흔적 보기
            </button>
          </div>
        </section>
      ) : null}

      {/* 6. 랭킹 — 보드 자리, MVP 제외 */}
      {category === "ranking" ? (
        <section className="exchange-frame is-deferred" aria-label="교류 랭킹">
          <CategoryHead
            title="교류 랭킹"
            lead="공개 랭킹은 출시 MVP에 넣지 않습니다."
          />
          <div className="exchange-hub-empty-card">
            <strong>경쟁보다 만남</strong>
            <span>함께 훈련한 기록이 프로필에 남는 쪽이 우선입니다.</span>
          </div>
          <div className="exchange-purpose-foot">
            <button
              type="button"
              className="exchange-purpose-cta is-secondary"
              onClick={() => setCategory("schedule")}
            >
              일정으로 돌아가기
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
