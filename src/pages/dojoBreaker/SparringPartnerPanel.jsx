import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../../store/TrainingContext";
import { getFighterProgress } from "../../utils/fighterProgress";
import { resolveDojoActorId } from "../../api/dojoExchangeApi";
import {
  cancelRemoteSparringInterest,
  deleteRemoteSparringProfile,
  fetchMySparringProfile,
  fetchRemoteSparringInterests,
  fetchSparringProfiles,
  hasSparringPartnerRemote,
  saveRemoteSparringProfile,
  sendRemoteSparringInterest,
} from "../../api/sparringPartnerApi";
import {
  hasSparringPriority,
  SPARRING_PRIORITY_LEVEL,
} from "../../utils/veteranPerks";
import {
  buildListingFromProfile,
  clearMyListing,
  EXPERIENCE_LEVELS,
  getMyListing,
  saveMyListing,
  SPARRING_STYLES,
  WEIGHT_CLASSES,
} from "../../utils/sparringPartners";
import { getMatchedSparringProfileIds } from "../../utils/sparringInterest";
import SparringChatModal from "../../components/SparringChatModal";
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

export default function SparringPartnerPanel({
  onGoBack,
  embedded = false,
  onPartnersChange,
}) {
  const { profile, userId, logs } = useTraining();
  const fighterLevel = useMemo(() => getFighterProgress(logs).level, [logs]);
  const actorId = useMemo(() => resolveDojoActorId(userId), [userId]);
  const remoteReady = hasSparringPartnerRemote();
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
    area: existingListing?.area || profileDefaults.area || DEFAULT_FORM.area,
    note: existingListing?.note || profileDefaults.note || "",
    meetWhen: existingListing?.meetWhen || "",
  });
  const [profileOpen, setProfileOpen] = useState(!isLooking);
  const [formError, setFormError] = useState("");
  const [weightFilter, setWeightFilter] = useState("전체");
  const [areaFilter, setAreaFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [partners, setPartners] = useState([]);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [interests, setInterests] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);

  const looking = Boolean(form.active || saved?.active);
  const sentInterests = useMemo(
    () => interests.filter((item) => item.direction === "sent"),
    [interests]
  );
  const receivedInterests = useMemo(
    () => interests.filter((item) => item.direction === "received"),
    [interests]
  );
  const requestedProfileIds = useMemo(
    () => new Set(sentInterests.map((item) => item.profile_id)),
    [sentInterests]
  );
  const matchedProfileIds = useMemo(
    () => new Set(getMatchedSparringProfileIds(interests)),
    [interests]
  );
  const displayInterests = useMemo(() => {
    const byProfile = new Map();
    interests.forEach((interest) => {
      const current = byProfile.get(interest.profile_id);
      if (!current || interest.direction === "received") {
        byProfile.set(interest.profile_id, interest);
      }
    });
    return [...byProfile.values()];
  }, [interests]);

  async function loadPartners(options = {}) {
    setStatus("loading");
    setNotice("");

    if (!remoteReady) {
      setPartners([]);
      onPartnersChange?.([]);
      setStatus("unavailable");
      return;
    }

    try {
      const results = await fetchSparringProfiles({
        actorId,
        weightClass: weightFilter,
        areaQuery: options.areaQuery ?? areaFilter,
        timeQuery: options.timeQuery ?? timeFilter,
      });

      if (!results) {
        setPartners([]);
        onPartnersChange?.([]);
        setStatus("unavailable");
        return;
      }
      setPartners(results);
      onPartnersChange?.(results);
      setStatus(results.length > 0 ? "ready" : "empty");
    } catch (error) {
      setPartners([]);
      onPartnersChange?.([]);
      setStatus("error");
      setNotice(error.message || "상대 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPartners();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Mount bootstrap only — loadPartners closes over current filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!remoteReady) return;

    const timeoutId = window.setTimeout(() => {
      loadPartners();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Weight-class filter refresh only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightFilter]);

  useEffect(() => {
    if (!remoteReady) return;

    async function loadMine() {
      const remoteProfile = await fetchMySparringProfile(actorId);
      if (!remoteProfile) return;

      setSaved(remoteProfile);
      setForm((current) => ({
        ...current,
        ...remoteProfile,
        active: remoteProfile.active,
      }));
      setProfileOpen(!remoteProfile.active);
    }

    loadMine();
  }, [actorId, remoteReady]);

  async function loadInterests() {
    if (!remoteReady) {
      setInterests([]);
      return;
    }
    const next = await fetchRemoteSparringInterests(actorId);
    setInterests(next || []);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInterests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Interest inbox follows actor/remote readiness only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId, remoteReady]);

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

  async function saveProfile(active = looking) {
    if (!validateRequired()) return;

    if (!remoteReady) {
      setFormError("실제 매칭을 위해 서버 연결이 필요합니다.");
      return;
    }

    const payload = buildListingPayload({ active });
    const savedRemotely = await saveRemoteSparringProfile({
      actorId,
      profile: payload,
    });
    if (!savedRemotely) {
      setFormError(
        "서버에 저장하지 못했습니다. Supabase에서 dojo_sparring_v1.sql 적용 여부를 확인해 주세요."
      );
      return;
    }

    const listing = saveMyListing(payload, userId);
    setSaved(listing);
    setForm((current) => ({ ...current, active }));
    await loadPartners();
    await loadInterests();
    return listing;
  }

  async function handleSaveDetails() {
    const listing = await saveProfile(looking);
    if (!listing) return;
    showNotice("공개 카드 정보를 저장했습니다.");
    setProfileOpen(false);
  }

  async function handleToggleLooking() {
    if (looking) {
      const listing = await saveProfile(false);
      if (!listing) return;
      setSaved(listing);
      setForm((current) => ({ ...current, active: false }));
      showNotice("내 공개 카드를 숨겼습니다.");
      return;
    }

    const listing = await saveProfile(true);
    if (!listing) return;
    setProfileOpen(false);
    showNotice("내 카드가 공개됐습니다. 맞는 상대에게 관심을 보내 보세요.");
  }

  async function handleDeleteProfile() {
    if (!window.confirm("공개 카드와 받은/보낸 관심 기록을 모두 삭제할까요?")) {
      return;
    }

    const deleted = await deleteRemoteSparringProfile(actorId);
    if (!deleted) {
      setFormError("카드를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    clearMyListing(userId);
    setSaved(null);
    setForm((current) => ({ ...current, active: false }));
    setProfileOpen(true);
    await loadPartners();
    await loadInterests();
    showNotice("공개 카드를 삭제했습니다.");
  }

  async function handleChatRequest(partner) {
    if (partner.isMine) return;

    if (matchedProfileIds.has(partner.id)) {
      setChatPartner(partner);
      return;
    }

    if (!looking) {
      showNotice("먼저 내 카드를 공개해야 관심을 보낼 수 있어요.");
      return;
    }

    const requested = requestedProfileIds.has(partner.id);
    const updated = requested
      ? await cancelRemoteSparringInterest({
          actorId,
          profileId: partner.id,
        })
      : await sendRemoteSparringInterest({
          actorId,
          profileId: partner.id,
        });

    if (!updated) {
      showNotice("관심 요청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    track(requested ? "sparring_interest_cancel" : "sparring_interest_send", {
      partnerId: partner.id,
    });
    await loadInterests();
    showNotice(
      requested
        ? "관심 요청을 취소했습니다."
        : "관심을 보냈습니다. 상대의 관심 목록에 표시됩니다."
    );
  }

  async function handleInterestAction(interest) {
    if (matchedProfileIds.has(interest.profile_id)) {
      setChatPartner({
        id: interest.profile_id,
        nickname: interest.nickname,
        weightClass: interest.weight_class,
        area: interest.area,
        meetWhen: interest.meet_when,
      });
      return;
    }

    if (interest.direction !== "received") return;
    const sent = await sendRemoteSparringInterest({
      actorId,
      profileId: interest.profile_id,
    });
    if (!sent) {
      showNotice("관심 요청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    await loadInterests();
    track("sparring_match_created", { partnerId: interest.profile_id });
    showNotice("서로 관심이 확인됐습니다. 이제 대화할 수 있어요.");
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
              ← 짐
            </button>
          ) : null}
          <h1>라이벌 찾기</h1>
          <p className="gym-search-context">
            체급·지역·희망 시간이 맞는 복서에게 관심을 보내요.
          </p>
        </header>
      ) : null}

      <section
        className={`sparring-hero${looking ? " is-on" : ""}`}
        aria-label="찾는 중"
      >
        <div className="sparring-hero-top">
          <div>
            <p className="sparring-hero-kicker">FIND YOUR RIVAL</p>
            <strong>{looking ? "찾는 중" : "대기 중"}</strong>
            <p>
              {looking
                ? "내 카드가 선택한 지역의 라이벌 목록에 공개 중입니다."
                : "희망 지역과 시간을 적고 카드를 공개하면 시작할 수 있어요."}
            </p>
          </div>
          <button
            type="button"
            className={`sparring-hero-toggle${looking ? " is-on" : ""}`}
            onClick={handleToggleLooking}
          >
            {looking ? "공개 끄기" : "내 카드 공개"}
          </button>
        </div>

        <div className="sparring-required">
          <label className="sparring-required-field">
            <span>희망 지역 *</span>
            <input
              type="text"
              value={form.area}
              onChange={(event) => updateField("area", event.target.value)}
              placeholder="예: 성수동 · 수원 영통구"
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
        <p className="sparring-privacy">
          <strong>공개되는 정보:</strong> 닉네임·체급·경력·강도·지역·희망 시간.
          연락처와 훈련 기록은 공개하지 않습니다.
        </p>
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
              공개 카드 저장
            </button>
            {saved ? (
              <button
                type="button"
                className="sparring-delete-button"
                onClick={handleDeleteProfile}
              >
                공개 카드 삭제
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="sparring-feed" aria-label="근처 상대">
        <div className="sparring-feed-head">
          <div>
            <p className="home-section-label">NEARBY</p>
            <h2>조건이 맞는 상대</h2>
          </div>
          <button
            type="button"
            className="gym-refresh-button"
            onClick={() => loadPartners()}
            disabled={status === "loading"}
          >
            {status === "loading" ? "검색 중" : "다시"}
          </button>
        </div>

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

        <div className="sparring-filter-grid">
          <label className="sparring-field">
            <span>지역</span>
            <input
              type="search"
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              placeholder={form.area || "지역 입력"}
            />
          </label>
          <label className="sparring-field">
            <span>희망 시간</span>
            <input
              type="search"
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value)}
              placeholder={form.meetWhen || "예: 주말"}
            />
          </label>
        </div>
        <div className="sparring-filter-actions">
          <button
            type="button"
            className="sparring-filter-apply"
            onClick={() => loadPartners()}
          >
            조건 적용
          </button>
          {(areaFilter || timeFilter) && (
            <button
              type="button"
              className="sparring-filter-clear"
              onClick={() => {
                setAreaFilter("");
                setTimeFilter("");
                loadPartners({ areaQuery: "", timeQuery: "" });
              }}
            >
              전체 보기
            </button>
          )}
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

        {status === "unavailable" ? (
          <div className="gym-state-card error">
            <strong>라이벌 매칭 서버를 준비 중입니다</strong>
            <p>
              공개 베타 SQL이 아직 연결되지 않았습니다. 운영자가
              dojo_sparring_v1.sql을 적용하면 실제 카드가 여기에 표시됩니다.
            </p>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="gym-state-card">
            <strong>이 지역에 공개된 라이벌이 없습니다</strong>
            <p>
              지금 내 카드를 공개해 보세요. 관심은 서로 보냈을 때만 대화가
              열려요.
            </p>
            {!looking ? (
              <button
                type="button"
                className="gym-retry-button"
                onClick={handleToggleLooking}
              >
                내 카드 공개하기
              </button>
            ) : null}
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="sparring-partner-list">
            {partners.map((partner) => (
              <SparringPartnerCard
                key={partner.id}
                partner={partner}
                requested={requestedProfileIds.has(partner.id)}
                matched={matchedProfileIds.has(partner.id)}
                onChatRequest={handleChatRequest}
                onOpenChat={setChatPartner}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="sparring-interest-ledger" aria-label="관심 요청">
        <div className="sparring-feed-head">
          <div>
            <p className="home-section-label">INTEREST</p>
            <h2>관심 요청</h2>
          </div>
          <button
            type="button"
            className="gym-refresh-button"
            onClick={loadInterests}
          >
            새로고침
          </button>
        </div>
        <p>
          연락처는 공개되지 않습니다. 서로 관심을 보낸 뒤에만 대화가 열립니다.
        </p>
        <div className="sparring-interest-grid">
          <div>
            <span>보낸 관심</span>
            <strong>{sentInterests.length}</strong>
          </div>
          <div>
            <span>받은 관심</span>
            <strong>{receivedInterests.length}</strong>
          </div>
        </div>
        {displayInterests.length > 0 ? (
          <ul className="sparring-interest-list">
            {displayInterests.map((interest) => (
              <li key={interest.id}>
                <span>
                  {matchedProfileIds.has(interest.profile_id)
                    ? "매칭"
                    : interest.direction === "received"
                      ? "받음"
                      : "보냄"}
                </span>
                <strong>{interest.nickname}</strong>
                <small>
                  {[interest.weight_class, interest.area, interest.meet_when]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {matchedProfileIds.has(interest.profile_id) ? (
                  <button
                    type="button"
                    className="sparring-interest-action"
                    onClick={() => handleInterestAction(interest)}
                  >
                    대화하기
                  </button>
                ) : interest.direction === "received" ? (
                  <button
                    type="button"
                    className="sparring-interest-action"
                    onClick={() => handleInterestAction(interest)}
                  >
                    나도 관심
                  </button>
                ) : (
                  <small className="sparring-interest-waiting">응답 대기</small>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sparring-interest-empty">
            아직 관심 요청이 없습니다. 조건이 맞는 상대에게 먼저 관심을 보내
            보세요.
          </p>
        )}
      </section>

      {notice && status !== "error" ? (
        <div className="category-notice" role="status">
          {notice}
        </div>
      ) : null}

      <SparringChatModal
        open={Boolean(chatPartner)}
        onClose={() => setChatPartner(null)}
        actorId={actorId}
        nickname={profile.nickname || "나"}
        peerProfileId={chatPartner?.id}
        peerName={chatPartner?.nickname}
        peerMeta={[
          chatPartner?.weightClass || chatPartner?.weight_class,
          chatPartner?.area,
          chatPartner?.meetWhen || chatPartner?.meet_when,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
    </>
  );
}
