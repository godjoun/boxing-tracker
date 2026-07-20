import { useState } from "react";
import { track } from "@vercel/analytics";
import { saveGymInquiry } from "../utils/gymInquiry";

const KIND_OPTIONS = [
  {
    id: "trial",
    label: "체험",
    datePlaceholder: "예: 이번 주 주말 오후",
    memoPlaceholder: "복싱 경험, 궁금한 점 등",
  },
  {
    id: "rental",
    label: "대여",
    datePlaceholder: "예: 토요일 오후 2~5시",
    memoPlaceholder: "인원, 링 사용, 교류 상대 짐 등",
  },
];

export default function GymInquiryModal({ gym, onClose }) {
  const [kind, setKind] = useState("trial");
  const [contact, setContact] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  const kindMeta =
    KIND_OPTIONS.find((item) => item.id === kind) || KIND_OPTIONS[0];

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setError("연락처(전화번호 또는 카카오 ID)를 입력해 주세요.");
      return;
    }

    const payload = {
      kind,
      gymId: gym?.id || "general",
      gymName: gym?.name || "일반 문의",
      contact: trimmedContact,
      preferredDate: preferredDate.trim(),
      memo: memo.trim(),
    };

    track("gym_inquiry_submit", {
      gymId: payload.gymId,
      kind,
      hasPhone: Boolean(gym?.phone),
    });

    saveGymInquiry(payload);

    setIsDone(true);
    setError("");
  }

  if (!gym) return null;

  return (
    <div className="gym-inquiry-overlay" role="presentation" onClick={onClose}>
      <div
        className="gym-inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gym-inquiry-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="gym-inquiry-close" onClick={onClose}>
          닫기
        </button>

        {isDone ? (
          <div className="gym-inquiry-done">
            <p className="gym-inquiry-kicker">INQUIRY SENT</p>
            <h2 id="gym-inquiry-title">문의가 접수됐어요</h2>
            <p>
              <strong>{gym.name}</strong> {kindMeta.label} 문의를 기록했습니다.
              제휴 도장이 연결되면 입력하신 연락처로 안내드릴게요.
            </p>
            {gym.phone ? (
              <a className="gym-inquiry-call" href={`tel:${gym.phone}`}>
                도장에 직접 전화하기
              </a>
            ) : null}
            <button
              type="button"
              className="gym-inquiry-submit"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        ) : (
          <form className="gym-inquiry-form" onSubmit={handleSubmit}>
            <p className="gym-inquiry-kicker">GYM INQUIRY</p>
            <h2 id="gym-inquiry-title">{gym.name} 문의</h2>
            <p className="gym-inquiry-copy">
              체험·대여 중 골라 요청해 주세요. 연락처는 앱에만 저장됩니다.
            </p>

            <div className="gym-inquiry-kind" role="group" aria-label="문의 종류">
              <span className="gym-inquiry-kind-label">문의 종류 *</span>
              <div className="gym-inquiry-kind-row">
                {KIND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`gym-inquiry-kind-btn${
                      kind === option.id ? " is-active" : ""
                    }`}
                    onClick={() => setKind(option.id)}
                    aria-pressed={kind === option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="gym-inquiry-field">
              <span>연락처 *</span>
              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="010-0000-0000 또는 카카오 ID"
                autoComplete="tel"
              />
            </label>

            <label className="gym-inquiry-field">
              <span>희망 일정</span>
              <input
                type="text"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                placeholder={kindMeta.datePlaceholder}
              />
            </label>

            <label className="gym-inquiry-field">
              <span>메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder={kindMeta.memoPlaceholder}
                rows={3}
              />
            </label>

            {error ? <p className="gym-inquiry-error">{error}</p> : null}

            <button type="submit" className="gym-inquiry-submit">
              문의 보내기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
