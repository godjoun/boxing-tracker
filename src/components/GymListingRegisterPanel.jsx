import { useState } from "react";
import { track } from "@vercel/analytics";
import {
  hasGymListingRemote,
  submitGymListingAsync,
} from "../utils/gymListing";

function buildEmptyForm() {
  return {
    gymName: "",
    ownerName: "",
    phone: "",
    address: "",
    addressDetail: "",
    areaLabel: "",
    dayPassWon: "",
    monthPassWon: "",
    rentalHourWon: "",
    intro: "",
  };
}

export default function GymListingRegisterPanel({
  userId,
  nickname = "",
  onClose,
}) {
  const [form, setForm] = useState(buildEmptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [synced, setSynced] = useState(false);

  const remoteReady = hasGymListingRemote();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await submitGymListingAsync(form, { userId, nickname });
      if (!result.ok) {
        setError(result.message || "입력을 확인해 주세요.");
        return;
      }

      track("gym_listing_submit", {
        synced: result.synced,
        hasDay: Boolean(result.listing?.dayPassWon),
        hasMonth: Boolean(result.listing?.monthPassWon),
        hasRental: Boolean(result.listing?.rentalHourWon),
      });

      setSynced(Boolean(result.synced));
      setDone(true);
    } catch {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="gym-listing-panel" aria-label="등록 완료">
        <button type="button" className="gym-listing-back" onClick={onClose}>
          ← 목록으로
        </button>

        <div className="gym-listing-done">
          <p className="gym-listing-kicker">LISTING RECEIVED</p>
          <h2>{synced ? "등록 신청이 도착했습니다" : "등록 신청을 접수했습니다"}</h2>
          <p className="gym-listing-done-lead">
            {synced
              ? "운영에서 확인한 뒤, 검색 목록에 올릴 수 있습니다. 승인이 끝나면 노출됩니다."
              : "이 기기에 저장했습니다. 서버 연결 후 다시 보내 주시면 장부에 쌓입니다."}
          </p>
          <ul className="gym-listing-done-points">
            <li>지금은 바로 공개되지 않습니다.</li>
            <li>사업자·네이버 플레이스 검증은 다음 단계에서 붙습니다.</li>
            <li>복서는 무료, 체육관이 손님을 위해 입점합니다.</li>
          </ul>
          {!synced && remoteReady ? (
            <p className="gym-listing-sync-hint">
              Supabase에서 dojo_gym_listings.sql 실행이 필요할 수 있어요.
            </p>
          ) : null}
          <button type="button" className="gym-listing-submit" onClick={onClose}>
            확인
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="gym-listing-panel" aria-label="체육관 등록">
      <button type="button" className="gym-listing-back" onClick={onClose}>
        ← 목록으로
      </button>

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">GYM LISTING</p>
        <h2>내 체육관 등록</h2>
        <p>
          운영 중인 관을 올리고, 복서의 문의·체험·대여를 받습니다.
          승인 후 검색에 노출됩니다.
        </p>
      </header>

      <form className="gym-listing-form" onSubmit={handleSubmit}>
        <fieldset className="gym-listing-block">
          <legend>장소</legend>
          <label className="gym-inquiry-field">
            <span>체육관 이름 *</span>
            <input
              type="text"
              value={form.gymName}
              onChange={(event) => updateField("gymName", event.target.value)}
              placeholder="예: 역삼 챔피언 복싱클럽"
              maxLength={40}
              autoComplete="organization"
            />
          </label>
          <label className="gym-inquiry-field">
            <span>주소 *</span>
            <input
              type="text"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="예: 서울 강남구 역삼동 ○○"
              autoComplete="street-address"
            />
          </label>
          <label className="gym-inquiry-field">
            <span>상세 주소</span>
            <input
              type="text"
              value={form.addressDetail}
              onChange={(event) =>
                updateField("addressDetail", event.target.value)
              }
              placeholder="예: 3층 링홀"
            />
          </label>
          <label className="gym-inquiry-field">
            <span>지역 표시</span>
            <input
              type="text"
              value={form.areaLabel}
              onChange={(event) => updateField("areaLabel", event.target.value)}
              placeholder="예: 강남 · 역삼"
            />
          </label>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>연락</legend>
          <label className="gym-inquiry-field">
            <span>담당자(대표) *</span>
            <input
              type="text"
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              placeholder="이름"
              autoComplete="name"
            />
          </label>
          <label className="gym-inquiry-field">
            <span>전화번호 *</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="010-0000-0000"
              autoComplete="tel"
            />
          </label>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>가격 (선택 · 원)</legend>
          <p className="gym-listing-block-note">
            비워 두면 카드에 「문의」로 표시됩니다.
          </p>
          <div className="gym-listing-price-row">
            <label className="gym-inquiry-field">
              <span>일일권</span>
              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={form.dayPassWon}
                onChange={(event) =>
                  updateField("dayPassWon", event.target.value)
                }
                placeholder="20000"
              />
            </label>
            <label className="gym-inquiry-field">
              <span>한달권</span>
              <input
                type="number"
                min="0"
                step="10000"
                inputMode="numeric"
                value={form.monthPassWon}
                onChange={(event) =>
                  updateField("monthPassWon", event.target.value)
                }
                placeholder="180000"
              />
            </label>
            <label className="gym-inquiry-field">
              <span>대여/시간</span>
              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={form.rentalHourWon}
                onChange={(event) =>
                  updateField("rentalHourWon", event.target.value)
                }
                placeholder="50000"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>한 줄</legend>
          <label className="gym-inquiry-field">
            <span>소개</span>
            <textarea
              value={form.intro}
              onChange={(event) => updateField("intro", event.target.value)}
              placeholder="오늘도 벨은 울린다. 관 분위기·프로그램 한 줄."
              rows={3}
              maxLength={200}
            />
          </label>
        </fieldset>

        {error ? <p className="gym-inquiry-error">{error}</p> : null}

        <button
          type="submit"
          className="gym-listing-submit"
          disabled={submitting}
        >
          {submitting ? "보내는 중..." : "등록 신청하기"}
        </button>

        <p className="gym-listing-foot">
          신청만 접수됩니다. 승인·과금·사업자 확인은 다음 단계에서 연결합니다.
        </p>
      </form>
    </section>
  );
}
