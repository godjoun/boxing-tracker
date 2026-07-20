import { useState } from "react";
import { track } from "@vercel/analytics";
import { getGymPassLines } from "../utils/gymPricing";
import {
  hasGymInquiryRemote,
  saveGymInquiryAsync,
} from "../utils/gymInquiry";

const KIND_OPTIONS = [
  {
    id: "trial",
    label: "체험",
    hint: "하루·한달 이용 문의",
    submitLabel: "체험 문의 보내기",
  },
  {
    id: "rental",
    label: "대여",
    hint: "링·홀 시간 대여",
    submitLabel: "대여 문의 보내기",
  },
  {
    id: "reservation",
    label: "예약",
    hint: "방문·레슨·스파링 일정 예약",
    submitLabel: "예약 문의 보내기",
  },
];

const TRIAL_EXPERIENCE = [
  { id: "beginner", label: "입문" },
  { id: "hobby", label: "취미" },
  { id: "amateur", label: "아마추어" },
  { id: "other", label: "기타" },
];

const RESERVATION_PURPOSE = [
  { id: "visit", label: "방문 상담" },
  { id: "lesson", label: "레슨" },
  { id: "sparring", label: "스파링" },
  { id: "other", label: "기타" },
];

export default function GymInquiryModal({
  gym,
  onClose,
  userId = null,
  nickname = "",
}) {
  const [kind, setKind] = useState("trial");
  const [contact, setContact] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [hours, setHours] = useState("2");
  const [experience, setExperience] = useState("hobby");
  const [purpose, setPurpose] = useState("visit");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [synced, setSynced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const kindMeta =
    KIND_OPTIONS.find((item) => item.id === kind) || KIND_OPTIONS[0];
  const passes = getGymPassLines(gym);
  const remoteReady = hasGymInquiryRemote();

  function switchKind(nextKind) {
    setKind(nextKind);
    setError("");
    setPreferredDate("");
    setTimeSlot("");
    setMemo("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setError("연락처(전화번호 또는 카카오 ID)를 입력해 주세요.");
      return;
    }

    if (kind === "reservation" && !preferredDate.trim()) {
      setError("희망 날짜를 입력해 주세요.");
      return;
    }

    if (kind === "rental" && !preferredDate.trim()) {
      setError("희망 대여 일정을 입력해 주세요.");
      return;
    }

    const experienceLabel =
      TRIAL_EXPERIENCE.find((item) => item.id === experience)?.label || "";
    const purposeLabel =
      RESERVATION_PURPOSE.find((item) => item.id === purpose)?.label || "";

    const payload = {
      kind,
      gymId: gym?.id || "general",
      gymName: gym?.name || "일반 문의",
      contact: trimmedContact,
      preferredDate: preferredDate.trim(),
      timeSlot: kind === "reservation" ? timeSlot.trim() : "",
      memo: memo.trim(),
      partySize:
        kind === "rental" || kind === "reservation"
          ? Number(partySize) || 1
          : null,
      hours: kind === "rental" ? Number(hours) || null : null,
      experience: kind === "trial" ? experienceLabel : "",
      purpose: kind === "reservation" ? purposeLabel : "",
      userId,
      nickname: nickname || "",
    };

    setSubmitting(true);
    setError("");

    try {
      track("gym_inquiry_submit", {
        gymId: payload.gymId,
        kind,
        hasPhone: Boolean(gym?.phone),
      });

      const result = await saveGymInquiryAsync(payload);
      setSynced(Boolean(result.synced));
      setIsDone(true);
    } catch {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
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
            <h2 id="gym-inquiry-title">
              {synced ? "문의가 전달됐어요" : "문의가 접수됐어요"}
            </h2>
            <p>
              <strong>{gym.name}</strong> {kindMeta.label} 문의를{" "}
              {synced
                ? "서버에 저장했습니다. 제휴·운영에서 확인하고 연락드릴 수 있어요."
                : "이 기기에 기록했습니다. 서버 연결이 안 되면 잠시 후 다시 보내 주세요."}
            </p>
            {!synced && remoteReady ? (
              <p className="gym-inquiry-sync-hint">
                네트워크·서버 상태를 확인한 뒤 다시 시도해 주세요.
              </p>
            ) : null}
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

            <div className="gym-inquiry-pass-strip" aria-label="가격 참고">
              {passes.map((pass) => (
                <div key={pass.key}>
                  <span>{pass.label}</span>
                  <strong>{pass.value}</strong>
                </div>
              ))}
            </div>

            <div className="gym-inquiry-kind" role="group" aria-label="문의 종류">
              <span className="gym-inquiry-kind-label">문의 종류 *</span>
              <div className="gym-inquiry-kind-row gym-inquiry-kind-row--3">
                {KIND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`gym-inquiry-kind-btn${
                      kind === option.id ? " is-active" : ""
                    }`}
                    onClick={() => switchKind(option.id)}
                    aria-pressed={kind === option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="gym-inquiry-kind-hint">{kindMeta.hint}</p>
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

            {kind === "trial" ? (
              <div className="gym-inquiry-branch" key="trial">
                <div
                  className="gym-inquiry-chip-group"
                  role="group"
                  aria-label="경험"
                >
                  <span className="gym-inquiry-kind-label">복싱 경험</span>
                  <div className="gym-inquiry-chip-row">
                    {TRIAL_EXPERIENCE.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`gym-inquiry-chip${
                          experience === option.id ? " is-active" : ""
                        }`}
                        onClick={() => setExperience(option.id)}
                        aria-pressed={experience === option.id}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="gym-inquiry-field">
                  <span>희망 방문일</span>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    placeholder="예: 이번 주 토요일 오후"
                  />
                </label>

                <label className="gym-inquiry-field">
                  <span>메모</span>
                  <textarea
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="궁금한 점 · 목표"
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            {kind === "rental" ? (
              <div className="gym-inquiry-branch" key="rental">
                <label className="gym-inquiry-field">
                  <span>희망 대여 일정 *</span>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    placeholder="예: 토요일 14:00~17:00"
                    required
                  />
                </label>

                <div className="gym-inquiry-rental-row">
                  <label className="gym-inquiry-field">
                    <span>예상 인원</span>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={partySize}
                      onChange={(event) => setPartySize(event.target.value)}
                    />
                  </label>
                  <label className="gym-inquiry-field">
                    <span>대여 시간(시간)</span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      inputMode="decimal"
                      value={hours}
                      onChange={(event) => setHours(event.target.value)}
                    />
                  </label>
                </div>

                <label className="gym-inquiry-field">
                  <span>메모</span>
                  <textarea
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="링 사용 · 교류 상대 짐 등"
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            {kind === "reservation" ? (
              <div className="gym-inquiry-branch" key="reservation">
                <div
                  className="gym-inquiry-chip-group"
                  role="group"
                  aria-label="목적"
                >
                  <span className="gym-inquiry-kind-label">목적 *</span>
                  <div className="gym-inquiry-chip-row">
                    {RESERVATION_PURPOSE.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`gym-inquiry-chip${
                          purpose === option.id ? " is-active" : ""
                        }`}
                        onClick={() => setPurpose(option.id)}
                        aria-pressed={purpose === option.id}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="gym-inquiry-field">
                  <span>희망 날짜 *</span>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    placeholder="예: 7/26 (토)"
                    required
                  />
                </label>

                <label className="gym-inquiry-field">
                  <span>희망 시간</span>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(event) => setTimeSlot(event.target.value)}
                    placeholder="예: 오후 2시~4시"
                  />
                </label>

                <label className="gym-inquiry-field">
                  <span>인원</span>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={partySize}
                    onChange={(event) => setPartySize(event.target.value)}
                  />
                </label>

                <label className="gym-inquiry-field">
                  <span>메모</span>
                  <textarea
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="레슨 코치 · 스파링 체급 등"
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            {error ? <p className="gym-inquiry-error">{error}</p> : null}

            <button
              type="submit"
              className="gym-inquiry-submit"
              disabled={submitting}
            >
              {submitting ? "보내는 중..." : kindMeta.submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
