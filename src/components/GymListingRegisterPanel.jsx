import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  hasGymListingRemote,
  MAX_GYM_PHOTOS,
  normalizeGymPhotoUrls,
  submitGymListingAsync,
  updateGymListingAsync,
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
    photoUrl: "",
    photoUrls: [],
  };
}

function listingToForm(listing) {
  if (!listing) return buildEmptyForm();
  const photoUrls = normalizeGymPhotoUrls(listing);
  return {
    gymName: listing.gymName || "",
    ownerName: listing.ownerName || "",
    phone: listing.phone || "",
    address: listing.address || "",
    addressDetail: listing.addressDetail || "",
    areaLabel: listing.areaLabel || "",
    dayPassWon:
      listing.dayPassWon === null || listing.dayPassWon === undefined
        ? ""
        : String(listing.dayPassWon),
    monthPassWon:
      listing.monthPassWon === null || listing.monthPassWon === undefined
        ? ""
        : String(listing.monthPassWon),
    rentalHourWon:
      listing.rentalHourWon === null || listing.rentalHourWon === undefined
        ? ""
        : String(listing.rentalHourWon),
    intro: listing.intro || "",
    photoUrl: photoUrls[0] || "",
    photoUrls,
  };
}

export default function GymListingRegisterPanel({
  userId,
  nickname = "",
  initialListing = null,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(initialListing?.id);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const [form, setForm] = useState(() => listingToForm(initialListing));
  const [pendingFiles, setPendingFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(() =>
    normalizeGymPhotoUrls(initialListing)
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const remoteReady = hasGymListingRemote();
  const title = useMemo(
    () => (isEdit ? "체육관 정보 수정" : "내 체육관 등록"),
    [isEdit]
  );
  const canAddMore = previewUrls.length < MAX_GYM_PHOTOS;

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyPhotoFiles(fileList) {
    const incoming = Array.from(fileList || []).filter((file) =>
      file.type?.startsWith("image/")
    );
    if (incoming.length === 0) {
      setError("이미지 파일만 올릴 수 있습니다.");
      return;
    }

    const room = MAX_GYM_PHOTOS - previewUrls.length;
    if (room <= 0) {
      setError(`사진은 최대 ${MAX_GYM_PHOTOS}장까지입니다.`);
      return;
    }

    const nextFiles = incoming.slice(0, room);
    const nextObjectUrls = nextFiles.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      return url;
    });

    setPendingFiles((current) => [...current, ...nextFiles]);
    setPreviewUrls((current) => [...current, ...nextObjectUrls]);
    setError("");
  }

  function handlePhotoChange(event) {
    applyPhotoFiles(event.target.files);
    event.target.value = "";
  }

  function removePhotoAt(index) {
    const target = previewUrls[index];
    if (!target) return;

    if (target.startsWith("blob:")) {
      URL.revokeObjectURL(target);
      objectUrlsRef.current = objectUrlsRef.current.filter(
        (url) => url !== target
      );
      let blobIndex = 0;
      for (let i = 0; i < index; i += 1) {
        if (previewUrls[i]?.startsWith("blob:")) blobIndex += 1;
      }
      setPendingFiles((current) =>
        current.filter((_, fileIndex) => fileIndex !== blobIndex)
      );
    }

    const nextPreviews = previewUrls.filter((_, i) => i !== index);
    const savedUrls = nextPreviews.filter((url) => !url.startsWith("blob:"));
    setPreviewUrls(nextPreviews);
    setForm((current) => ({
      ...current,
      photoUrls: savedUrls,
      photoUrl: savedUrls[0] || "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    const savedUrls = previewUrls.filter((url) => !url.startsWith("blob:"));
    const payloadForm = {
      ...form,
      photoUrls: savedUrls,
      photoUrl: savedUrls[0] || "",
    };

    try {
      const result = isEdit
        ? await updateGymListingAsync(initialListing.id, payloadForm, {
            userId,
            nickname,
            photoFiles: pendingFiles,
            existing: initialListing,
          })
        : await submitGymListingAsync(payloadForm, {
            userId,
            nickname,
            photoFiles: pendingFiles,
          });

      if (!result.ok) {
        setError(result.message || "입력을 확인해 주세요.");
        return;
      }

      track(isEdit ? "gym_listing_update" : "gym_listing_submit", {
        synced: result.synced,
        photoCount: result.listing?.photoUrls?.length || 0,
        hasPhoto: Boolean(result.listing?.photoUrl),
        hasDay: Boolean(result.listing?.dayPassWon),
        hasMonth: Boolean(result.listing?.monthPassWon),
        hasRental: Boolean(result.listing?.rentalHourWon),
      });

      setSynced(Boolean(result.synced));
      setSyncMessage(result.syncMessage || "");
      setDone(true);
      onSaved?.(result.listing);
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
          <p className="gym-listing-kicker">
            {isEdit ? "LISTING UPDATED" : "LISTING RECEIVED"}
          </p>
          <h2>
            {isEdit
              ? synced
                ? "수정이 반영되었습니다"
                : "이 기기에 수정했습니다"
              : synced
                ? "등록 신청이 도착했습니다"
                : "등록 신청을 접수했습니다"}
          </h2>
          <p className="gym-listing-done-lead">
            {isEdit
              ? synced
                ? "승인된 관이면 검색에도 곧바로 반영됩니다."
                : "서버 연결 후 다시 저장하면 장부에 맞춰집니다."
              : synced
                ? "운영에서 확인한 뒤, 검색 목록에 올릴 수 있습니다. 승인이 끝나면 노출됩니다."
                : "이 기기에 저장했습니다. 서버 연결 후 다시 보내 주시면 장부에 쌓입니다."}
          </p>
          {syncMessage ? (
            <p className="gym-listing-sync-hint">{syncMessage}</p>
          ) : null}
          {!synced && !syncMessage ? (
            <p className="gym-listing-sync-hint">
              {remoteReady
                ? "서버에 안 올라갔습니다. 내 등록 관리에서 「서버로 다시 보내기」를 눌러 보세요."
                : "서버 연결(VITE_SUPABASE)이 없습니다."}
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
    <section className="gym-listing-panel" aria-label={title}>
      <button type="button" className="gym-listing-back" onClick={onClose}>
        ← 목록으로
      </button>

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">GYM LISTING</p>
        <h2>{title}</h2>
        <p>
          {isEdit
            ? "간판·시설 사진을 올리고 이름·가격·소개를 고칩니다."
            : "간판·시설 사진을 올리고, 복서의 문의·체험·대여를 받습니다."}
        </p>
      </header>

      <form className="gym-listing-form" onSubmit={handleSubmit}>
        <fieldset className="gym-listing-block">
          <legend>사진 (최대 {MAX_GYM_PHOTOS}장)</legend>
          <p className="gym-listing-block-note">
            <strong>첫 장(대표)은 복싱장 간판 사진</strong>을 올려 주세요.
            검색·상세 배너에 크게 보입니다. 2~5장은 링·샤워·대기실 등 시설
            사진이면 좋습니다.
          </p>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="gym-listing-file-input"
            tabIndex={-1}
            aria-hidden="true"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="gym-listing-file-input"
            tabIndex={-1}
            aria-hidden="true"
          />

          {previewUrls.length > 0 ? (
            <ul className="gym-listing-photo-grid">
              {previewUrls.map((url, index) => (
                <li key={`${url}-${index}`} className="gym-listing-photo-slot">
                  <img src={url} alt="" />
                  {index === 0 ? (
                    <span className="gym-listing-photo-cover">간판 · 대표</span>
                  ) : null}
                  <button
                    type="button"
                    className="gym-listing-photo-remove"
                    onClick={() => removePhotoAt(index)}
                    aria-label={`${index + 1}번째 사진 삭제`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="gym-listing-photo-empty" aria-hidden="true">
              첫 장은 복싱장 간판 사진을 추천합니다
            </div>
          )}

          <div className="gym-listing-photo-actions">
            <button
              type="button"
              className="gym-listing-photo-button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={!canAddMore}
            >
              사진에서 선택
            </button>
            <button
              type="button"
              className="gym-listing-photo-button is-camera"
              onClick={() => cameraInputRef.current?.click()}
              disabled={!canAddMore}
            >
              카메라로 촬영
            </button>
          </div>
          <p className="gym-listing-block-note">
            {previewUrls.length}/{MAX_GYM_PHOTOS}장
            {!remoteReady
              ? " · 서버 연결 전에는 사진이 검색에 안 올라갈 수 있어요"
              : ""}
          </p>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>장소</legend>
          <label className="gym-inquiry-field">
            <span>체육관 이름 *</span>
            <input
              value={form.gymName}
              onChange={(event) => updateField("gymName", event.target.value)}
              maxLength={40}
              required
            />
          </label>
          <label className="gym-inquiry-field">
            <span>주소 *</span>
            <input
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              required
            />
          </label>
          <label className="gym-inquiry-field">
            <span>상세 주소</span>
            <input
              value={form.addressDetail}
              onChange={(event) =>
                updateField("addressDetail", event.target.value)
              }
              placeholder="예: 3층 링홀"
            />
          </label>
          <label className="gym-inquiry-field">
            <span>지역 라벨</span>
            <input
              value={form.areaLabel}
              onChange={(event) => updateField("areaLabel", event.target.value)}
              placeholder="예: 강남, 홍대"
            />
          </label>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>연락</legend>
          <label className="gym-inquiry-field">
            <span>담당자 *</span>
            <input
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              required
            />
          </label>
          <label className="gym-inquiry-field">
            <span>전화 *</span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              inputMode="tel"
              required
            />
          </label>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>가격 (선택)</legend>
          <div className="gym-listing-price-row">
            <label className="gym-inquiry-field">
              <span>일일권</span>
              <input
                value={form.dayPassWon}
                onChange={(event) =>
                  updateField("dayPassWon", event.target.value)
                }
                inputMode="numeric"
              />
            </label>
            <label className="gym-inquiry-field">
              <span>한달권</span>
              <input
                value={form.monthPassWon}
                onChange={(event) =>
                  updateField("monthPassWon", event.target.value)
                }
                inputMode="numeric"
              />
            </label>
            <label className="gym-inquiry-field">
              <span>대여/시간</span>
              <input
                value={form.rentalHourWon}
                onChange={(event) =>
                  updateField("rentalHourWon", event.target.value)
                }
                inputMode="numeric"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="gym-listing-block">
          <legend>소개</legend>
          <label className="gym-inquiry-field">
            <span>한 줄 소개</span>
            <textarea
              value={form.intro}
              onChange={(event) => updateField("intro", event.target.value)}
              maxLength={200}
              rows={3}
            />
          </label>
        </fieldset>

        {error ? <p className="gym-inquiry-error">{error}</p> : null}

        <button
          type="submit"
          className="gym-listing-submit"
          disabled={submitting}
        >
          {submitting
            ? "보내는 중..."
            : isEdit
              ? "수정 저장"
              : "등록 신청하기"}
        </button>

        <p className="gym-listing-foot">
          {isEdit
            ? "삭제는 「내 등록 관리」에서 할 수 있습니다."
            : "신청만 접수됩니다. 승인·과금·사업자 확인은 다음 단계에서 연결합니다."}
        </p>
      </form>
    </section>
  );
}
