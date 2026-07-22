import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import GymInquiryModal from "../../components/GymInquiryModal";
import GymInquiryLedgerPanel from "../../components/GymInquiryLedgerPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import { useTraining } from "../../store/TrainingContext";
import {
  getGymDataSourceLabel,
  getLocationSourceLabel,
  isGymSearchAvailable,
  PRESET_AREAS,
  resolveSearchLocation,
  searchNearbyGyms,
  suggestAreas,
} from "../../utils/gymSearch";
import {
  loadApprovedGymsForSearch,
  mergeGymSearchResults,
  splitFeaturedGyms,
} from "../../utils/gymListing";
import GymResultCard from "./GymResultCard";

export default function NearbyGymsPanel({ onGoBack, embedded = false }) {
  const { profile, userId } = useTraining();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [position, setPosition] = useState(null);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const [listingMode, setListingMode] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  function openInquiry(gym) {
    track("gym_inquiry_open", { gymId: gym.id });
    setInquiryGym(gym);
  }

  function openRegister() {
    track("gym_listing_open");
    setEditingListing(null);
    setListingMode("register");
  }

  function openManage() {
    track("gym_listing_manage_open");
    setListingMode("manage");
  }

  function openLedger() {
    track("gym_inquiry_ledger_open");
    setListingMode("ledger");
  }

  function closeListingPanels() {
    setListingMode(null);
    setEditingListing(null);
  }

  async function loadGyms(options = {}) {
    const {
      preferGps = false,
      preset = null,
      query = null,
      allowFallback = !preferGps && !preset && !query,
    } = options;

    setStatus("loading");
    setError("");
    setLocationHint("");
    setActivePreset(preset);
    if (query) {
      setRegionQuery(query);
    }

    try {
      const currentPosition = await resolveSearchLocation({
        preferGps,
        preset,
        query,
        allowFallback,
      });

      setPosition(currentPosition);

      if (currentPosition.source === "default") {
        setLocationHint(
          "GPS를 쓸 수 없어 기본 위치입니다. 위에서 지역을 검색해 보세요."
        );
      } else if (currentPosition.source === "search") {
        setLocationHint(`「${currentPosition.label}」 기준으로 검색했습니다.`);
      } else {
        setLocationHint("");
      }

      if (!isGymSearchAvailable()) {
        setGyms([]);
        setStatus("empty");
        return;
      }

      const [results, listed] = await Promise.all([
        searchNearbyGyms(currentPosition.lat, currentPosition.lon),
        loadApprovedGymsForSearch(currentPosition.lat, currentPosition.lon),
      ]);
      const merged = mergeGymSearchResults(listed, results);

      setGyms(merged);
      setStatus(merged.length > 0 ? "ready" : "empty");
    } catch (loadError) {
      setError(loadError.message || "검색 중 문제가 발생했습니다.");
      setStatus("error");
    }
  }

  function handleRegionSubmit(event) {
    event.preventDefault();
    const q = regionQuery.trim();
    if (!q) {
      setError("지역을 입력해 주세요. 예: 강남, 홍대, 잠실, 부산");
      setStatus("error");
      return;
    }
    setSuggestions([]);
    track("gym_region_search", { query: q });
    loadGyms({ query: q, allowFallback: false });
  }

  function handleRegionChange(value) {
    setRegionQuery(value);
    setSuggestions(value.trim() ? suggestAreas(value, 5) : []);
  }

  useEffect(() => {
    loadGyms({ preferGps: true, allowFallback: true });
  }, []);

  if (listingMode === "ledger") {
    return (
      <GymInquiryLedgerPanel
        userId={userId}
        onClose={closeListingPanels}
        onOpenManage={openManage}
      />
    );
  }

  if (listingMode === "manage") {
    return (
      <GymMyListingsPanel
        userId={userId}
        nickname={profile?.nickname || ""}
        onClose={closeListingPanels}
        onCreate={openRegister}
        onOpenLedger={openLedger}
        onEdit={(listing) => {
          setEditingListing(listing);
          setListingMode("register");
        }}
      />
    );
  }

  if (listingMode === "register") {
    return (
      <GymListingRegisterPanel
        userId={userId}
        nickname={profile?.nickname || ""}
        initialListing={editingListing}
        onClose={() => {
          if (editingListing) {
            setEditingListing(null);
            setListingMode("manage");
            return;
          }
          closeListingPanels();
        }}
        onSaved={() => {
          if (position) {
            loadGyms({
              preferGps: position.source === "gps",
              query: position.source === "search" ? regionQuery : null,
              preset: activePreset,
            });
          }
        }}
      />
    );
  }

  return (
    <>
      <header
        className={`gym-search-header${embedded ? " is-embedded" : ""}`}
      >
        {!embedded && onGoBack ? (
          <button className="category-back" type="button" onClick={onGoBack}>
            ← 도장
          </button>
        ) : null}
        {!embedded ? <h1>체육관 문의·대여</h1> : null}
        <p className="gym-search-context">
          {position
            ? `${position.label} · ${getLocationSourceLabel(position.source)}`
            : "위치 확인 중"}
          {status === "ready" && gyms[0]
            ? ` · ${getGymDataSourceLabel(gyms[0].source)}`
            : ""}
        </p>
      </header>

      <aside className="gym-listing-cta" aria-label="체육관 입점">
        <div className="gym-listing-cta-copy">
          <p className="gym-listing-kicker">FOR GYMS</p>
          <strong>관을 운영 중이신가요?</strong>
          <p>
            이름·주소·가격·사진을 올리고, 복서의 문의를 받습니다. 승인 후
            검색·추천 노출로 이어집니다.
          </p>
        </div>
        <div className="gym-listing-cta-actions">
          <button
            type="button"
            className="gym-listing-cta-button"
            onClick={openRegister}
          >
            내 체육관 등록
          </button>
          <button
            type="button"
            className="gym-listing-manage-button"
            onClick={openManage}
          >
            내 등록 관리
          </button>
          <button
            type="button"
            className="gym-listing-manage-button"
            onClick={openLedger}
          >
            받은 문의
          </button>
        </div>
      </aside>

      <form className="gym-region-search" onSubmit={handleRegionSubmit}>
        <label className="gym-region-search-field" htmlFor="gym-region-input">
          <span>지역 검색</span>
          <div className="gym-region-search-row">
            <input
              id="gym-region-input"
              type="search"
              value={regionQuery}
              onChange={(event) => handleRegionChange(event.target.value)}
              placeholder="예: 강남, 홍대, 잠실, 부산"
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="submit" disabled={status === "loading"}>
              검색
            </button>
          </div>
        </label>
        {suggestions.length > 0 ? (
          <div className="gym-region-suggestions" role="listbox">
            {suggestions.map((area) => (
              <button
                key={area.id}
                type="button"
                className="gym-region-suggestion"
                onClick={() => {
                  setRegionQuery(area.label);
                  setSuggestions([]);
                  loadGyms({ query: area.label, allowFallback: false });
                }}
              >
                {area.label}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <section className="gym-search-bar" aria-label="빠른 위치">
        <button
          type="button"
          className={`gym-search-gps${
            position?.source === "gps" ? " is-active" : ""
          }`}
          onClick={() => loadGyms({ preferGps: true, allowFallback: false })}
          disabled={status === "loading"}
        >
          GPS
        </button>
        <div className="gym-search-presets">
          {PRESET_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`gym-preset-chip${
                activePreset === area.id ? " is-active" : ""
              }`}
              onClick={() => {
                setRegionQuery(area.label);
                setSuggestions([]);
                loadGyms({ preset: area.id });
              }}
              disabled={status === "loading"}
            >
              {area.label.replace(/^서울\s/, "")}
            </button>
          ))}
        </div>
      </section>

      {locationHint ? <p className="gym-location-hint">{locationHint}</p> : null}

      {status === "loading" ? (
        <div className="gym-state-card">주변 복싱장을 찾는 중입니다...</div>
      ) : null}

      {status === "error" ? (
        <div className="gym-state-card error">
          <strong>검색에 실패했습니다</strong>
          <p>{error}</p>
          <button
            type="button"
            className="gym-retry-button"
            onClick={() => loadGyms({ preset: "seoul-gangnam" })}
          >
            서울 강남으로 재시도
          </button>
        </div>
      ) : null}

      {status === "empty" ? (
        <div className="gym-state-card">
          <strong>근처에서 복싱장을 찾지 못했습니다</strong>
          <p>다른 지역으로 검색해 보세요. 예: 강남, 홍대, 부산</p>
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="gym-result-list">
          {(() => {
            const { featured, rest } = splitFeaturedGyms(gyms);
            return (
              <>
                {featured.length > 0 ? (
                  <section
                    className="gym-featured-slot"
                    aria-label="추천 체육관"
                  >
                    <div className="gym-featured-slot-head">
                      <p className="gym-listing-kicker">FEATURED</p>
                      <strong>추천</strong>
                      <span>관이 올리는 노출 자리</span>
                    </div>
                    {featured.map((gym, index) => (
                      <GymResultCard
                        key={gym.id}
                        gym={gym}
                        index={index}
                        featured
                        onInquire={openInquiry}
                      />
                    ))}
                  </section>
                ) : null}
                {rest.map((gym, index) => (
                  <GymResultCard
                    key={gym.id}
                    gym={gym}
                    index={featured.length + index}
                    onInquire={openInquiry}
                  />
                ))}
              </>
            );
          })()}
        </div>
      ) : null}

      {inquiryGym ? (
        <GymInquiryModal
          gym={inquiryGym}
          userId={userId}
          nickname={profile?.nickname || ""}
          onClose={() => setInquiryGym(null)}
        />
      ) : null}
    </>
  );
}
