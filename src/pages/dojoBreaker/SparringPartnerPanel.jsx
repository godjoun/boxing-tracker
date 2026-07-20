import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../../store/TrainingContext";
import { resolveSearchLocation } from "../../utils/gymSearch";
import { getFighterProgress } from "../../utils/fighterProgress";
import {
  hasSparringPriority,
  SPARRING_PRIORITY_LEVEL,
} from "../../utils/veteranPerks";
import {
  buildListingFromProfile,
  clearMyListing,
  EXPERIENCE_LEVELS,
  getAvailablePartners,
  getMyListing,
  saveMyListing,
  SPARRING_STYLES,
  WEIGHT_CLASSES,
} from "../../utils/sparringPartners";
import {
  cancelSparringInterest,
  hasSparringInterest,
  sendSparringInterest,
} from "../../utils/sparringInterest";
import SparringPartnerCard from "./SparringPartnerCard";

const DEFAULT_FORM = {
  weightClass: "라이트급",
  experience: "1년차",
  style: "미디엄",
  area: "",
  note: "",
  meetWhen: "",
  active: false,
};

export default function SparringPartnerPanel({ onGoBack, embedded = false }) {
  const { profile, userId, logs } = useTraining();
  const fighterLevel = useMemo(() => getFighterProgress(logs).level, [logs]);
  const profileDefaults = buildListingFromProfile(profile, {
    active: false,
    fighterLevel,
  });
  const existingListing = getMyListing(userId);
  const isLooking = Boolean(existingListing?.active);

  const [saved, setSaved] = useState(existingListing);
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...profileDefaults,
    ...existingListing,
    area: existingListing?.area || profileDefaults.area || "",
    note: existingListing?.note || profileDefaults.note || "",
    meetWhen: existingListing?.meetWhen || "",
  });
  const [profileOpen, setProfileOpen] = useState(!isLooking);
  const [formError, setFormError] = useState("");
  const [weightFilter, setWeightFilter] = useState("전체");
  const [partners, setPartners] = useState([]);
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [interestTick, setInterestTick] = useState(0);

  const looking = Boolean(form.active || saved?.active);

  async function loadPartners(options = {}) {
    const { preferGps = false, preset = null, allowFallback = true } = options;

    setStatus("loading");

    try {
      const currentPosition = await resolveSearchLocation({
        preferGps,
        preset,
        allowFallback,
      });
      setPosition(currentPosition);

      const results = await getAvailablePartners(
        currentPosition.lat,
        currentPosition.lon,
        { weightClass: weightFilter },
        userId,
        { fighterLevel }
      );
      setPartners(results);
      setStatus(results.length > 0 ? "ready" : "empty");
    } catch (error) {
      setPartners([]);
      setStatus("error");
      setNotice(error.message || "상대 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    loadPartners({ preferGps: true, allowFallback: true });
  }, []);

  useEffect(() => {
    if (!position) return;
    loadPartners({
      preferGps: position.source === "gps",
      preset: null,
      allowFallback: true,
    });
  }, [weightFilter]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  /** 공개 필수: 지역·희망 시간만 (연락처 비공개 — 당근/플랩 패턴) */
  function validateRequired() {
    if (!form.area.trim()) {
      setFormError("희망 지역은 필수입니다.");
      return false;
    }
    if (!form.meetWhen.trim()) {
      setFormError("희망 시간은 필수입니다.");
      return false;
    }
    return true;
  }

  function buildListingPayload(overrides = {}) {
    return {
      nickname: profile.nickname || "나",
      weightClass: form.weightClass,
      experience: form.experience,
      style: form.style,
      area: form.area.trim(),
      note: form.note.trim(),
      meetWhen: form.meetWhen.trim(),
      contact: "",
      heightCm: profile.heightCm || null,
      weightKg: profile.weightKg || null,
      reachCm: profile.reachCm || null,
      fighterLevel,
      active: true,
      distanceKm: 0,
      ...overrides,
    };
  }

  function handleSaveDetails() {
    if (!validateRequired()) return;

    const listing = saveMyListing(
      buildListingPayload({ active: looking }),
      userId
    );
    setSaved(listing);
    setForm((current) => ({ ...current, active: looking }));
    if (position) {
      loadPartners({ preferGps: position.source === "gps", allowFallback: true });
    }
    showNotice("프로필을 저장했습니다.");
    setProfileOpen(false);
  }

  function handleToggleLooking() {
    if (looking) {
      clearMyListing(userId);
      setSaved(null);
      setForm((current) => ({ ...current, active: false }));
      if (position) {
        loadPartners({ preferGps: position.source === "gps", allowFallback: true });
      }
      showNotice("찾는 중을 껐습니다.");
      return;
    }

    if (!validateRequired()) return;

    const listing = saveMyListing(buildListingPayload(), userId);
    setSaved(listing);
    setForm((current) => ({ ...current, active: true }));
    setProfileOpen(false);
    if (position) {
      loadPartners({ preferGps: position.source === "gps", allowFallback: true });
    }
    showNotice("찾는 중으로 공개됐습니다.");
  }

  function handleChatRequest(partner) {
    if (partner.isMine) return;

    if (hasSparringInterest(partner.id, userId)) {
      cancelSparringInterest(partner.id, userId);
      track("sparring_chat_request_cancel", { partnerId: partner.id });
      setInterestTick((value) => value + 1);
      showNotice("대화 요청을 취소했습니다.");
      return;
    }

    sendSparringInterest(partner, {
      userId,
      nickname: profile.nickname || "나",
    });
    track("sparring_chat_request", { partnerId: partner.id });
    setInterestTick((value) => value + 1);
    showNotice("요청 저장됨 · 상대 알림은 곧 연결됩니다.");
  }

  const summaryLine = [
    form.weightClass,
    form.style,
    form.area.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

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
          <h1>라이벌 찾기</h1>
          <p className="gym-search-context">
            1:1 스파링 상대를 찾고, 대화 요청을 보내요.
          </p>
        </header>
      ) : null}

      <section
        className={`sparring-hero${looking ? " is-on" : ""}`}
        aria-label="찾는 중"
      >
        <div className="sparring-hero-top">
          <div>
            <p className="sparring-hero-kicker">LOOKING</p>
            <strong>{looking ? "찾는 중" : "대기 중"}</strong>
            <p>
              {looking
                ? "근처 목록에 공개됩니다."
                : "지역·희망 시간을 채운 뒤 켜세요."}
            </p>
          </div>
          <button
            type="button"
            className={`sparring-hero-toggle${looking ? " is-on" : ""}`}
            onClick={handleToggleLooking}
          >
            {looking ? "끄기" : "켜기"}
          </button>
        </div>

        <div className="sparring-required">
          <label className="sparring-required-field">
            <span>희망 지역 *</span>
            <input
              type="text"
              value={form.area}
              onChange={(event) => updateField("area", event.target.value)}
              placeholder="예: 강남 · 홍대 · 잠실"
              autoComplete="off"
            />
          </label>
          <label className="sparring-required-field">
            <span>희망 시간 *</span>
            <input
              type="text"
              value={form.meetWhen}
              onChange={(event) => updateField("meetWhen", event.target.value)}
              placeholder="예: 토 오후 · 평일 저녁"
              autoComplete="off"
            />
          </label>
        </div>

        {formError ? <p className="sparring-form-error">{formError}</p> : null}
      </section>

      <section className="sparring-me" aria-label="내 프로필">
        <button
          type="button"
          className="sparring-me-summary"
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
        >
          <div className="sparring-me-identity">
            <span className="sparring-me-mark" aria-hidden="true">
              {(profile.nickname || "나").slice(0, 1)}
            </span>
            <div>
              <strong>{profile.nickname || "나"}</strong>
              <p>
                {summaryLine || "체급·강도·지역을 설정하세요"}
                {` · LV.${fighterLevel}`}
              </p>
            </div>
          </div>
          <em>{profileOpen ? "접기" : "펼치기"}</em>
        </button>

        {profileOpen ? (
          <div className="sparring-me-body">
            {hasSparringPriority(fighterLevel) ? (
              <p className="sparring-priority-note">
                프로 베테랑 · 목록에서 우선 노출
              </p>
            ) : (
              <p className="sparring-priority-note is-locked">
                LV.{SPARRING_PRIORITY_LEVEL}부터 우선 노출
              </p>
            )}

            <div className="sparring-form-grid">
              <label className="sparring-field">
                <span>체급</span>
                <select
                  value={form.weightClass}
                  onChange={(event) =>
                    updateField("weightClass", event.target.value)
                  }
                >
                  {WEIGHT_CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sparring-field">
                <span>경력</span>
                <select
                  value={form.experience}
                  onChange={(event) =>
                    updateField("experience", event.target.value)
                  }
                >
                  {EXPERIENCE_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sparring-field">
                <span>강도</span>
                <select
                  value={form.style}
                  onChange={(event) => updateField("style", event.target.value)}
                >
                  {SPARRING_STYLES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sparring-field sparring-field-wide">
                <span>한 줄 (선택)</span>
                <input
                  type="text"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="헤드기어 필수, 라이트만 등"
                />
              </label>
            </div>

            <button
              type="button"
              className="sparring-save-button"
              onClick={handleSaveDetails}
            >
              프로필 저장
            </button>
          </div>
        ) : null}
      </section>

      <section className="sparring-feed" aria-label="근처 상대">
        <div className="sparring-feed-head">
          <div>
            <p className="home-section-label">NEARBY</p>
            <h2>근처 상대</h2>
          </div>
          <button
            type="button"
            className="gym-refresh-button"
            onClick={() =>
              loadPartners({
                preferGps: position?.source === "gps",
                allowFallback: true,
              })
            }
            disabled={status === "loading"}
          >
            {status === "loading" ? "검색 중" : "다시"}
          </button>
        </div>

        {position ? (
          <p className="gym-location-note">{position.label}</p>
        ) : null}

        <div className="sparring-weight-chips" role="group" aria-label="체급 필터">
          <button
            type="button"
            className={`gym-preset-chip${
              weightFilter === "전체" ? " is-active" : ""
            }`}
            onClick={() => setWeightFilter("전체")}
          >
            전체
          </button>
          {WEIGHT_CLASSES.map((item) => (
            <button
              key={item}
              type="button"
              className={`gym-preset-chip${
                weightFilter === item ? " is-active" : ""
              }`}
              onClick={() => setWeightFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <div className="gym-state-card">근처 상대를 찾는 중...</div>
        ) : null}

        {status === "error" ? (
          <div className="gym-state-card error">
            <strong>목록을 불러오지 못했습니다</strong>
            <p>{notice}</p>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="gym-state-card">
            <strong>조건에 맞는 상대가 없습니다</strong>
            <p>체급을 바꾸거나 찾는 중을 켜 보세요.</p>
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="sparring-partner-list" key={interestTick}>
            {partners.map((partner) => (
              <SparringPartnerCard
                key={partner.id}
                partner={partner}
                userId={userId}
                onChatRequest={handleChatRequest}
              />
            ))}
          </div>
        ) : null}
      </section>

      {notice && status !== "error" ? (
        <div className="category-notice" role="status">
          {notice}
        </div>
      ) : null}
    </>
  );
}
