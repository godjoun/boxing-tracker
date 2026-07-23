import { useCallback, useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import ExchangeChatModal from "../../components/ExchangeChatModal";
import { useTraining } from "../../store/TrainingContext";
import { resolveDojoActorId } from "../../utils/dojoChat";
import {
  applyExchangeEventAsync,
  cancelExchangeApplyAsync,
  combineDateAndTime,
  defaultComposeDateTime,
  filterExchangeEventsByDate,
  filterExchangeEventsByQuery,
  formatExchangeFee,
  formatExchangeSlots,
  formatExchangeWhen,
  hasAppliedExchange,
  hasDojoExchangeRemote,
  listAppliesForEventAsync,
  listExchangeEventsAsync,
  listPastExchangeEventsAsync,
  removeExchangeEventAsync,
  saveExchangeEventAsync,
} from "../../utils/dojoExchange";

function buildDefaultForm() {
  const { date, time } = defaultComposeDateTime();
  return {
    title: "",
    gymName: "",
    address: "",
    date,
    time,
    capacity: "12",
    feeWon: "0",
    note: "",
  };
}

export default function ExchangeBoardPanel({ onGoBack, embedded = false }) {
  const { profile, userId } = useTraining();
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState(buildDefaultForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [applicantsByEvent, setApplicantsByEvent] = useState({});
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  const remoteReady = hasDojoExchangeRemote();
  const myActorId = resolveDojoActorId(userId);

  function openChatWith({
    event,
    hostActorId,
    applicantActorId,
    hostNickname,
    applicantNickname,
  }) {
    if (!event?.id || event.isSample || event.source === "seed") {
      flash("예시 일정에서는 대화를 열 수 없어요.");
      return;
    }

    setChatTarget({
      eventId: event.id,
      hostActorId,
      applicantActorId,
      hostNickname: hostNickname || event.hostNickname || "주최자",
      applicantNickname: applicantNickname || "신청자",
      gymName: event.gymName || "",
      eventLabel:
        event.whenLabel ||
        formatExchangeWhen(event.startsAt, event.whenLabel || ""),
    });
  }

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const upcoming = await listExchangeEventsAsync(userId);
      setEvents(upcoming.events);
      setSynced(upcoming.synced);

      const mine = upcoming.events.filter(
        (item) => item.isMine && item.source === "server"
      );
      const applicantEntries = await Promise.all(
        mine.map(async (item) => [
          item.id,
          await listAppliesForEventAsync(item.id, { source: item.source }),
        ])
      );
      setApplicantsByEvent(Object.fromEntries(applicantEntries));

      if (showPast) {
        const past = await listPastExchangeEventsAsync(userId);
        setPastEvents(past.events);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, showPast]);

  useEffect(() => {
    const timer = window.setTimeout(loadEvents, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const title = form.title.trim();
    const gymName = form.gymName.trim();
    const address = form.address.trim();
    const capacity = Number.parseInt(form.capacity, 10);
    const feeWon = Number.parseInt(String(form.feeWon).replace(/,/g, ""), 10);
    const startsAt = combineDateAndTime(form.date, form.time);

    if (!gymName || !address) {
      setError("체육관 이름과 주소는 필수입니다.");
      return;
    }

    if (!startsAt) {
      setError("날짜와 시간을 선택해 주세요.");
      return;
    }

    if (new Date(startsAt).getTime() < Date.now()) {
      setError("지난 일정은 올릴 수 없습니다.");
      return;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("모집 인원은 1명 이상이어야 합니다.");
      return;
    }

    if (!Number.isFinite(feeWon) || feeWon < 0) {
      setError("참가비는 0 이상 숫자로 입력해 주세요. (무료면 0)");
      return;
    }

    const payload = {
      title,
      gymName,
      address,
      startsAt,
      capacity,
      feeWon,
      appliedCount: 0,
      note: form.note.trim(),
      hostNickname: profile?.nickname || "나",
    };

    setBusy(true);
    try {
      track("dojo_exchange_post", { capacity, feeWon });
      const result = await saveExchangeEventAsync(payload, userId);
      setForm(buildDefaultForm());
      setComposing(false);
      setError("");
      flash(
        result.synced
          ? "일정이 올라갔습니다. 다른 폰에서도 보입니다."
          : "이 기기에 저장됐습니다. (서버 미연결)"
      );
      await loadEvents();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(eventId) {
    if (busy) return;
    setBusy(true);
    try {
      await removeExchangeEventAsync(eventId, userId);
      track("dojo_exchange_remove");
      await loadEvents();
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyToggle(item) {
    if (item.isMine || item.isSample || busy) return;

    setBusy(true);
    try {
      if (hasAppliedExchange(item.id, userId)) {
        const result = await cancelExchangeApplyAsync(item.id, userId, {
          source: item.source,
          isSample: item.isSample,
        });
        if (!result.ok) {
          flash("취소하지 못했습니다.");
          return;
        }
        track("dojo_exchange_apply_cancel", { eventId: item.id });
        flash(
          result.synced
            ? "참가 신청을 취소했습니다."
            : "이 기기에서 취소했습니다."
        );
        await loadEvents();
        return;
      }

      const cap = Number(item.capacity) || 0;
      const applied = Number(item.appliedCount) || 0;
      if (cap > 0 && applied >= cap) {
        flash("모집이 마감됐습니다.");
        return;
      }

      const result = await applyExchangeEventAsync(
        item.id,
        {
          userId,
          nickname: profile?.nickname || "나",
        },
        { source: item.source, isSample: item.isSample }
      );

      if (!result.ok) {
        flash("신청하지 못했습니다. 마감됐을 수 있어요.");
        await loadEvents();
        return;
      }

      track("dojo_exchange_apply", { eventId: item.id });
      flash(
        result.synced
          ? "신청됐습니다. 상대 폰에도 인원이 반영됩니다."
          : "이 기기에 신청이 저장됐습니다."
      );
      await loadEvents();
    } finally {
      setBusy(false);
    }
  }

  const visibleEvents = filterExchangeEventsByQuery(
    filterExchangeEventsByDate(events, dateFilter),
    searchQuery
  );
  const visiblePastEvents = filterExchangeEventsByQuery(
    pastEvents,
    searchQuery
  );

  function renderCard(item) {
    const applied = hasAppliedExchange(item.id, userId);
    const cap = Number(item.capacity) || 0;
    const count = Number(item.appliedCount) || 0;
    const full = cap > 0 && count >= cap && !applied;
    const applicants = item.isMine
      ? applicantsByEvent[item.id] || []
      : [];
    const whenText =
      item.whenLabel || formatExchangeWhen(item.startsAt, item.whenLabel);

    return (
      <article
        key={item.id}
        className={`exchange-match${item.isMine ? " is-mine" : ""}${
          applied ? " is-applied" : ""
        }${full ? " is-full" : ""}${item.isSample ? " is-sample" : ""}${
          item.isPast ? " is-past" : ""
        }`}
      >
        <div className="exchange-match-top">
          <div className="exchange-match-time">{whenText}</div>
          {item.isSample ? (
            <span className="exchange-sample-chip">예시</span>
          ) : null}
          {item.isMine ? (
            <span className="exchange-mine-chip">내 일정</span>
          ) : null}
        </div>

        <h3 className="exchange-match-place">{item.gymName}</h3>
        {item.address ? (
          <p className="exchange-match-address">{item.address}</p>
        ) : null}
        {item.title ? (
          <p className="exchange-match-title">{item.title}</p>
        ) : null}

        {item.note ? (
          <p className="exchange-match-note">{item.note}</p>
        ) : null}

        <div className="exchange-match-meta">
          <div>
            <span>인원</span>
            <strong>
              {formatExchangeSlots(item.appliedCount, item.capacity)}
            </strong>
          </div>
          <div>
            <span>참가비</span>
            <strong>{formatExchangeFee(item.feeWon)}</strong>
          </div>
        </div>

        {item.isMine && applicants.length > 0 ? (
          <div className="exchange-match-applicants">
            <span>신청자</span>
            <ul className="exchange-match-applicant-list">
              {applicants.map((person) => (
                <li key={person.id || person.userId}>
                  <strong>{person.nickname || "나"}</strong>
                  {item.source === "server" && person.userId ? (
                    <button
                      type="button"
                      className="exchange-chat-open"
                      onClick={() =>
                        openChatWith({
                          event: item,
                          hostActorId: item.userId || myActorId,
                          applicantActorId: person.userId,
                          hostNickname: profile?.nickname || "주최자",
                          applicantNickname: person.nickname || "신청자",
                        })
                      }
                      >
                        ③ 대화하기
                      </button>
                    ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="exchange-match-actions">
          {item.isSample ? (
            <p className="exchange-sample-hint">
              화면 예시예요. 실제 모집이 아닙니다.
            </p>
          ) : item.isMine ? (
            <button
              type="button"
              className="exchange-match-ghost"
              onClick={() => handleRemove(item.id)}
              disabled={busy}
            >
              내 일정 삭제
            </button>
          ) : item.isPast ? (
            <p className="exchange-sample-hint">지난 일정</p>
          ) : (
            <>
              <button
                type="button"
                className={`exchange-match-cta${applied ? " is-cancel" : ""}`}
                onClick={() => handleApplyToggle(item)}
                disabled={full || busy}
              >
                {applied
                  ? "신청 취소"
                  : full
                    ? "마감"
                    : "② 참가 신청"}
              </button>
              {applied && item.source === "server" && item.userId ? (
                <button
                  type="button"
                  className="exchange-match-chat"
                  onClick={() =>
                    openChatWith({
                      event: item,
                      hostActorId: item.userId,
                      applicantActorId: myActorId,
                      hostNickname: item.hostNickname || "주최자",
                      applicantNickname: profile?.nickname || "신청자",
                    })
                  }
                >
                  ③ 대화하기
                </button>
              ) : applied && item.source !== "server" ? (
                <p className="exchange-sample-hint">
                  서버 연결 후 주최자와 대화할 수 있어요.
                </p>
              ) : null}
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      {!embedded ? (
        <header className="gym-search-header">
          {onGoBack ? (
            <button
              className="category-back dojo-sub-back"
              type="button"
              onClick={onGoBack}
            >
              ← 도장
            </button>
          ) : null}
          <h1>모임</h1>
          <p className="gym-search-context">오픈 스파링 · 합동훈련</p>
        </header>
      ) : null}

      <section className="exchange-flow-guide" aria-label="모임 이용 순서">
        <p className="home-section-label">HOW IT WORKS</p>
        <ol className="exchange-flow-steps">
          <li>
            <strong>올리기</strong>
            <span>날짜·장소·인원을 올립니다</span>
          </li>
          <li>
            <strong>참가</strong>
            <span>카드에서 참가 신청합니다</span>
          </li>
          <li>
            <strong>대화</strong>
            <span>신청 후 주최자와 대화합니다</span>
          </li>
        </ol>
      </section>

      <p className="exchange-limit-note">
        {remoteReady
          ? synced
            ? "일정·신청이 서버와 연결됐습니다. 다른 폰에서도 보입니다."
            : "서버 미연결 — 지금은 이 기기에만 저장됩니다."
          : "서버 연결 전에도 이 기기에서 올리고 신청할 수 있어요."}
      </p>

      <label className="exchange-search-filter">
        <span>검색</span>
        <div className="exchange-search-filter-row">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="체육관 · 주소 · 제목"
            enterKeyHint="search"
          />
          {searchQuery ? (
            <button
              type="button"
              className="exchange-date-clear"
              onClick={() => setSearchQuery("")}
            >
              지우기
            </button>
          ) : null}
        </div>
      </label>

      <label className="exchange-date-filter">
        <span>날짜로 찾기</span>
        <div className="exchange-date-filter-row">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
          {dateFilter ? (
            <button
              type="button"
              className="exchange-date-clear"
              onClick={() => setDateFilter("")}
            >
              전체
            </button>
          ) : null}
        </div>
      </label>

      <div className="exchange-toolbar exchange-toolbar-simple">
        <button
          type="button"
          className="exchange-compose-button"
          onClick={() => {
            setComposing((open) => !open);
            setError("");
            if (!composing) setForm(buildDefaultForm());
          }}
        >
          {composing ? "작성 닫기" : "① 일정 올리기"}
        </button>
      </div>

      {notice ? <p className="exchange-notice">{notice}</p> : null}

      {composing ? (
        <form className="exchange-compose" onSubmit={handleSubmit}>
          <p className="gym-inquiry-kicker">MEETUP</p>
          <strong>훈련 모임 올리기</strong>
          <p className="exchange-compose-lead">
            필수만 채우면 됩니다. 올린 뒤 다른 사람이 참가 신청할 수 있어요.
          </p>

          <label className="gym-inquiry-field">
            <span>체육관 *</span>
            <input
              type="text"
              value={form.gymName}
              onChange={(e) => updateField("gymName", e.target.value)}
              placeholder="예: ○○ 복싱짐"
            />
          </label>

          <label className="gym-inquiry-field">
            <span>주소 *</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="예: 서울 강남구 역삼동 ○○"
            />
          </label>

          <div className="exchange-compose-row">
            <label className="gym-inquiry-field">
              <span>날짜 *</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
            </label>

            <label className="gym-inquiry-field">
              <span>시간 *</span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
                required
              />
            </label>
          </div>

          <div className="exchange-compose-row">
            <label className="gym-inquiry-field">
              <span>모집 인원 *</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="12"
              />
            </label>

            <label className="gym-inquiry-field">
              <span>참가비 (원) *</span>
              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={form.feeWon}
                onChange={(e) => updateField("feeWon", e.target.value)}
                placeholder="0 = 무료"
              />
            </label>
          </div>

          <label className="gym-inquiry-field">
            <span>일정 이름 (선택)</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="비워도 됩니다"
            />
          </label>

          <label className="gym-inquiry-field">
            <span>안내 (선택)</span>
            <input
              type="text"
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="체급 · 준비물 한 줄"
            />
          </label>

          {error ? <p className="gym-inquiry-error">{error}</p> : null}

          <button type="submit" className="gym-inquiry-submit" disabled={busy}>
            {busy ? "올리는 중..." : "모임 올리기"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <div className="gym-state-card">
          <strong>일정 불러오는 중</strong>
          <p>잠시만요.</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="gym-state-card">
          <strong>
            {searchQuery || dateFilter
              ? "조건에 맞는 일정이 없습니다"
              : "아직 올라온 모임이 없습니다"}
          </strong>
          <p>
            {searchQuery || dateFilter
              ? "검색어·날짜를 바꾸거나 전체를 보세요."
              : "위에서 「① 일정 올리기」로 첫 모임을 만들어 보세요."}
          </p>
          {!searchQuery && !dateFilter ? (
            <button
              type="button"
              className="gym-retry-button"
              onClick={() => {
                setComposing(true);
                setError("");
                setForm(buildDefaultForm());
              }}
            >
              일정 올리기
            </button>
          ) : null}
        </div>
      ) : (
        <div className="exchange-feed">{visibleEvents.map(renderCard)}</div>
      )}

      <button
        type="button"
        className="exchange-past-toggle"
        onClick={() => setShowPast((value) => !value)}
      >
        {showPast ? "지난 일정 숨기기" : "지난 일정 보기"}
      </button>

      {showPast ? (
        visiblePastEvents.length === 0 ? (
          <p className="exchange-notice">지난 일정이 없습니다.</p>
        ) : (
          <div className="exchange-feed exchange-feed-past">
            {visiblePastEvents.map(renderCard)}
          </div>
        )
      ) : null}

      {chatTarget ? (
        <ExchangeChatModal
          open
          userId={userId}
          nickname={profile?.nickname || ""}
          eventId={chatTarget.eventId}
          hostActorId={chatTarget.hostActorId}
          applicantActorId={chatTarget.applicantActorId}
          hostNickname={chatTarget.hostNickname}
          applicantNickname={chatTarget.applicantNickname}
          gymName={chatTarget.gymName}
          eventLabel={chatTarget.eventLabel}
          onClose={() => setChatTarget(null)}
        />
      ) : null}
    </>
  );
}
