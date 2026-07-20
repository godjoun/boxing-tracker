import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../../store/TrainingContext";
import {
  applyExchangeEvent,
  cancelExchangeApply,
  combineDateAndTime,
  defaultComposeDateTime,
  formatExchangeFee,
  formatExchangeSlots,
  formatExchangeWhen,
  hasAppliedExchange,
  listAppliesForEvent,
  listExchangeEvents,
  listPastExchangeEvents,
  removeExchangeEvent,
  saveExchangeEvent,
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
  const [tick, setTick] = useState(0);
  const [showPast, setShowPast] = useState(false);

  const events = useMemo(
    () => listExchangeEvents(userId),
    [userId, tick]
  );
  const pastEvents = useMemo(
    () => (showPast ? listPastExchangeEvents(userId) : []),
    [userId, tick, showPast]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function refresh() {
    setTick((value) => value + 1);
  }

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function handleSubmit(event) {
    event.preventDefault();

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

    track("dojo_exchange_post", { capacity, feeWon });
    saveExchangeEvent(payload, userId);
    setForm(buildDefaultForm());
    setComposing(false);
    setError("");
    flash("일정이 올라갔습니다.");
    refresh();
  }

  function handleRemove(eventId) {
    removeExchangeEvent(eventId, userId);
    track("dojo_exchange_remove");
    refresh();
  }

  function handleApplyToggle(item) {
    if (item.isMine || item.isSample) return;

    if (hasAppliedExchange(item.id, userId)) {
      cancelExchangeApply(item.id, userId);
      track("dojo_exchange_apply_cancel", { eventId: item.id });
      flash("참가 신청을 취소했습니다.");
      refresh();
      return;
    }

    const cap = Number(item.capacity) || 0;
    const applied = Number(item.appliedCount) || 0;
    if (cap > 0 && applied >= cap) {
      flash("모집이 마감됐습니다.");
      return;
    }

    applyExchangeEvent(item.id, {
      userId,
      nickname: profile?.nickname || "나",
    });
    track("dojo_exchange_apply", { eventId: item.id });
    flash("신청 저장됨 · 상대 알림은 곧 연결됩니다.");
    refresh();
  }

  function renderCard(item) {
    const applied = hasAppliedExchange(item.id, userId);
    const cap = Number(item.capacity) || 0;
    const count = Number(item.appliedCount) || 0;
    const full = cap > 0 && count >= cap && !applied;
    const applicants = item.isMine ? listAppliesForEvent(item.id) : [];
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
            <strong>
              {applicants.map((person) => person.nickname || "나").join(", ")}
            </strong>
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
            >
              삭제
            </button>
          ) : item.isPast ? (
            <p className="exchange-sample-hint">지난 일정</p>
          ) : (
            <button
              type="button"
              className={`exchange-match-cta${applied ? " is-cancel" : ""}`}
              onClick={() => handleApplyToggle(item)}
              disabled={full}
            >
              {applied ? "신청 취소" : full ? "마감" : "참가 신청"}
            </button>
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
          <h1>교류</h1>
          <p className="gym-search-context">주말 오픈 · 원정 스파링</p>
        </header>
      ) : null}

      <p className="exchange-limit-note">
        신청은 이 기기에 저장됩니다. 상대 알림·채팅은 다음 단계에서 연결됩니다.
      </p>

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
          {composing ? "닫기" : "일정 올리기"}
        </button>
      </div>

      {notice ? <p className="exchange-notice">{notice}</p> : null}

      {composing ? (
        <form className="exchange-compose" onSubmit={handleSubmit}>
          <p className="gym-inquiry-kicker">OPEN SPARRING</p>
          <strong>오픈 스파링 일정</strong>

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

          <button type="submit" className="gym-inquiry-submit">
            올리기
          </button>
        </form>
      ) : null}

      {events.length === 0 ? (
        <div className="gym-state-card">
          <strong>다가오는 일정이 없습니다</strong>
          <p>주말 오픈 스파링을 올려 보세요.</p>
        </div>
      ) : (
        <div className="exchange-feed">{events.map(renderCard)}</div>
      )}

      <button
        type="button"
        className="exchange-past-toggle"
        onClick={() => setShowPast((value) => !value)}
      >
        {showPast ? "지난 일정 숨기기" : "지난 일정 보기"}
      </button>

      {showPast ? (
        pastEvents.length === 0 ? (
          <p className="exchange-notice">지난 일정이 없습니다.</p>
        ) : (
          <div className="exchange-feed exchange-feed-past">
            {pastEvents.map(renderCard)}
          </div>
        )
      ) : null}
    </>
  );
}
