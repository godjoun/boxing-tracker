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
import GymMapSidePanel from "../../components/GymMapSidePanel";
import GymSentInquiriesPanel from "../../components/GymSentInquiriesPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import { searchOsmBoxingGyms } from "../../api/osmGymApi";
import { inquiryKindLabel } from "../../utils/gymInquiry";
import { useTraining } from "../../store/TrainingContext";
import {
  getDistanceKm,
  getSavedLocation,
  isNearbyMapGym,
  resolveSearchLocation,
  suggestAreas,
  findAreaByQuery,
} from "../../utils/gymSearch";
import {
  isOwnListedGym,
  loadApprovedGymsForSearch,
  mergeGymSearchResults,
  coverGymPhoto,
  splitFeaturedGyms,
} from "../../utils/gymListing";
import {
  getFavoriteGyms,
  toggleFavoriteGym,
} from "../../utils/gymFavorites";
import { BRAND_NAME } from "../../utils/brand";
import { groupRivalsByArea } from "../../utils/rivalAreaMap";
import MenuIcon from "../../components/MenuIcon";

const GymMapPanel = lazy(() => import("../../components/GymMapPanel"));

const MAP_OVERVIEW = {
  lat: 36.45,
  lon: 127.85,
  label: "대한민국",
  source: "overview",
};

export default function NearbyGymsPanel({
  categoryNav = null,
  activeLayer = "gyms",
  onSelectLayer,
  onGoHome,
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
  const mapGyms =
    activeLayer === "favorites"
      ? favoriteGyms
      : activeLayer === "gyms"
        ? gyms
        : [];
  const popularGyms = useMemo(() => {
    const registered = gyms.filter((gym) => gym.source === "listing");
    const { featured, rest } = splitFeaturedGyms(registered);
    return [...featured, ...rest].slice(0, 3);
  }, [gyms]);

  useEffect(() => {
    if (prevLayerRef.current === activeLayer) return;
    prevLayerRef.current = activeLayer;
    const timer = window.setTimeout(() => {
      setDetailGym(null);
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setSelectedRivalPartner(null);
      setHomeGymNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLayer]);

  useEffect(() => {
    if (!meetingRequest) return;
    switchSection("meeting");
    closeSidePanel();
  }, [meetingRequest]);

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

  function handleRegionSubmit(event) {
    event.preventDefault();
    const q = regionQuery.trim();
    if (!q) {
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

  const mapOverlay = (
    <div className="gym-map-overlay-controls">
      <form className="gym-map-region-search" onSubmit={handleRegionSubmit}>
        <button
          type="button"
          className={`gym-map-search-menu${sideMenuOpen ? " is-active" : ""}`}
          aria-expanded={sideMenuOpen}
          aria-controls="gym-map-side-menu"
          aria-label="더보기 메뉴"
          onClick={() => setSideMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <input
          type="search"
          value={regionQuery}
          onChange={(event) => handleRegionChange(event.target.value)}
          placeholder="체육관 · 라이벌 찾기"
          aria-label="체육관 또는 지역 검색"
          autoComplete="off"
          enterKeyHint="search"
        />
          <button type="submit" disabled={status === "loading"} aria-label="검색">
            {status === "loading" ? "…" : "찾기"}
          </button>
      </form>
      {categoryNav}
      {activeLayer === "gyms" && popularGyms.length > 0 ? (
        <section className="gym-map-popular" aria-label="지금 주변 인기 체육관">
          <div className="gym-map-popular-head">
            <strong>지금 주변 인기 체육관</strong>
            <span>입점관</span>
          </div>
          <div className="gym-map-popular-scroll">
            {popularGyms.map((gym, index) => {
              const cover = coverGymPhoto(gym);
              return (
                <button
                  key={gym.id}
                  type="button"
                  className="gym-map-popular-card"
                  onClick={() => selectGymOnMap(gym)}
                >
                  <span className="gym-map-popular-rank">{index + 1}</span>
                  {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                  <span>
                    <strong>{gym.name}</strong>
                    <small>
                      {[gym.distanceLabel, gym.address]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
      {suggestions.length > 0 ? (
        <div className="gym-map-region-suggestions" role="listbox">
          {suggestions.map((area) => (
            <button
              key={area.id}
              type="button"
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
    </div>
  );

  const sideRail = (
    <aside className="gym-map-side-rail" aria-label="짐 바로가기">
      {onGoHome ? (
        <button
          type="button"
          className="gym-map-side-item"
          title="홈"
          aria-label="홈"
          onClick={() => {
            closeSideMenu();
            onGoHome();
          }}
        >
          <span className="gym-map-side-icon" aria-hidden="true">
            <MenuIcon name="home" size={18} />
          </span>
        </button>
      ) : null}
      {activeLayer !== "gyms" || section !== "find" ? (
        <button
          type="button"
          className="gym-map-side-item"
          title="지도"
          aria-label="지도"
          onClick={() => {
            onSelectLayer?.("gyms");
            switchSection("find");
          }}
        >
          <span aria-hidden="true">◎</span>
        </button>
      ) : null}
    </aside>
  );

  const bottomDock = (
    <nav className="gym-map-bottom-dock" aria-label="짐 메뉴">
      <button
        type="button"
        className={activeLayer === "gyms" && section === "find" ? "is-active" : ""}
        onClick={() => {
          onSelectLayer?.("gyms");
          switchSection("find");
          closeSidePanel();
        }}
      >
        <span aria-hidden="true">⌖</span>
        <small>발견</small>
      </button>
      <button
        type="button"
        className={section === "sent" ? "is-active" : ""}
        onClick={() => switchSection("sent")}
      >
        <span aria-hidden="true">✉</span>
        <small>문의</small>
      </button>
      <button
        type="button"
        className={section === "meeting" ? "is-active" : ""}
        onClick={() => switchSection("meeting")}
      >
        <span aria-hidden="true">◌</span>
        <small>모임</small>
      </button>
      <button
        type="button"
        className={activeLayer === "favorites" ? "is-active" : ""}
        onClick={() => {
          onSelectLayer?.("favorites");
          switchSection("find");
          closeSidePanel();
        }}
      >
        <span aria-hidden="true">☆</span>
        <small>저장</small>
      </button>
    </nav>
  );

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
          {onGoHome ? (
            <button
              type="button"
              className="gym-map-side-menu-item"
              onClick={() => runFromSideMenu(() => onGoHome())}
            >
              홈으로
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

      {sideRail}
      {bottomDock}
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
