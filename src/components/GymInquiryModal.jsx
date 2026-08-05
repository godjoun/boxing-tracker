import { useState } from "react";
import { track } from "@vercel/analytics";
import { getGymPassLines } from "../utils/gymPricing";
import {
  hasGymInquiryRemote,
  inquiryKindLabel,
  saveGymInquiryAsync,
  withExchangeProposalMemo,
} from "../utils/gymInquiry";
import GymInquiryChatModal from "./GymInquiryChatModal";

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
  initialKind = "trial",
  initialIntent = "inquiry",
}) {
  const isExchangeProposal = initialIntent === "exchange-proposal";
  const [kind, setKind] = useState(
    isExchangeProposal ? "reservation" : initialKind
  );
  const [contact, setContact] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [hours, setHours] = useState("2");
  const [experience, setExperience] = useState("hobby");
  const [purpose, setPurpose] = useState(
    isExchangeProposal ? "sparring" : "visit"
  );
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [doneInquiry, setDoneInquiry] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [inquiryStep, setInquiryStep] = useState(1);
  const INQUIRY_STEP_TOTAL = 3;

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

  function handleInquiryNext() {
    setError("");

    if (inquiryStep === 2) {
      if (kind === "reservation" && !preferredDate.trim()) {
        setError("희망 날짜를 입력해 주세요.");
        return;
      }
      if (kind === "rental" && !preferredDate.trim()) {
        setError("희망 대여 일정을 입력해 주세요.");
        return;
      }
    }

    setInquiryStep((step) => Math.min(step + 1, INQUIRY_STEP_TOTAL));
  }

  function handleInquiryBack() {
    setError("");
    setInquiryStep((step) => Math.max(step - 1, 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inquiryStep !== INQUIRY_STEP_TOTAL) {
      handleInquiryNext();
      return;
    }
    if (submitting) return;

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setError("연락처(전화번호 또는 카카오 ID)를 입력해 주세요.");
      return;
    }

    if (!privacyAgreed) {
      setError("문의 전달을 위한 개인정보 수집·제공에 동의해 주세요.");
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
      memo: isExchangeProposal
        ? withExchangeProposalMemo(memo)
        : memo.trim(),
      partySize:
        kind === "rental" || kind === "reservation"
          ? Number(partySize) || 1
          : null,
      hours: kind === "rental" ? Number(hours) || null : null,
      experience: kind === "trial" ? experienceLabel : "",
      purpose: kind === "reservation" ? purposeLabel : "",
      userId,
      nickname: nickname || "",
      acquisitionSource: gym?.featured ? "featured" : "organic",
    };

    setSubmitting(true);
    setError("");

    try {
      track("gym_inquiry_submit", {
        gymId: payload.gymId,
        kind,
        intent: initialIntent,
        hasPhone: Boolean(gym?.phone),
        acquisitionSource: payload.acquisitionSource,
      });

      const result = await saveGymInquiryAsync(payload);
      setSynced(Boolean(result.synced));
      setSyncMessage(result.syncMessage || "");
      setDoneInquiry(result.inquiry || null);
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

        {privacyOpen ? (
          <div className="gym-inquiry-privacy-view">
            <button
              type="button"
              className="gym-inquiry-privacy-back"
              onClick={() => setPrivacyOpen(false)}
            >
              ← {isExchangeProposal ? "제안으로" : "문의로"} 돌아가기
            </button>
            <p className="gym-inquiry-kicker">PRIVACY</p>
            <h2 id="gym-inquiry-title">개인정보 안내</h2>
            <p>
              체육관 문의·교류 제안을 보내면 연락처, 내용, 희망 일정, 링네임과
              대화 내용이 문의 전달과 답변을 위해 서버에 저장됩니다.
            </p>
            <h3>제공받는 곳</h3>
            <p>사용자가 선택한 체육관 운영자</p>
            <h3>이용 목적</h3>
            <p>체험·대여·예약·교류 제안 전달과 답변, 문의 대화 제공</p>
            <h3>주의</h3>
            <p>
              메모와 채팅에 주민등록번호, 계좌 비밀번호, 건강 진단서 등
              불필요한 민감정보를 입력하지 마세요.
            </p>
            <a
              className="gym-inquiry-privacy-full"
              href={`${import.meta.env.BASE_URL}privacy.html`}
              target="_blank"
              rel="noreferrer"
            >
              전체 개인정보 처리 안내 보기
            </a>
          </div>
        ) : isDone ? (
          <div className="gym-inquiry-done">
            <p className="gym-inquiry-kicker">
              {isExchangeProposal ? "PROPOSAL SENT" : "INQUIRY SENT"}
            </p>
            <h2 id="gym-inquiry-title">
              {synced
                ? isExchangeProposal
                  ? "제안이 전달됐어요"
                  : "문의가 전달됐어요"
                : isExchangeProposal
                  ? "제안이 접수됐어요"
                  : "문의가 접수됐어요"}
            </h2>
            <p>
              <strong>{gym.name}</strong>에{" "}
              {isExchangeProposal ? "교류 제안을" : `${kindMeta.label} 문의를`}{" "}
              {synced
                ? "서버에 저장했습니다. 「대화하기」로 관장과 메시지를 주고받을 수 있어요."
                : "이 기기에만 기록됐습니다."}
            </p>
            {!synced ? (
              <p className="gym-inquiry-sync-hint">
                {syncMessage ||
                  (remoteReady
                    ? "서버 저장에 실패했습니다. dojo_inquiries.sql 실행 후 다시 보내 주세요."
                    : "서버 연결(VITE_SUPABASE)이 없습니다.")}
              </p>
            ) : null}
            {synced && doneInquiry?.id && gym?.source === "listing" ? (
              <button
                type="button"
                className="gym-inquiry-submit"
                onClick={() => setChatOpen(true)}
              >
                대화하기
              </button>
            ) : null}
            {gym.phone ? (
              <a className="gym-inquiry-call" href={`tel:${gym.phone}`}>
                체육관에 직접 전화하기
              </a>
            ) : null}
            <button
              type="button"
              className="gym-inquiry-submit"
              onClick={onClose}
            >
              확인
            </button>
            <GymInquiryChatModal
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              userId={userId}
              nickname={nickname}
              inquiryId={doneInquiry?.id}
              gymName={gym.name}
              inquiryLabel={inquiryKindLabel(
                doneInquiry?.kind || kind,
                doneInquiry?.memo
              )}
              acquisitionSource={
                doneInquiry?.acquisitionSource || "organic"
              }
            />
          </div>
        ) : (
          <form className="gym-inquiry-form" onSubmit={handleSubmit}>
            <p className="gym-inquiry-kicker">
              {isExchangeProposal ? "GYM PROPOSAL" : "GYM INQUIRY"}
            </p>
            <h2 id="gym-inquiry-title">
              {gym.name} {isExchangeProposal ? "교류 제안" : "문의"}
            </h2>

            <div className="gym-inquiry-steps" aria-label="문의 작성 단계">
              <p className="gym-inquiry-step-label">
                {inquiryStep} / {INQUIRY_STEP_TOTAL}
              </p>
              <div className="gym-inquiry-step-progress" aria-hidden="true">
                {Array.from({ length: INQUIRY_STEP_TOTAL }, (_, index) => (
                  <span
                    key={index}
                    className={
                      index + 1 < inquiryStep
                        ? "is-done"
                        : index + 1 === inquiryStep
                          ? "is-active"
                          : ""
                    }
                  />
                ))}
              </div>
            </div>

            {inquiryStep === 1 ? (
              <>
                <div className="gym-inquiry-pass-strip" aria-label="가격 참고">
                  {passes.map((pass) => (
                    <div key={pass.key}>
                      <span>{pass.label}</span>
                      <strong>{pass.value}</strong>
                    </div>
                  ))}
                </div>

                {isExchangeProposal ? (
                  <div className="gym-inquiry-kind">
                    <span className="gym-inquiry-kind-label">교류 제안</span>
                    <p className="gym-inquiry-kind-hint">
                      합동훈련·스파링을 제안하고 관장과 메시지로 조율합니다.
                    </p>
                  </div>
                ) : (
                  <div
                    className="gym-inquiry-kind"
                    role="group"
                    aria-label="문의 종류"
                  >
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
                )}
              </>
            ) : null}

            {inquiryStep === 2 && kind === "trial" ? (
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

            {inquiryStep === 2 && kind === "rental" ? (
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
                    placeholder="링 사용 · 합동훈련 등"
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            {inquiryStep === 2 && kind === "reservation" ? (
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
                    placeholder={
                      isExchangeProposal
                        ? "합동훈련 목적 · 체급 · 준비물 · 한 줄 인사"
                        : "레슨 코치 · 스파링 체급 등"
                    }
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            {inquiryStep === 3 ? (
              <>
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

                <label className="gym-inquiry-consent">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(event) =>
                      setPrivacyAgreed(event.target.checked)
                    }
                  />
                  <span>
                    {isExchangeProposal ? "제안" : "문의"} 전달을 위해 연락처와 입력 내용을 선택한 체육관에
                    제공하는 데 동의합니다.{" "}
                    <button
                      type="button"
                      className="gym-inquiry-privacy-link"
                      onClick={() => setPrivacyOpen(true)}
                    >
                      개인정보 안내
                    </button>
                  </span>
                </label>
              </>
            ) : null}

            {error ? <p className="gym-inquiry-error">{error}</p> : null}

            <div className="gym-inquiry-step-actions">
              {inquiryStep > 1 ? (
                <button
                  type="button"
                  className="gym-inquiry-step-back"
                  onClick={handleInquiryBack}
                >
                  이전
                </button>
              ) : (
                <span />
              )}
              {inquiryStep < INQUIRY_STEP_TOTAL ? (
                <button
                  type="button"
                  className="gym-inquiry-submit"
                  onClick={handleInquiryNext}
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  className="gym-inquiry-submit"
                  disabled={submitting || !privacyAgreed}
                >
                  {submitting
                    ? "보내는 중..."
                    : isExchangeProposal
                      ? "교류 제안 보내기"
                      : kindMeta.submitLabel}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
