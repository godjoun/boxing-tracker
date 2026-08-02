import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { track } from "@vercel/analytics";
import GymDetailPanel from "../../components/GymDetailPanel";
import ExchangeBoardPanel from "./ExchangeBoardPanel";
import GymInquiryChatModal from "../../components/GymInquiryChatModal";
import GymInquiryModal from "../../components/GymInquiryModal";
import GymInquiryLedgerPanel from "../../components/GymInquiryLedgerPanel";
import GymMapSheet from "../../components/GymMapSheet";
import GymMapSidePanel from "../../components/GymMapSidePanel";
import GymSentInquiriesPanel from "../../components/GymSentInquiriesPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import GymResultCard from "./GymResultCard";
import { searchOsmBoxingGyms } from "../../api/osmGymApi";
import { inquiryKindLabel } from "../../utils/gymInquiry";
import { useTraining } from "../../store/TrainingContext";
import {
  getDistanceKm,
  getSavedLocation,
  isNearbyMapGym,
  resolveSearchLocation,
  saveGymSearchLocation,
  suggestAreas,
  findAreaByQuery,
  SEARCHABLE_AREAS,
} from "../../utils/gymSearch";
import {
  isOwnListedGym,
  loadApprovedGymsForSearch,
  mergeGymSearchResults,
  coverGymPhoto,
} from "../../utils/gymListing";
import {
  getFavoriteGyms,
  toggleFavoriteGym,
} from "../../utils/gymFavorites";
import { BRAND_NAME } from "../../utils/brand";
import { groupRivalsByArea } from "../../utils/rivalAreaMap";

const GymMapPanel = lazy(() => import("../../components/GymMapPanel"));

const MAP_OVERVIEW = {
  lat: 36.45,
  lon: 127.85,
  label: "대한민국",
  source: "overview",
};

const RECENT_SEARCH_KEY = "mantle-gym-recent-searches";
const DISTANCE_OPTIONS = [3, 5, 10, 20];
const QUICK_REGIONS = SEARCHABLE_AREAS.slice(0, 6);

function readRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function writeRecentSearch(label) {
  const next = [label, ...readRecentSearches().filter((item) => item !== label)].slice(
    0,
    8
  );
  try {
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

const LAYER_FILTERS = [
  { id: "gyms", label: "체육관" },
  { id: "sparring", label: "라이벌" },
  { id: "favorites", label: "찜" },
  { id: "meeting", label: "모임" },
];

export default function NearbyGymsPanel({
  categoryNav = null,
  activeLayer = "gyms",
  onSelectLayer,
  onMeetingSectionChange,
  onGoRivalProfile,
  meetingRequest = 0,
  rivals = [],
  rivalBridge = null,
  rivalContent = null,
}) {
  const { profile, userId, updateProfile } = useTraining();
  const [section, setSection] = useState("find");
  const [status, setStatus] = useState("idle");
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedRivalArea, setSelectedRivalArea] = useState(null);
  const [selectedRivalPartner, setSelectedRivalPartner] = useState(null);
  const [favoriteGyms, setFavoriteGyms] = useState(getFavoriteGyms);
  const [position, setPosition] = useState(MAP_OVERVIEW);
  const [inquiryGym, setInquiryGym] = useState(null);
  const [inquiryKind, setInquiryKind] = useState("trial");
  const [detailGym, setDetailGym] = useState(null);
  const [chatInquiry, setChatInquiry] = useState(null);
  const [ownerMode, setOwnerMode] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [registrationKind, setRegistrationKind] = useState("owner");
  const [homeGymNotice, setHomeGymNotice] = useState("");
  const [activePreset, setActivePreset] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [distanceLimitKm, setDistanceLimitKm] = useState(20);
  const [draftDistanceKm, setDraftDistanceKm] = useState(20);
  const [draftLayer, setDraftLayer] = useState(activeLayer);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [sheetSnap, setSheetSnap] = useState("half");
  const initialAreaLoaded = useRef(false);
  const prevLayerRef = useRef(activeLayer);

  const rivalAreas = useMemo(() => groupRivalsByArea(rivals), [rivals]);
  const rivalsInArea = useMemo(() => {
    if (!selectedRivalArea) return [];
    return rivals.filter((partner) => {
      const resolved = findAreaByQuery(partner.area);
      return resolved?.id === selectedRivalArea.id;
    });
  }, [rivals, selectedRivalArea]);
  const favoriteIds = useMemo(
    () => favoriteGyms.map((gym) => gym.id),
    [favoriteGyms]
  );
  const mapGyms = useMemo(() => {
    const base =
      activeLayer === "favorites"
        ? favoriteGyms
        : activeLayer === "gyms"
          ? gyms
          : [];
    return base.filter((gym) => {
      if (!Number.isFinite(Number(gym.distanceKm))) return true;
      return Number(gym.distanceKm) <= distanceLimitKm;
    });
  }, [activeLayer, favoriteGyms, gyms, distanceLimitKm]);

  useEffect(() => {
    if (prevLayerRef.current === activeLayer) return;
    prevLayerRef.current = activeLayer;
    const timer = window.setTimeout(() => {
      setDetailGym(null);
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setSelectedRivalPartner(null);
      setHomeGymNotice("");
      setSheetSnap("half");
      setSection("find");
      onMeetingSectionChange?.(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLayer, onMeetingSectionChange]);

  useEffect(() => {
    if (!meetingRequest) return;
    const timer = window.setTimeout(() => {
      track("gym_section_tab", { section: "meeting" });
      setSection("meeting");
      setInquiryGym(null);
      setChatInquiry(null);
      setOwnerMode(null);
      setEditingListing(null);
      setSideMenuOpen(false);
      onMeetingSectionChange?.(true);
      setSelectedGym(null);
      setDetailGym(null);
      setSelectedRivalPartner(null);
      setSelectedRivalArea(null);
      setHomeGymNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [meetingRequest, onMeetingSectionChange]);

  function closeChatAndRefresh() {
    setChatInquiry(null);
    setInboxRefreshKey((value) => value + 1);
  }

  function switchSection(next) {
    track("gym_section_tab", { section: next });
    setSection(next);
    setInquiryGym(null);
    setChatInquiry(null);
    setOwnerMode(null);
    setEditingListing(null);
    setSideMenuOpen(false);
    onMeetingSectionChange?.(next === "meeting");
    if (next === "find") {
      setSheetSnap("half");
    }
  }

  function closeSidePanel() {
    setSelectedGym(null);
    setDetailGym(null);
    setSelectedRivalPartner(null);
    setSelectedRivalArea(null);
    setHomeGymNotice("");
  }

  function goBack() {
    if (sideMenuOpen) {
      closeSideMenu();
      return true;
    }
    if (detailGym) {
      closeDetail();
      return true;
    }
    if (selectedRivalPartner || selectedRivalArea || selectedGym) {
      closeSidePanel();
      return true;
    }
    if (section === "owner" && ownerMode) {
      setOwnerMode(null);
      return true;
    }
    if (section !== "find") {
      switchSection("find");
      return true;
    }
    if (activeLayer === "favorites" || activeLayer === "sparring") {
      onSelectLayer?.("gyms");
      return true;
    }
    return false;
  }

  function openInquiry(gym) {
    if (gym?.source !== "listing") return;
    track("gym_inquiry_open", {
      gymId: gym.id,
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setInquiryKind("trial");
    setInquiryGym(gym);
  }

  function openReservation(gym) {
    if (gym?.source !== "listing") return;
    track("gym_reservation_open", {
      gymId: gym.id,
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setInquiryKind("reservation");
    setInquiryGym(gym);
  }

  function openDetail(gym) {
    track("gym_detail_open", {
      gymId: gym.id,
      source: gym.source || "",
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setHomeGymNotice("");
    setSelectedGym(gym);
    setSelectedRivalArea(null);
    setDetailGym(gym);
  }

  function closeDetail() {
    setDetailGym(null);
  }

  function handleSetHomeGym(gym) {
    const alreadyHome =
      String(profile?.homeGymId || "") === String(gym?.id || "");
    updateProfile(
      alreadyHome
        ? { homeGymId: "", homeGymName: "", homeGymAddress: "" }
        : {
            homeGymId: String(gym.id),
            homeGymName: String(gym.name || ""),
            homeGymAddress: String(gym.address || ""),
          }
    );
    track("home_gym_update", {
      gymId: gym?.id || "",
      selected: !alreadyHome,
      source: gym?.source || "",
    });
    setHomeGymNotice(
      alreadyHome
        ? "내 체육관 등록을 해제했습니다."
        : `「${gym?.name || "체육관"}」을 내 체육관으로 등록했습니다.`
    );
  }

  function goRivalProfile() {
    onGoRivalProfile?.();
    setSideMenuOpen(false);
  }

  function openRegister(kind = "owner") {
    track("gym_listing_open");
    setEditingListing(null);
    setRegistrationKind(kind);
    setOwnerMode("register");
    setSection("owner");
  }

  function closeSideMenu() {
    setSideMenuOpen(false);
  }

  function runFromSideMenu(action) {
    closeSideMenu();
    action();
  }

  function openLedger() {
    track("gym_inquiry_ledger_open");
    setOwnerMode("ledger");
    setSection("owner");
  }

  function openInquiryChat(item) {
    setChatInquiry(item);
  }

  async function loadGyms(options = {}) {
    const { preset = null, query = null, allowFallback = false } = options;

    setStatus("loading");
    setActivePreset(preset);
    if (query) {
      setRegionQuery(query);
    }

    try {
      const currentPosition = await resolveSearchLocation({
        preset,
        query,
        allowFallback,
      });

      setPosition(currentPosition);

      const [osmResult, listedResult] = await Promise.allSettled([
        searchOsmBoxingGyms({
          lat: currentPosition.lat,
          lon: currentPosition.lon,
        }),
        loadApprovedGymsForSearch(currentPosition.lat, currentPosition.lon, {
          userId,
        }),
      ]);
      const osmGyms =
        osmResult.status === "fulfilled"
          ? osmResult.value.map((gym) => {
              const distanceKm = getDistanceKm(
                currentPosition.lat,
                currentPosition.lon,
                gym.lat,
                gym.lon
              );
              return {
                ...gym,
                distanceKm,
                distanceLabel:
                  distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m`
                    : `${distanceKm.toFixed(1)}km`,
              };
            })
          : [];
      const listedRaw =
        listedResult.status === "fulfilled" ? listedResult.value : [];
      const listed = listedRaw.filter((gym) =>
        isNearbyMapGym(gym, currentPosition)
      );
      const nearbyOsm = osmGyms.filter((gym) =>
        isNearbyMapGym(gym, currentPosition)
      );
      const merged = mergeGymSearchResults(listed, nearbyOsm);
      const featuredIds = merged
        .filter((gym) => gym.featured)
        .map((gym) => gym.id);

      track("gym_search_results_view", {
        resultCount: merged.length,
        featuredCount: featuredIds.length,
        featuredGymIds: featuredIds.join(",").slice(0, 240),
      });

      setGyms(merged);
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setDetailGym(null);
      if (merged.length > 0) {
        setStatus("ready");
      } else if (osmResult.status === "rejected") {
        throw osmResult.reason;
      } else {
        setStatus("empty");
      }
    } catch (loadError) {
      console.error("Gym map search failed", loadError);
      setStatus("error");
    }
  }

  useEffect(() => {
    if (initialAreaLoaded.current) return;
    const savedLocation = getSavedLocation();
    const profileArea = String(profile?.area || "").trim();
    if (!savedLocation && !profileArea) return;
    initialAreaLoaded.current = true;
    const timer = window.setTimeout(
      () =>
        loadGyms(
          savedLocation
            ? { allowFallback: false }
            : { query: profileArea, allowFallback: false }
        ),
      0
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.area, userId]);

  function handleRegionChange(value) {
    setRegionQuery(value);
    setSuggestions(value.trim() ? suggestAreas(value, 5) : []);
  }

  function handleToggleFavorite(gym) {
    const next = toggleFavoriteGym(gym);
    setFavoriteGyms(next);
    track("gym_favorite_toggle", {
      gymId: gym.id,
      source: gym.source || "",
      saved: next.some((item) => item.id === gym.id),
    });
  }

  function selectGymOnMap(gym) {
    setSelectedGym(gym);
    setSelectedRivalArea(null);
    setSelectedRivalPartner(null);
    setDetailGym(null);
  }

  function selectRivalOnMap(area) {
    setSelectedRivalArea(area);
    setSelectedGym(null);
    setDetailGym(null);

    const inArea = rivals.filter((partner) => {
      const resolved = findAreaByQuery(partner.area);
      return resolved?.id === area.id;
    });

    if (inArea.length === 1) {
      setSelectedRivalPartner(inArea[0]);
      return;
    }

    setSelectedRivalPartner(null);
  }

  function openSearch() {
    setSearchOpen(true);
    setSuggestions(suggestAreas(regionQuery, 5));
    setRecentSearches(readRecentSearches());
  }

  function closeSearch() {
    setSearchOpen(false);
    setSuggestions([]);
  }

  function openFilter() {
    setDraftDistanceKm(distanceLimitKm);
    setDraftLayer(
      activeLayer === "sparring" ||
        activeLayer === "favorites" ||
        activeLayer === "gyms"
        ? activeLayer
        : "gyms"
    );
    setFilterOpen(true);
  }

  function applyFilter() {
    setDistanceLimitKm(draftDistanceKm);
    if (draftLayer === "meeting") {
      switchSection("meeting");
    } else {
      onSelectLayer?.(draftLayer);
      if (section !== "find") {
        switchSection("find");
      }
    }
    setFilterOpen(false);
    setSheetSnap("half");
  }

  async function runRegionSearch(label) {
    const q = String(label || "").trim();
    if (!q) return;
    track("gym_region_search", { query: q });
    setRecentSearches(writeRecentSearch(q));
    setRegionQuery(q);
    closeSearch();
    await loadGyms({ query: q, allowFallback: false });
  }

  async function handleSearchSubmit(event) {
    event?.preventDefault?.();
    const q = regionQuery.trim();
    if (!q) return;
    await runRegionSearch(q);
  }

  function handleMyLocation() {
    if (locating) return;
    if (searchOpen) closeSearch();

    if (!navigator.geolocation) {
      loadGyms({ allowFallback: true });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (result) => {
        try {
          saveGymSearchLocation({
            lat: result.coords.latitude,
            lon: result.coords.longitude,
            label: "내 위치",
            source: "gps",
            accuracy: result.coords.accuracy,
          });
          await loadGyms({ allowFallback: true });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        loadGyms({ allowFallback: true });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  const mapFocus = sheetSnap === "peek" && section === "find";

  const mapOverlay = (
    <div
      className={`gym-map-overlay-controls is-discovery${
        mapFocus ? " is-map-focus" : ""
      }`}
    >
      {mapFocus ? (
        <div className="gym-map-focus-bar">
          <button
            type="button"
            className="gym-map-chrome-btn"
            aria-label="목록 보기"
            onClick={() => setSheetSnap("half")}
          >
            ←
          </button>
          <div className="gym-map-top-bar-actions">
            <button
              type="button"
              className="gym-map-locate-chip"
              aria-label="내 위치"
              disabled={locating || status === "loading"}
              onClick={handleMyLocation}
            >
              {locating ? "위치…" : "내 위치"}
            </button>
            <button
              type="button"
              className="gym-map-chrome-btn"
              aria-label="검색"
              onClick={openSearch}
            >
              <span aria-hidden="true">🔍</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="gym-map-hero-head">
          <div className="gym-map-hero-copy">
            <p className="gym-map-hero-kicker">GYM</p>
            <h1>짐 찾기</h1>
            <p>내 주변 체육관을 지도로 찾아보세요</p>
          </div>
          <div className="gym-map-top-bar-actions">
            <button
              type="button"
              className="gym-map-locate-chip"
              aria-label="내 위치"
              disabled={locating || status === "loading"}
              onClick={handleMyLocation}
            >
              {locating ? "위치…" : "내 위치"}
            </button>
            <button
              type="button"
              className="gym-map-chrome-btn"
              aria-label="검색"
              onClick={openSearch}
            >
              <span aria-hidden="true">🔍</span>
            </button>
            <button
              type="button"
              className={`gym-map-chrome-btn${
                section === "sent" ? " is-active" : ""
              }`}
              aria-label="내 문의"
              title="내 문의"
              onClick={() => switchSection("sent")}
            >
              <span aria-hidden="true">✉</span>
            </button>
            <button
              type="button"
              className={`gym-map-chrome-btn${sideMenuOpen ? " is-active" : ""}`}
              aria-expanded={sideMenuOpen}
              aria-controls="gym-map-side-menu"
              aria-label="더보기 메뉴"
              onClick={() => setSideMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const locateControl = null;

  const searchModal = searchOpen ? (
    <div className="gym-map-search-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="gym-map-search-modal-backdrop"
        aria-label="검색 닫기"
        onClick={closeSearch}
      />
      <div className="gym-map-search-modal-panel is-rich">
        <form className="gym-map-search-modal-form" onSubmit={handleSearchSubmit}>
          <button
            type="button"
            className="gym-map-search-modal-back"
            aria-label="닫기"
            onClick={closeSearch}
          >
            ←
          </button>
          <input
            type="search"
            value={regionQuery}
            onChange={(event) => handleRegionChange(event.target.value)}
            placeholder="체육관 · 지역 검색"
            aria-label="체육관 또는 지역 검색"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus
          />
          <button
            type="submit"
            disabled={status === "loading"}
            aria-label="검색"
          >
            {status === "loading" ? "…" : "찾기"}
          </button>
        </form>

        {suggestions.length > 0 ? (
          <div className="gym-map-region-suggestions is-modal" role="listbox">
            {suggestions.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => runRegionSearch(area.label)}
              >
                {area.label}
              </button>
            ))}
          </div>
        ) : null}

        {recentSearches.length > 0 ? (
          <section className="gym-map-search-block">
            <h3>최근 검색</h3>
            <div className="gym-map-search-chips">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runRegionSearch(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="gym-map-search-block">
          <h3>추천 지역</h3>
          <div className="gym-map-search-chips">
            {QUICK_REGIONS.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => runRegionSearch(area.label)}
              >
                {area.label}
              </button>
            ))}
          </div>
        </section>

        <section className="gym-map-search-block">
          <h3>지역으로 찾기</h3>
          <div className="gym-map-search-list">
            <button type="button" onClick={handleMyLocation}>
              내 주변
            </button>
            {SEARCHABLE_AREAS.slice(0, 10).map((area) => (
              <button
                key={`list-${area.id}`}
                type="button"
                onClick={() => runRegionSearch(area.label)}
              >
                {area.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  ) : null;

  const filterSheet = filterOpen ? (
    <div className="gym-map-filter-sheet" role="dialog" aria-modal="true">
      <button
        type="button"
        className="gym-map-filter-backdrop"
        aria-label="필터 닫기"
        onClick={() => setFilterOpen(false)}
      />
      <div className="gym-map-filter-panel">
        <div className="gym-map-filter-handle" aria-hidden="true">
          <span />
        </div>
        <h2>필터</h2>

        <section className="gym-map-filter-block">
          <h3>카테고리</h3>
          <div className="gym-map-search-chips">
            {LAYER_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={draftLayer === item.id ? "is-active" : ""}
                onClick={() => setDraftLayer(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="gym-map-filter-block">
          <h3>거리 · {draftDistanceKm}km 이내</h3>
          <div className="gym-map-search-chips">
            {DISTANCE_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                className={draftDistanceKm === km ? "is-active" : ""}
                onClick={() => setDraftDistanceKm(km)}
              >
                {km}km
              </button>
            ))}
          </div>
          <input
            className="gym-map-filter-range"
            type="range"
            min="1"
            max="20"
            step="1"
            value={draftDistanceKm}
            onChange={(event) => setDraftDistanceKm(Number(event.target.value))}
            aria-label="검색 반경"
          />
        </section>

        <p className="gym-map-filter-note">
          개인 PT · 시설 필터는 입점 데이터가 준비되면 추가됩니다.
        </p>

        <button
          type="button"
          className="gym-map-filter-apply"
          onClick={applyFilter}
        >
          적용하기
        </button>
      </div>
    </div>
  ) : null;

  const sheetTitle =
    activeLayer === "favorites"
      ? "찜한 체육관"
      : activeLayer === "sparring"
        ? "라이벌"
        : "가까운 체육관";
  const sheetCount =
    activeLayer === "sparring"
      ? rivals.length
      : mapGyms.length;

  const previewGym =
    activeLayer === "sparring"
      ? null
      : selectedGym && mapGyms.some((gym) => gym.id === selectedGym.id)
        ? selectedGym
        : mapGyms[0] || null;
  const previewRival =
    activeLayer === "sparring"
      ? selectedRivalPartner || rivals[0] || null
      : null;
  const previewCover = previewGym ? coverGymPhoto(previewGym) : null;

  const sheetListContent =
    activeLayer === "sparring" ? (
      rivals.length === 0 ? (
        <div className="gym-state-card">
          <strong>공개 중인 라이벌이 없습니다</strong>
          <p>명패에서 라이벌 카드를 공개하면 지도에 표시됩니다.</p>
        </div>
      ) : (
        <div className="gym-result-list">
          {rivals.map((partner) => renderRivalRow(partner))}
        </div>
      )
    ) : mapGyms.length === 0 ? (
      <div className="gym-state-card">
        <strong>
          {activeLayer === "favorites"
            ? "찜한 체육관이 없습니다"
            : status === "loading"
              ? "체육관을 찾는 중"
              : "이 지역 결과가 없습니다"}
        </strong>
        <p>
          {activeLayer === "favorites"
            ? "지도에서 마음에 드는 관을 찜해 보세요."
            : "🔍 로 지역을 검색하거나 내 위치로 찾아보세요."}
        </p>
      </div>
    ) : (
      <div className="gym-result-list">
        {mapGyms.map((gym, index) => (
          <GymResultCard
            key={gym.id}
            gym={gym}
            index={index}
            compact
            featured={Boolean(gym.featured)}
            isOwn={isOwnListedGym(gym, userId)}
            isFavorite={favoriteIds.includes(gym.id)}
            onOpen={(item) => {
              selectGymOnMap(item);
              openDetail(item);
            }}
            onFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    );

  const peekPreview =
    activeLayer === "sparring" ? (
      previewRival ? (
        <button
          type="button"
          className="gym-map-preview-card"
          onClick={() => {
            setSelectedRivalPartner(previewRival);
            setSheetSnap("half");
          }}
        >
          <div className="gym-map-preview-copy">
            <span>라이벌</span>
            <strong>{previewRival.nickname || "라이벌"}</strong>
            <small>
              {[previewRival.area, previewRival.weightClass]
                .filter(Boolean)
                .join(" · ") || "카드를 열어 확인하세요"}
            </small>
          </div>
          <em>목록</em>
        </button>
      ) : (
        <button
          type="button"
          className="gym-map-preview-card is-empty"
          onClick={() => setSheetSnap("half")}
        >
          <div className="gym-map-preview-copy">
            <span>라이벌</span>
            <strong>지도에서 발견하세요</strong>
            <small>핸들을 올려 목록을 볼 수 있어요</small>
          </div>
        </button>
      )
    ) : previewGym ? (
      <button
        type="button"
        className="gym-map-preview-card"
        onClick={() => openDetail(previewGym)}
      >
        <div className="gym-map-preview-media" aria-hidden="true">
          {previewCover ? (
            <img src={previewCover} alt="" loading="lazy" />
          ) : (
            <span />
          )}
        </div>
        <div className="gym-map-preview-copy">
          <span>{previewGym.source === "listing" ? "입점" : "주변"}</span>
          <strong>{previewGym.name}</strong>
          <small>
            {[previewGym.distanceLabel, previewGym.address]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </div>
        <em>상세</em>
      </button>
    ) : (
      <button
        type="button"
        className="gym-map-preview-card is-empty"
        onClick={() => setSheetSnap("half")}
      >
        <div className="gym-map-preview-copy">
          <span>{sheetTitle}</span>
          <strong>
            {status === "loading" ? "찾는 중…" : "근처 체육관을 발견하세요"}
          </strong>
          <small>핸들을 올리면 목록이 열려요</small>
        </div>
      </button>
    );

  const resultSheet =
    section === "find" ? (
      <GymMapSheet
        snap={sheetSnap}
        title={sheetTitle}
        count={sheetCount}
        subtitle={
          position?.label && position.source !== "overview"
            ? position.label
            : ""
        }
        filters={categoryNav}
        headAction={
          <button
            type="button"
            className="gym-map-sheet-filter-btn"
            aria-label="필터"
            onClick={openFilter}
          >
            필터
          </button>
        }
        onSnapChange={setSheetSnap}
      >
        {sheetSnap === "peek" ? (
          peekPreview
        ) : (
          <>
            {sheetListContent}

            <button
              type="button"
              className="gym-map-sheet-map-cta"
              onClick={() => setSheetSnap("peek")}
            >
              지도로 전체 체육관 보기
            </button>
          </>
        )}
      </GymMapSheet>
    ) : null;

  const sideMenu = sideMenuOpen ? (
    <>
      <button
        type="button"
        className="gym-map-side-menu-backdrop"
        aria-label="메뉴 닫기"
        onClick={closeSideMenu}
      />
      <nav
        id="gym-map-side-menu"
        className="gym-map-side-menu"
        aria-label="짐 더보기"
      >
        <div className="gym-map-side-menu-head">
          <strong>{BRAND_NAME}</strong>
          <button
            type="button"
            className="gym-map-side-menu-close"
            aria-label="닫기"
            onClick={closeSideMenu}
          >
            ×
          </button>
        </div>

        <div className="gym-map-side-menu-group">
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() =>
              runFromSideMenu(() => {
                onSelectLayer?.("gyms");
                switchSection("find");
              })
            }
          >
            지도 · 체육관
          </button>
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() =>
              runFromSideMenu(() => {
                onSelectLayer?.("sparring");
                switchSection("find");
              })
            }
          >
            라이벌
          </button>
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() =>
              runFromSideMenu(() => {
                onSelectLayer?.("favorites");
                switchSection("find");
              })
            }
          >
            찜한 체육관
          </button>
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() => runFromSideMenu(() => switchSection("sent"))}
          >
            내 문의
          </button>
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() => runFromSideMenu(() => goRivalProfile())}
          >
            명패 · 라이벌 카드
          </button>
        </div>

        <hr className="gym-map-side-menu-divider" />

        <div className="gym-map-side-menu-group">
          <button
            type="button"
            className="gym-map-side-menu-item is-emphasis"
            onClick={() => runFromSideMenu(() => openRegister("community"))}
          >
            체육관 등록
          </button>
          <button
            type="button"
            className="gym-map-side-menu-item"
            onClick={() =>
              runFromSideMenu(() => {
                setSection("owner");
                setOwnerMode(null);
              })
            }
          >
            관장 입점 관리
          </button>
        </div>

        {activeLayer !== "gyms" || section !== "find" ? (
          <>
            <hr className="gym-map-side-menu-divider" />
            <div className="gym-map-side-menu-group">
              <button
                type="button"
                className="gym-map-side-menu-item"
                onClick={() =>
                  runFromSideMenu(() => {
                    onSelectLayer?.("gyms");
                    switchSection("find");
                  })
                }
              >
                지도로
              </button>
            </div>
          </>
        ) : null}

        <p className="gym-map-side-menu-note">
          지도에 없는 체육관은 등록해 주세요. 승인 후 다른 사용자도 찾을 수
          있습니다.
        </p>
      </nav>
    </>
  ) : null;

  const utilityOverlay =
    section === "sent" || section === "meeting" || section === "owner" ? (
      <div className="gym-map-utility-overlay" role="dialog" aria-modal="true">
        <button
          type="button"
          className="gym-utility-back"
          onClick={goBack}
        >
          ← 뒤로
        </button>
        {section === "sent" ? (
          <GymSentInquiriesPanel
            userId={userId}
            embedded
            refreshKey={inboxRefreshKey}
            onOpenChat={openInquiryChat}
          />
        ) : null}
        {section === "meeting" ? (
          <ExchangeBoardPanel embedded onGoBack={goBack} />
        ) : null}
        {section === "owner" && ownerMode === "ledger" ? (
          <GymInquiryLedgerPanel
            userId={userId}
            nickname={profile?.nickname || ""}
            embedded
            refreshKey={inboxRefreshKey}
            onClose={() => setOwnerMode(null)}
            onOpenManage={() => setOwnerMode(null)}
          />
        ) : null}
        {section === "owner" && ownerMode === "register" ? (
          <GymListingRegisterPanel
            userId={userId}
            nickname={profile?.nickname || ""}
            initialListing={editingListing}
            submissionKind={registrationKind}
            onClose={() => {
              setEditingListing(null);
              setOwnerMode(null);
              setSection("find");
            }}
            onSaved={() => {
              if (position?.source !== "overview") {
                loadGyms({
                  query: position.source === "search" ? regionQuery : null,
                  preset: activePreset,
                });
              }
            }}
          />
        ) : null}
        {section === "owner" && !ownerMode ? (
          <GymMyListingsPanel
            userId={userId}
            nickname={profile?.nickname || ""}
            embedded
            onCreate={() => openRegister("owner")}
            onOpenLedger={openLedger}
            onEdit={(listing) => {
              setEditingListing(listing);
              setRegistrationKind("owner");
              setOwnerMode("register");
            }}
          />
        ) : null}
      </div>
    ) : null;

  function renderRivalRow(partner) {
    const matched = rivalBridge?.isMatched?.(partner.id);
    const requested = rivalBridge?.isRequested?.(partner.id);
    return (
      <button
        key={partner.id}
        type="button"
        className="gym-result-row is-tappable"
        onClick={() => {
          setSelectedRivalPartner(partner);
          setSelectedRivalArea(null);
          setSelectedGym(null);
          setDetailGym(null);
        }}
      >
        <div className="gym-result-row-copy">
          <span className="gym-result-row-badge">
            {matched
              ? "매칭 · 대화 가능"
              : requested
                ? "관심 보냄"
                : "라이벌"}
          </span>
          <strong>{partner.nickname}</strong>
          <small>
            {[
              partner.weightClass,
              partner.experience,
              partner.area,
              partner.meetWhen,
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </div>
        <div className="gym-result-row-thumb rival-thumb">
          <span>{String(partner.nickname || "R").slice(0, 1)}</span>
        </div>
      </button>
    );
  }

  function renderSidePanelContent() {
    if (detailGym) {
      return (
        <GymDetailPanel
          gym={detailGym}
          embedded
          isOwn={isOwnListedGym(detailGym, userId)}
          isHomeGym={
            String(profile?.homeGymId || "") === String(detailGym?.id || "")
          }
          onClose={closeDetail}
          onInquire={openInquiry}
          onReserve={openReservation}
          onSetHomeGym={handleSetHomeGym}
          homeGymNotice={homeGymNotice}
          onOpenLedger={() => {
            setDetailGym(null);
            openLedger();
          }}
        />
      );
    }

    if (selectedGym && (activeLayer === "gyms" || activeLayer === "favorites")) {
      const isFavorite = favoriteIds.includes(selectedGym.id);
      const cover = coverGymPhoto(selectedGym);
      const isListing = selectedGym.source === "listing";
      const destination =
        Number.isFinite(Number(selectedGym.lat)) &&
        Number.isFinite(Number(selectedGym.lon))
          ? `${selectedGym.lat},${selectedGym.lon}`
          : [selectedGym.name, selectedGym.address].filter(Boolean).join(" ");
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`;

      return (
        <article className="gym-place-card">
          <button
            type="button"
            className="gym-place-card-hero"
            onClick={() => openDetail(selectedGym)}
            aria-label={`${selectedGym.name} 상세 보기`}
          >
            {cover ? (
              <img src={cover} alt="" loading="lazy" />
            ) : (
              <span className="gym-place-card-hero-empty" aria-hidden="true" />
            )}
          </button>
          <div className="gym-place-card-body">
            <p className="gym-place-card-eyebrow">
              {isListing ? `${BRAND_NAME} 입점` : "지도 검색"}
              {selectedGym.distanceLabel
                ? ` · ${selectedGym.distanceLabel}`
                : ""}
            </p>
            <h3>{selectedGym.name}</h3>
            {selectedGym.address ? (
              <p className="gym-place-card-address">{selectedGym.address}</p>
            ) : null}
            <div className="gym-place-card-actions">
              <button
                type="button"
                className={`gym-place-action${isFavorite ? " is-active" : ""}`}
                onClick={() => handleToggleFavorite(selectedGym)}
                aria-pressed={isFavorite}
              >
                {isFavorite ? "찜됨" : "찜"}
              </button>
              <button
                type="button"
                className="gym-place-action is-primary"
                onClick={() => openDetail(selectedGym)}
              >
                정보
              </button>
              {isListing && !isOwnListedGym(selectedGym, userId) ? (
                <button
                  type="button"
                  className="gym-place-action"
                  onClick={() => openInquiry(selectedGym)}
                >
                  문의
                </button>
              ) : null}
              <a
                className="gym-place-action"
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                길찾기
              </a>
            </div>
          </div>
        </article>
      );
    }

    if (selectedRivalPartner && activeLayer === "sparring") {
      const partner = selectedRivalPartner;
      const matched = rivalBridge?.isMatched?.(partner.id);
      const requested = rivalBridge?.isRequested?.(partner.id);
      const looking = rivalBridge?.isLooking;

      return (
        <article className="gym-place-card rival-place-card">
          <div className="rival-place-card-hero" aria-hidden="true">
            <span>{String(partner.nickname || "R").slice(0, 1)}</span>
            {matched ? <em className="rival-place-badge">매칭</em> : null}
          </div>
          <div className="gym-place-card-body">
            <p className="gym-place-card-eyebrow">
              라이벌 · {partner.area || selectedRivalArea?.label || "동네"}
            </p>
            <h3>{partner.nickname}</h3>
            <div className="rival-place-tags">
              {[partner.weightClass, partner.experience, partner.style]
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
            </div>
            {partner.meetWhen ? (
              <p className="gym-map-sheet-caption">
                희망 시간 · {partner.meetWhen}
              </p>
            ) : null}
            {partner.note ? (
              <p className="rival-place-detail">{partner.note}</p>
            ) : null}
            {!partner.isMine ? (
              <div className="gym-place-card-actions">
                <button
                  type="button"
                  className="gym-place-action is-primary"
                  onClick={() => {
                    if (matched) {
                      rivalBridge?.openChat?.(partner);
                      return;
                    }
                    if (!looking) {
                      goRivalProfile();
                      return;
                    }
                    rivalBridge?.handleChatRequest?.(partner);
                  }}
                >
                  {matched
                    ? "대화하기"
                    : requested
                      ? "관심 취소"
                      : looking
                        ? "관심 보내기"
                        : "명패에서 카드 공개"}
                </button>
              </div>
            ) : (
              <p className="gym-map-sheet-caption">내 라이벌 카드입니다.</p>
            )}
          </div>
        </article>
      );
    }

    if (selectedRivalArea && activeLayer === "sparring") {
      return (
        <div className="rival-area-panel">
          {rivalsInArea.length === 0 ? (
            <div className="gym-state-card">
              <strong>이 권역에 공개 중인 라이벌이 없습니다</strong>
            </div>
          ) : (
            <div className="gym-result-list rival-area-list">
              {rivalsInArea.map((partner) => renderRivalRow(partner))}
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  const sidePanelOpen = Boolean(
    detailGym || selectedGym || selectedRivalPartner || selectedRivalArea
  );

  const sidePanelTitle = detailGym
    ? detailGym.name
    : selectedGym
      ? selectedGym.name
      : selectedRivalPartner
        ? selectedRivalPartner.nickname
        : selectedRivalArea
          ? selectedRivalArea.label
          : "장소";

  return (
    <div
      className={`gym-map-service-stage${sidePanelOpen ? " is-side-open" : ""}`}
    >
      <Suspense fallback={<div className="gym-map-loading">지도를 여는 중...</div>}>
        <GymMapPanel
          center={position}
          gyms={mapGyms}
          selectedGym={selectedGym}
          rivalAreas={activeLayer === "sparring" ? rivalAreas : []}
          selectedRivalArea={selectedRivalArea}
          overlay={mapOverlay}
          onSelect={selectGymOnMap}
          onSelectRival={selectRivalOnMap}
        />
      </Suspense>

      {locateControl}
      {resultSheet}
      {searchModal}
      {filterSheet}
      {sideMenu}
      {activeLayer === "sparring" && rivalContent ? (
        <div className="gym-rival-bridge-host" aria-hidden="true">
          {rivalContent}
        </div>
      ) : null}

      <GymMapSidePanel
        open={sidePanelOpen}
        title={sidePanelTitle}
        onClose={closeSidePanel}
      >
        {renderSidePanelContent()}
      </GymMapSidePanel>

      {utilityOverlay}

      {inquiryGym ? (
        <GymInquiryModal
          gym={inquiryGym}
          userId={userId}
          nickname={profile?.nickname || ""}
          initialKind={inquiryKind}
          onClose={() => setInquiryGym(null)}
        />
      ) : null}

      <GymInquiryChatModal
        open={Boolean(chatInquiry)}
        onClose={closeChatAndRefresh}
        userId={userId}
        nickname={profile?.nickname || ""}
        inquiryId={chatInquiry?.id}
        gymName={chatInquiry?.gymName || ""}
        inquiryLabel={inquiryKindLabel(chatInquiry?.kind)}
        acquisitionSource={chatInquiry?.acquisitionSource || "organic"}
      />
    </div>
  );
}
