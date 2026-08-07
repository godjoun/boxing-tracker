import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { track } from "@vercel/analytics";
import GymDetailPanel from "../../components/GymDetailPanel";
import CommunityFeedPanel from "./CommunityFeedPanel";
import ExchangeBoardPanel from "./ExchangeBoardPanel";
import ExchangeHubPanel from "./ExchangeHubPanel";
import MeActivityPanel from "./MeActivityPanel";
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
  getGymSearchCityLabel,
  getListedGymsByCity,
  getUnlocatedListedGyms,
  getSavedLocation,
  isNearbyMapGym,
  resolveGpsSearchLocation,
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
import GymExchangeEventPanel from "../../components/GymExchangeEventPanel";
import { getPublishableGymExchangeEventById } from "../../data/gymExchangeEvent";
import { RELEASE_SCOPE } from "../../utils/releaseScope";

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
  { id: "feed", label: "피드" },
  { id: "hub", label: "교류" },
  ...(RELEASE_SCOPE.rivals ? [{ id: "sparring", label: "스파링" }] : []),
  { id: "gyms", label: "체육관" },
  { id: "meeting", label: "모임" },
];

const isFeedOrHub = (layer) => layer === "feed" || layer === "hub";

export default function NearbyGymsPanel({
  activeLayer = "feed",
  onSelectLayer,
  onMeetingSectionChange,
  onGoRivalProfile,
  rivals = [],
  rivalBridge = null,
  rivalContent = null,
  focusGymExchangeEventId = null,
  onGymExchangeFocusConsumed,
}) {
  const { profile, userId, updateProfile } = useTraining();
  const [section, setSection] = useState("find");
  const [status, setStatus] = useState("idle");
  const [gyms, setGyms] = useState([]);
  const [allListedGyms, setAllListedGyms] = useState([]);
  const [gymListScope, setGymListScope] = useState("nearby");
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedRivalArea, setSelectedRivalArea] = useState(null);
  const [selectedRivalPartner, setSelectedRivalPartner] = useState(null);
  const [favoriteGyms, setFavoriteGyms] = useState(getFavoriteGyms);
  const [position, setPosition] = useState(MAP_OVERVIEW);
  const [inquiryGym, setInquiryGym] = useState(null);
  const [inquiryKind, setInquiryKind] = useState("trial");
  const [inquiryIntent, setInquiryIntent] = useState("inquiry");
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
  const [meetingFocus, setMeetingFocus] = useState(null);
  const [gymExchangeEvent, setGymExchangeEvent] = useState(null);
  const initialAreaLoaded = useRef(false);
  const prevLayerRef = useRef(activeLayer);
  const searchRequestIdRef = useRef(0);

  const gymExchangeDetailEvent =
    gymExchangeEvent ||
    (focusGymExchangeEventId
      ? getPublishableGymExchangeEventById(focusGymExchangeEventId)
      : null);

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
      activeLayer === "favorites" ||
      (activeLayer === "gyms" && gymListScope === "favorites")
        ? favoriteGyms
        : activeLayer === "gyms"
          ? gyms
          : [];
    return base.filter((gym) => {
      if (!Number.isFinite(Number(gym.distanceKm))) return true;
      return Number(gym.distanceKm) <= distanceLimitKm;
    });
  }, [activeLayer, favoriteGyms, gyms, distanceLimitKm, gymListScope]);
  const approvedListedGyms = useMemo(
    () =>
      allListedGyms
        .filter((gym) => gym.source === "listing" && !gym.ownerPreview)
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (b.featured && !a.featured) return 1;
          return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
        }),
    [allListedGyms]
  );
  const searchCityLabel = useMemo(
    () => getGymSearchCityLabel(position),
    [position]
  );
  const cityListedGyms = useMemo(() => {
    const cityMatches = getListedGymsByCity(
      approvedListedGyms,
      searchCityLabel,
      position
    );
    if (cityMatches.length > 0 || searchCityLabel !== "현재 지역") {
      return cityMatches;
    }
    return approvedListedGyms.filter(
      (gym) => Number(gym.distanceKm) <= distanceLimitKm
    );
  }, [approvedListedGyms, distanceLimitKm, position, searchCityLabel]);
  const unlocatedListedGyms = useMemo(
    () => getUnlocatedListedGyms(approvedListedGyms),
    [approvedListedGyms]
  );
  const visibleGyms =
    activeLayer === "gyms" && gymListScope === "listed"
      ? approvedListedGyms
      : activeLayer === "gyms" && gymListScope === "favorites"
        ? favoriteGyms
        : activeLayer === "favorites"
          ? favoriteGyms
          : mapGyms;

  useEffect(() => {
    if (prevLayerRef.current === activeLayer) return;
    prevLayerRef.current = activeLayer;
    const timer = window.setTimeout(() => {
      setDetailGym(null);
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setSelectedRivalPartner(null);
      setHomeGymNotice("");
      setGymListScope("nearby");
      if (activeLayer === "meeting") {
        setSection("meeting");
        onMeetingSectionChange?.(true);
      } else if (activeLayer === "me") {
        setSection("me");
        onMeetingSectionChange?.(false);
      } else {
        setSection("find");
        onMeetingSectionChange?.(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLayer, onMeetingSectionChange]);

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
      if (activeLayer === "meeting" || activeLayer === "me") {
        onSelectLayer?.("feed");
      }
      return true;
    }
    if (
      activeLayer === "favorites" ||
      activeLayer === "sparring" ||
      activeLayer === "gyms" ||
      activeLayer === "meeting" ||
      activeLayer === "hub"
    ) {
      onSelectLayer?.("feed");
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
    setInquiryIntent("inquiry");
    setInquiryGym(gym);
  }

  function openReservation(gym) {
    if (gym?.source !== "listing") return;
    track("gym_reservation_open", {
      gymId: gym.id,
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setInquiryKind("reservation");
    setInquiryIntent("inquiry");
    setInquiryGym(gym);
  }

  function openProposal(gym) {
    if (gym?.source !== "listing") return;
    track("gym_exchange_proposal_open", {
      gymId: gym.id,
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setInquiryKind("reservation");
    setInquiryIntent("exchange-proposal");
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
    const requestId = ++searchRequestIdRef.current;

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

      if (requestId !== searchRequestIdRef.current) return;
      setPosition(currentPosition);
      setGymListScope("nearby");
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setDetailGym(null);

      const osmRequest = searchOsmBoxingGyms({
          lat: currentPosition.lat,
          lon: currentPosition.lon,
        }).then(
          (value) => ({ status: "fulfilled", value }),
          (reason) => ({ status: "rejected", reason })
        );
      let listedRaw = [];
      let listedFailed = false;
      try {
        listedRaw = await loadApprovedGymsForSearch(
          currentPosition.lat,
          currentPosition.lon,
          {
          userId,
          }
        );
      } catch (error) {
        listedFailed = true;
        console.error("Approved gym listing search failed", error);
      }

      if (requestId !== searchRequestIdRef.current) return;
      setAllListedGyms(listedRaw);
      const listed = listedRaw.filter((gym) =>
        isNearbyMapGym(gym, currentPosition)
      );
      setGyms(listed);
      setStatus(listed.length > 0 || listedRaw.length > 0 ? "ready" : "loading");

      let osmGyms = [];
      let osmFailed = false;
      const osmResult = await osmRequest;
      if (osmResult.status === "fulfilled") {
        osmGyms = osmResult.value.map((gym) => {
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
        });
      } else {
        osmFailed = true;
        console.warn("OSM gym search delayed", osmResult.reason);
      }

      if (requestId !== searchRequestIdRef.current) return;
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
      if (merged.length > 0) {
        setStatus("ready");
      } else if (listedFailed && osmFailed) {
        setStatus("error");
      } else {
        setStatus("empty");
      }
    } catch (loadError) {
      console.error("Gym map search failed", loadError);
      if (requestId === searchRequestIdRef.current) {
        setStatus("error");
      }
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
  }

  async function runRegionSearch(label) {
    const q = String(label || "").trim();
    if (!q) return;
    track("gym_region_search", { query: q });
    setRecentSearches(writeRecentSearch(q));
    setRegionQuery(q);
    closeSearch();
    await loadGyms({ query: q, allowFallback: false });
    onSelectLayer?.("gyms");
    if (section !== "find") {
      switchSection("find");
    }
    setGymListScope("nearby");
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
          const gpsPosition = {
            lat: result.coords.latitude,
            lon: result.coords.longitude,
            label: "내 위치",
            source: "gps",
            accuracy: result.coords.accuracy,
          };
          saveGymSearchLocation(gpsPosition);
          const [, resolvedLocation] = await Promise.all([
            loadGyms({ allowFallback: true }),
            resolveGpsSearchLocation(gpsPosition),
          ]);
          if (resolvedLocation?.cityLabel) {
            saveGymSearchLocation(resolvedLocation);
            setPosition((current) =>
              Number(current?.lat) === Number(resolvedLocation.lat) &&
              Number(current?.lon) === Number(resolvedLocation.lon)
                ? resolvedLocation
                : current
            );
          }
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        if (!getSavedLocation()) {
          openSearch();
          return;
        }
        loadGyms({ allowFallback: true });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  const hasMapAnchor =
    (position?.source && position.source !== "overview") ||
    Boolean(getSavedLocation()) ||
    gyms.length > 0;
  const needsLocationGate =
    section === "find" && activeLayer === "gyms" && !hasMapAnchor;

  const firstUseGateTracked = useRef(false);

  useEffect(() => {
    if (!needsLocationGate || status === "loading" || firstUseGateTracked.current) {
      return;
    }
    firstUseGateTracked.current = true;
    track("gym_first_use_gate_view");
  }, [needsLocationGate, status]);

  function startNearbySearch() {
    track("gym_first_use_locate");
    handleMyLocation();
  }

  function startRegionSearch() {
    track("gym_first_use_search");
    openSearch();
  }

  const visibleSummary =
    activeLayer === "sparring"
      ? `${rivalAreas.length}개 권역 · ${rivals.length}명`
      : activeLayer === "favorites"
        ? `${mapGyms.length}곳`
        : status === "loading" &&
            mapGyms.length === 0 &&
            approvedListedGyms.length === 0
          ? "검색 중"
          : mapGyms.length > 0 || approvedListedGyms.length > 0
            ? `${searchCityLabel} 입점 ${cityListedGyms.length}`
            : "지역 선택";
  const placeSearchLabel =
    activeLayer === "sparring"
      ? "활동 권역을 눌러 프로필 보기"
      : position?.label && position.source !== "overview"
      ? `${position.label} 주변 복싱장`
      : "지역 · 체육관 검색";

  const mapOverlay = (
    <div
      className={`gym-map-overlay-controls is-discovery${
        needsLocationGate ? " is-first-use" : ""
      }`}
    >
        <div className="gym-map-top-stack">
          <header className="gym-community-head">
            <div className="gym-community-head-copy">
              <h1>커뮤니티</h1>
            </div>
            <button
              type="button"
              className="gym-community-me-btn"
              aria-label="내 활동"
              onClick={() => {
                onSelectLayer?.("me");
                switchSection("me");
              }}
            >
              나
            </button>
          </header>

          <nav className="gym-map-layer-row" aria-label="커뮤니티 카테고리">
            {LAYER_FILTERS.map((item) => {
              const active =
                item.id === "meeting"
                  ? activeLayer === "meeting" || section === "meeting"
                  : activeLayer === item.id &&
                    section !== "meeting" &&
                    section !== "me";
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "is-active" : ""}
                  onClick={() => {
                    onSelectLayer?.(item.id);
                    if (item.id === "meeting") {
                      setMeetingFocus(null);
                      switchSection("meeting");
                      return;
                    }
                    if (section !== "find") {
                      switchSection("find");
                    }
                    if (item.id === "gyms" && !hasMapAnchor) {
                      return;
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {!isFeedOrHub(activeLayer) ? (
            <>
          <div className="gym-map-search-pill-row">
            <button
              type="button"
              className="gym-map-search-pill"
              aria-label={
                activeLayer === "sparring"
                  ? "공개 라이벌 프로필 목록 열기"
                  : "지역 선택"
              }
              onClick={
                activeLayer === "sparring"
                  ? () => undefined
                  : needsLocationGate
                    ? startRegionSearch
                    : openSearch
              }
            >
              <span aria-hidden="true">
                {activeLayer === "sparring" ? "◎" : "⌕"}
              </span>
              <strong>
                {activeLayer === "sparring"
                  ? placeSearchLabel
                  : needsLocationGate
                    ? "지역을 선택하세요"
                    : placeSearchLabel}
              </strong>
              <small>
                {activeLayer === "sparring"
                  ? visibleSummary
                  : needsLocationGate
                    ? "선택 후 아래 목록에 표시"
                    : visibleSummary}
              </small>
            </button>

            <div className="gym-map-top-bar-actions">
              {activeLayer !== "sparring" ? (
                <button
                  type="button"
                  className="gym-map-locate-chip"
                  aria-label="내 위치"
                  disabled={locating || status === "loading"}
                  onClick={handleMyLocation}
                >
                  {locating ? "위치…" : "내 위치"}
                </button>
              ) : null}
              {!needsLocationGate ? (
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
              ) : null}
              {!needsLocationGate ? (
                <button
                  type="button"
                  className={`gym-map-chrome-btn${
                    sideMenuOpen ? " is-active" : ""
                  }`}
                  aria-expanded={sideMenuOpen}
                  aria-controls="gym-map-side-menu"
                  aria-label="더보기 메뉴"
                  onClick={() => setSideMenuOpen((open) => !open)}
                >
                  <span aria-hidden="true">☰</span>
                </button>
              ) : null}
            </div>
          </div>

          {!needsLocationGate ? (
            <div className="gym-map-context-strip" aria-label="지도 요약">
              <span>
                {activeLayer === "sparring"
                  ? `라이벌 권역 ${rivalAreas.length}`
                  : activeLayer === "favorites" || gymListScope === "favorites"
                    ? `찜 ${favoriteGyms.length}`
                    : `${searchCityLabel} 입점관 ${cityListedGyms.length}`}
              </span>
              {activeLayer !== "sparring" ? (
                <button type="button" onClick={openFilter}>
                  반경 {distanceLimitKm}km
                </button>
              ) : (
                <span>{`라이벌 ${rivals.length}명`}</span>
              )}
            </div>
          ) : null}
            </>
          ) : null}
        </div>
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

  const firstUseGate =
    needsLocationGate ? (
      <div className="gym-first-gate" role="region" aria-label="체육관 지역 선택">
        {status === "loading" || locating ? (
          <>
            <h2>체육관을 찾는 중</h2>
            <p>선택한 지역의 목록을 준비하고 있습니다.</p>
          </>
        ) : (
          <>
            <h2>다닐 체육관 찾기</h2>
            <p>지역을 고르면 아래에 체육관 목록이 나타납니다.</p>
            <button
              type="button"
              className="gym-first-gate-primary"
              onClick={startRegionSearch}
            >
              지역 선택
            </button>
            <button
              type="button"
              className="gym-first-gate-secondary"
              disabled={locating || status === "loading"}
              onClick={startNearbySearch}
            >
              내 주변으로 찾기
            </button>
            <div className="gym-first-gate-regions" aria-label="추천 지역">
              {QUICK_REGIONS.slice(0, 4).map((area) => (
                <button
                  key={area.id}
                  type="button"
                  className="gym-first-gate-region"
                  onClick={() => {
                    track("gym_first_use_quick_region", { region: area.label });
                    runRegionSearch(area.label);
                  }}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    ) : null;

  const openMeetingCompose = () => {
    setMeetingFocus({ compose: true, nonce: Date.now() });
    onSelectLayer?.("meeting");
    switchSection("meeting");
  };

  const openMeetingEvent = (event, { isPast = false } = {}) => {
    setMeetingFocus({
      eventId: event?.id || null,
      showPast: Boolean(isPast || event?.isPast),
      nonce: Date.now(),
    });
    onSelectLayer?.("meeting");
    switchSection("meeting");
  };

  const sheetTitle =
    needsLocationGate
      ? "짐 찾기"
      : isFeedOrHub(activeLayer)
        ? ""
        : activeLayer === "favorites" || gymListScope === "favorites"
      ? "찜한 체육관"
        : activeLayer === "sparring"
        ? "공개 라이벌"
        : gymListScope === "listed"
          ? "전체 입점관"
          : position?.source === "gps"
            ? "내 주변 체육관"
            : `${searchCityLabel} 체육관`;
  const sheetCount =
    needsLocationGate || isFeedOrHub(activeLayer)
      ? 0
      : activeLayer === "sparring"
      ? rivals.length
      : visibleGyms.length;

  const sheetListContent = needsLocationGate
    ? firstUseGate
    : activeLayer === "feed" ? (
      <CommunityFeedPanel
        onOpenEvent={openMeetingEvent}
        onCompose={openMeetingCompose}
      />
    ) : activeLayer === "hub" ? (
      <ExchangeHubPanel
        onOpenMeetings={() => {
          setMeetingFocus(null);
          onSelectLayer?.("meeting");
          switchSection("meeting");
        }}
        onComposeMeeting={openMeetingCompose}
        onOpenGyms={() => {
          onSelectLayer?.("gyms");
          switchSection("find");
        }}
        onOpenEvent={openMeetingEvent}
        onOpenGymExchangeEvent={(event) => {
          setGymExchangeEvent(event);
        }}
        onOpenRivals={() => {
          onSelectLayer?.("sparring");
          switchSection("find");
        }}
        onOpenMe={() => {
          onSelectLayer?.("me");
          switchSection("me");
        }}
      />
    ) : activeLayer === "sparring" ? (
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
    ) : visibleGyms.length === 0 ? (
      <div className="gym-state-card">
        <strong>
          {activeLayer === "favorites" || gymListScope === "favorites"
            ? "찜한 체육관이 없습니다"
            : status === "loading"
              ? "체육관을 찾는 중"
              : gymListScope === "listed"
                ? "등록된 입점관이 없습니다"
                : "이 지역 결과가 없습니다"}
        </strong>
        <p>
          {activeLayer === "favorites" || gymListScope === "favorites"
            ? "지도에서 마음에 드는 관을 찜해 보세요."
            : gymListScope === "listed"
              ? "입점 승인된 체육관이 여기에 모입니다."
              : "🔍 로 지역을 검색하거나 내 위치로 찾아보세요."}
        </p>
      </div>
    ) : (
      <div className="gym-result-list">
        {activeLayer === "gyms" &&
        gymListScope === "listed" &&
        unlocatedListedGyms.length > 0 ? (
          <div className="gym-location-quality-note" role="status">
            <strong>위치 확인 필요 {unlocatedListedGyms.length}곳</strong>
            <span>지도 위치를 등록하면 도시 집계가 더 정확해집니다.</span>
          </div>
        ) : null}
        {visibleGyms.map((gym, index) => (
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

  const resultSheet =
    section === "find" ? (
      <GymMapSheet
        variant="page"
        snap="full"
        title={sheetTitle}
        count={sheetCount}
        subtitle={
          needsLocationGate
            ? ""
            : activeLayer === "sparring"
              ? "활동 권역 기준 · 정확한 위치 비공개"
              : activeLayer === "gyms" && gymListScope === "listed"
              ? unlocatedListedGyms.length > 0
                ? `승인된 입점관 · 위치 확인 필요 ${unlocatedListedGyms.length}`
                : "승인된 입점관"
              : position?.label && position.source !== "overview"
                ? position.label
                : ""
        }
        filters={
          !needsLocationGate && activeLayer === "gyms" ? (
            <div className="gym-map-scope-tabs" role="group" aria-label="체육관 범위">
              <button
                type="button"
                className={gymListScope === "nearby" ? "is-active" : ""}
                aria-pressed={gymListScope === "nearby"}
                onClick={() => {
                  setGymListScope("nearby");
                  setSelectedGym(null);
                }}
              >
                내 주변 <em>{mapGyms.length}</em>
              </button>
              <button
                type="button"
                className={gymListScope === "listed" ? "is-active" : ""}
                aria-pressed={gymListScope === "listed"}
                onClick={() => {
                  setGymListScope("listed");
                  setSelectedGym(null);
                }}
              >
                전체 입점관 <em>{approvedListedGyms.length}</em>
              </button>
              <button
                type="button"
                className={gymListScope === "favorites" ? "is-active" : ""}
                aria-pressed={gymListScope === "favorites"}
                onClick={() => {
                  setGymListScope("favorites");
                  setSelectedGym(null);
                }}
              >
                찜 <em>{favoriteGyms.length}</em>
              </button>
            </div>
          ) : null
        }
        headAction={
          needsLocationGate ||
          isFeedOrHub(activeLayer) ||
          activeLayer === "sparring" ||
          (activeLayer === "gyms" && gymListScope === "listed") ? null : (
            <button
              type="button"
              className="gym-map-sheet-filter-btn"
              aria-label="필터"
              onClick={openFilter}
            >
              필터
            </button>
          )
        }
      >
        {needsLocationGate ? firstUseGate : sheetListContent}
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
          {RELEASE_SCOPE.rivals ? (
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
          ) : null}
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
          {RELEASE_SCOPE.rivals ? (
            <button
              type="button"
              className="gym-map-side-menu-item"
              onClick={() => runFromSideMenu(() => goRivalProfile())}
            >
              명패 · 라이벌 카드
            </button>
          ) : null}
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
                목록으로
              </button>
            </div>
          </>
        ) : null}

        <p className="gym-map-side-menu-note">
          목록에 없는 체육관은 등록해 주세요. 승인 후 다른 사용자도 찾을 수
          있습니다.
        </p>
      </nav>
    </>
  ) : null;

  const utilityOverlay =
    section === "sent" ||
    section === "meeting" ||
    section === "owner" ||
    section === "me" ||
    activeLayer === "me" ? (
      <div className="gym-map-utility-overlay" role="dialog" aria-modal="true">
        <button
          type="button"
          className="gym-utility-back"
          onClick={() => {
            if (section === "me" || activeLayer === "me") {
              onSelectLayer?.("feed");
              switchSection("find");
              return;
            }
            goBack();
          }}
        >
          ← 뒤로
        </button>
        {section === "me" || activeLayer === "me" ? (
          <MeActivityPanel
            onOpenHub={() => {
              onSelectLayer?.("feed");
              switchSection("find");
            }}
            onOpenGyms={() => {
              onSelectLayer?.("gyms");
              switchSection("find");
            }}
            onOpenRivals={() => {
              onSelectLayer?.("sparring");
              switchSection("find");
            }}
            onOpenMeetings={() => {
              onSelectLayer?.("meeting");
              switchSection("meeting");
            }}
            onGoRivalProfile={onGoRivalProfile}
          />
        ) : null}
        {section === "sent" ? (
          <GymSentInquiriesPanel
            userId={userId}
            embedded
            refreshKey={inboxRefreshKey}
            onOpenChat={openInquiryChat}
          />
        ) : null}
        {section === "meeting" ? (
          <ExchangeBoardPanel
            key={
              meetingFocus?.nonce
                ? `meeting-focus-${meetingFocus.nonce}`
                : "meeting-board"
            }
            embedded
            onGoBack={goBack}
            initialEventId={meetingFocus?.eventId || null}
            initialCompose={Boolean(meetingFocus?.compose)}
            initialShowPast={Boolean(meetingFocus?.showPast)}
          />
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
        className="gym-result-row is-tappable is-rival-profile"
        onClick={() => {
          setSelectedRivalPartner(partner);
          setSelectedRivalArea(null);
          setSelectedGym(null);
          setDetailGym(null);
        }}
      >
        <div className="gym-result-row-thumb rival-thumb" aria-hidden="true">
          <span>{String(partner.nickname || "R").slice(0, 1)}</span>
        </div>
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
        <span className="rival-profile-row-open" aria-hidden="true">›</span>
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
          onPropose={openProposal}
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
          <div className="gym-place-card-body">
            <div className="rival-profile-identity">
              <span className="rival-profile-avatar" aria-hidden="true">
                {String(partner.nickname || "R").slice(0, 1)}
              </span>
              <div>
                <p className="gym-place-card-eyebrow">공개 라이벌 프로필</p>
                <h3>{partner.nickname}</h3>
                <small>
                  {partner.area || selectedRivalArea?.label || "활동 지역"}
                  {" · 활동 권역"}
                </small>
              </div>
              {matched ? <em className="rival-place-badge">매칭</em> : null}
            </div>
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
            <p className="rival-profile-privacy">
              정확한 위치와 연락처는 공개하지 않습니다.
            </p>
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
          <section className="rival-area-summary">
            <p>ACTIVITY AREA</p>
            <strong>{selectedRivalArea.label}</strong>
            <span>
              공개 프로필 {rivalsInArea.length}명 · 정확한 위치는 표시하지 않음
            </span>
          </section>
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
      className={`gym-map-service-stage is-list-only${
        sidePanelOpen ? " is-side-open" : ""
      }`}
    >
      {mapOverlay}
      {locateControl}
      {resultSheet}
      {searchModal}
      {filterSheet}
      {sideMenu}
      {activeLayer === "sparring" || isFeedOrHub(activeLayer) ? (
        rivalContent ? (
          <div className="gym-rival-bridge-host" aria-hidden="true">
            {rivalContent}
          </div>
        ) : null
      ) : null}

      <GymMapSidePanel
        open={sidePanelOpen}
        title={sidePanelTitle}
        onClose={closeSidePanel}
      >
        {renderSidePanelContent()}
      </GymMapSidePanel>

      {utilityOverlay}

      {gymExchangeDetailEvent ? (
        <div className="gym-exchange-detail-overlay" role="dialog" aria-modal="true">
          <GymExchangeEventPanel
            key={gymExchangeDetailEvent.id}
            event={gymExchangeDetailEvent}
            onClose={() => {
              setGymExchangeEvent(null);
              onGymExchangeFocusConsumed?.();
            }}
          />
        </div>
      ) : null}

      {inquiryGym ? (
        <GymInquiryModal
          gym={inquiryGym}
          userId={userId}
          nickname={profile?.nickname || ""}
          initialKind={inquiryKind}
          initialIntent={inquiryIntent}
          onClose={() => {
            setInquiryGym(null);
            setInquiryIntent("inquiry");
          }}
        />
      ) : null}

      <GymInquiryChatModal
        open={Boolean(chatInquiry)}
        onClose={closeChatAndRefresh}
        userId={userId}
        nickname={profile?.nickname || ""}
        inquiryId={chatInquiry?.id}
        gymName={chatInquiry?.gymName || ""}
        inquiryLabel={inquiryKindLabel(chatInquiry?.kind, chatInquiry?.memo)}
        acquisitionSource={chatInquiry?.acquisitionSource || "organic"}
      />
    </div>
  );
}
