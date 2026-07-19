import { useEffect, useMemo, useState } from "react";
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
import { getDojoApiInfo } from "../../api/dojoApi";

const DEFAULT_FORM = {
  weightClass: "라이트급",
  experience: "1년차",
  style: "미디엄",
  area: "",
  note: "",
  contact: "",
  active: false,
};

export default function SparringPartnerPanel({ onGoBack }) {
  const { profile, userId, logs } = useTraining();
  const fighterLevel = useMemo(() => getFighterProgress(logs).level, [logs]);
  const profileDefaults = buildListingFromProfile(profile, {
    active: false,
    fighterLevel,
  });
  const existingListing = getMyListing(userId);
  const apiInfo = getDojoApiInfo();

  const [saved, setSaved] = useState(existingListing);
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...profileDefaults,
    ...existingListing,
    area: existingListing?.area || profileDefaults.area || "",
    note: existingListing?.note || profileDefaults.note || "",
    contact: existingListing?.contact || profileDefaults.contact || "",
  });
  const [weightFilter, setWeightFilter] = useState("전체");
  const [partners, setPartners] = useState([]);
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");

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
        { fighterLevel },
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
    window.setTimeout(() => setNotice(""), 2000);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildListingPayload(overrides = {}) {
    return {
      nickname: profile.nickname || "나",
      weightClass: form.weightClass,
      experience: form.experience,
      style: form.style,
      area: form.area.trim(),
      note: form.note.trim(),
      contact: form.contact.trim(),
      heightCm: profile.heightCm || null,
      weightKg: profile.weightKg || null,
      reachCm: profile.reachCm || null,
      fighterLevel,
      active: true,
      distanceKm: 0,
      ...overrides,
    };
  }

  function handleSave() {
    const listing = saveMyListing(buildListingPayload(), userId);
    setSaved(listing);
    if (position) {
      loadPartners({ preferGps: position.source === "gps", allowFallback: true });
    }
    showNotice("스파링 모집글이 등록되었습니다.");
  }

  function handleToggleActive() {
    const isActive = form.active || saved?.active;

    if (isActive) {
      clearMyListing(userId);
      setSaved(null);
      setForm((current) => ({ ...current, active: false }));
      if (position) {
        loadPartners({ preferGps: position.source === "gps", allowFallback: true });
      }
      showNotice("모집을 종료했습니다.");
      return;
    }

    const listing = saveMyListing(buildListingPayload(), userId);
    setSaved(listing);
    setForm((current) => ({ ...current, active: true }));
    if (position) {
      loadPartners({ preferGps: position.source === "gps", allowFallback: true });
    }
    showNotice("스파링 모집글이 등록되었습니다.");
  }

  return (
    <>
      <button className="category-back dojo-sub-back" type="button" onClick={onGoBack}>
        <span>←</span> 도장깨기
      </button>

      <section className="gym-panel sparring-register-panel">
        <div className="gym-panel-heading">
          <div>
            <p className="home-section-label">MY LISTING</p>
            <h2>내 스파링 모집</h2>
          </div>
          <button
            type="button"
            className={`gym-refresh-button sparring-toggle${form.active || saved?.active ? " active" : ""}`}
            onClick={handleToggleActive}
          >
            {form.active || saved?.active ? "모집 중" : "모집 시작"}
          </button>
        </div>

        <p className="gym-location-note">
          링네임: {profile.nickname || "나"}
          {profile.heightCm && profile.weightKg
            ? ` · ${profile.heightCm}cm / ${profile.weightKg}kg`
            : ""}
          {profile.reachCm ? ` · 리치 ${profile.reachCm}cm` : ""}
          {" · "}LV. {fighterLevel}
          {" · "}데이터: {apiInfo.baseUrl}
        </p>

        {hasSparringPriority(fighterLevel) ? (
          <p className="sparring-priority-note">
            프로 베테랑 혜택 적용 중 · 상대 찾기 목록에서 거리 가산으로 우선 노출됩니다
          </p>
        ) : (
          <p className="sparring-priority-note is-locked">
            LV.{SPARRING_PRIORITY_LEVEL} 프로 인증부터 스파링 우선 노출이 해금됩니다
          </p>
        )}

        <div className="sparring-form-grid">
          <label className="sparring-field">
            <span>체급</span>
            <select
              value={form.weightClass}
              onChange={(event) => updateField("weightClass", event.target.value)}
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
              onChange={(event) => updateField("experience", event.target.value)}
            >
              {EXPERIENCE_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="sparring-field">
            <span>스파링 강도</span>
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

          <label className="sparring-field">
            <span>활동 지역</span>
            <input
              type="text"
              value={form.area}
              onChange={(event) => updateField("area", event.target.value)}
              placeholder="예: 강남, 홍대, 잠실"
            />
          </label>

          <label className="sparring-field sparring-field-wide">
            <span>한 줄 소개</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="원하는 시간, 스파링 스타일 등"
            />
          </label>

          <label className="sparring-field sparring-field-wide">
            <span>연락 방법</span>
            <input
              type="text"
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
              placeholder="인스타 ID, 오픈채팅 링크 등"
            />
          </label>
        </div>

        <button type="button" className="sparring-save-button" onClick={handleSave}>
          정보 저장
        </button>
      </section>

      <section className="gym-panel">
        <div className="gym-panel-heading">
          <div>
            <p className="home-section-label">SPARRING PARTNERS</p>
            <h2>스파링 상대 찾기</h2>
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
            {status === "loading" ? "검색 중" : "다시 검색"}
          </button>
        </div>

        {position && (
          <p className="gym-location-note">검색 위치: {position.label}</p>
        )}

        <p className="sparring-priority-note subtle">
          베테랑 파이터는 실제 거리보다 가깝게 계산되어 목록 상위에 표시됩니다
        </p>

        <div className="sparring-filter-row">
          <label className="sparring-field sparring-filter">
            <span>체급 필터</span>
            <select
              value={weightFilter}
              onChange={(event) => setWeightFilter(event.target.value)}
            >
              <option value="전체">전체</option>
              {WEIGHT_CLASSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === "loading" && (
          <div className="gym-state-card">주변 스파링 상대를 찾는 중...</div>
        )}

        {status === "error" && (
          <div className="gym-state-card error">
            <strong>목록을 불러오지 못했습니다</strong>
            <p>{notice}</p>
          </div>
        )}

        {status === "empty" && (
          <div className="gym-state-card">
            <strong>조건에 맞는 상대가 없습니다</strong>
            <p>체급 필터를 바꾸거나 직접 모집글을 등록해 보세요.</p>
          </div>
        )}

        {status === "ready" && (
          <div className="sparring-partner-list">
            {partners.map((partner) => (
              <article
                className={`sparring-partner-card${partner.isMine ? " mine" : ""}${partner.hasSparringPriority ? " is-veteran" : ""}`}
                key={partner.id}
              >
                <div className="sparring-partner-head">
                  <div>
                    <strong>{partner.nickname}</strong>
                    {partner.isMine && <em>내 글</em>}
                    {partner.veteranBadges?.length > 0 ? (
                      <div className="sparring-partner-veteran-badges">
                        {partner.veteranBadges.map((badge) => (
                          <span key={badge}>{badge}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span>{partner.distanceLabel}</span>
                </div>

                <div className="sparring-partner-tags">
                  <span>{partner.weightClass}</span>
                  <span>{partner.experience}</span>
                  <span>{partner.style}</span>
                  {partner.area && <span>{partner.area}</span>}
                </div>

                {partner.note && <p className="sparring-partner-note">{partner.note}</p>}

                {partner.hasSparringPriority ? (
                  <p className="sparring-partner-priority">
                    베테랑 우선 노출 · LV. {partner.fighterLevel}
                  </p>
                ) : null}

                {partner.contact && (
                  <p className="sparring-partner-contact">연락: {partner.contact}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {notice && status !== "error" && (
        <div className="category-notice" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
