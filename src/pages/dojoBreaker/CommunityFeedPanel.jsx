import { useEffect, useMemo, useState } from "react";
import { useTraining } from "../../store/TrainingContext";
import {
  listExchangeEventsAsync,
  listPastExchangeEventsAsync,
} from "../../utils/dojoExchange";

function formatWhen(startsAt) {
  if (!startsAt) return "";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}.${day} ${hours}:${minutes}`;
}

function formatAgo(iso) {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";
  const diff = Date.now() - time;
  if (diff < 0) return formatWhen(iso);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatWhen(iso);
}

function getStatus(event, isPast = false) {
  if (isPast || event.isPast) return { id: "done", label: "교류 완료" };
  const starts = new Date(event.startsAt || event.starts_at).getTime();
  if (!Number.isFinite(starts)) return { id: "open", label: "모집 중" };
  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  const target = new Date(starts);
  target.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((target - startDay) / 86400000);
  if (dayDiff === 0) return { id: "ongoing", label: "오늘" };
  if (dayDiff < 0) return { id: "done", label: "교류 완료" };
  return { id: "open", label: "모집 중" };
}

function FeedPostCard({ event, isPast = false, onOpen }) {
  const status = getStatus(event, isPast);
  const gym = event.gymName || event.gym_name || "지역 모임";
  const title = event.title || `${gym} 교류`;
  const body =
    event.note ||
    (isPast || status.id === "done"
      ? `${gym}에서 훈련을 마쳤습니다.`
      : `${gym}에서 함께 훈련할 사람을 모집합니다.`);
  const place = event.address || event.area || gym;
  const when =
    isPast || status.id === "done"
      ? formatAgo(event.startsAt || event.updatedAt || event.createdAt)
      : formatWhen(event.startsAt);
  const initial = String(gym).trim().slice(0, 1) || "교";

  return (
    <button type="button" className="community-feed-card" onClick={onOpen}>
      <div className="community-feed-card-head">
        <span className="community-feed-avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="community-feed-identity">
          <strong>{gym}</strong>
          <span>{place}</span>
        </div>
        <div className="community-feed-head-side">
          {when ? <small>{when}</small> : null}
          <em className={`community-feed-badge is-${status.id}`}>{status.label}</em>
        </div>
      </div>

      <p className="community-feed-body">{body}</p>
      {title && title !== body ? (
        <p className="community-feed-title">{title}</p>
      ) : null}

      <div className="community-feed-media" aria-hidden="true">
        <span>{status.label}</span>
      </div>
    </button>
  );
}

/**
 * 커뮤니티 첫 화면 — 사진처럼 단순한 피드.
 * 좋아요·댓글 없음. 카드 탭 = 상세, FAB = 올리기.
 */
export default function CommunityFeedPanel({ onOpenEvent, onCompose }) {
  const { userId } = useTraining();
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const posts = useMemo(() => {
    const open = events.slice(0, 8);
    const done = pastEvents.slice(0, 6).map((event) => ({ ...event, isPast: true }));
    return [...open, ...done];
  }, [events, pastEvents]);

  return (
    <div className="community-feed" aria-label="커뮤니티 피드">
      {loading ? (
        <p className="community-feed-empty">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <div className="community-feed-empty-card">
          <strong>아직 올라온 교류가 없습니다</strong>
          <span>오른쪽 아래 + 로 첫 만남을 올려 보세요.</span>
        </div>
      ) : (
        <div className="community-feed-list">
          {posts.map((event) => (
            <FeedPostCard
              key={`feed-${event.id}-${event.isPast ? "p" : "o"}`}
              event={event}
              isPast={Boolean(event.isPast)}
              onOpen={() => onOpenEvent?.(event, { isPast: Boolean(event.isPast) })}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="community-feed-fab"
        aria-label="모임 올리기"
        onClick={onCompose}
      >
        +
      </button>
    </div>
  );
}
