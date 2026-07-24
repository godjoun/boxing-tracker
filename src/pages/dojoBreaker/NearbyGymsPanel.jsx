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
import GymInquiryChatModal from "../../components/GymInquiryChatModal";
import GymInquiryModal from "../../components/GymInquiryModal";
import GymInquiryLedgerPanel from "../../components/GymInquiryLedgerPanel";
import GymMapSheet from "../../components/GymMapSheet";
import GymSentInquiriesPanel from "../../components/GymSentInquiriesPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import { searchOsmBoxingGyms } from "../../api/osmGymApi";
import { inquiryKindLabel } from "../../utils/gymInquiry";
import { useTraining } from "../../store/TrainingContext";
import {
  getDistanceKm,
  getLocationSourceLabel,
  getSavedLocation,
  isNearbyMapGym,
  PRESET_AREAS,
  resolveSearchLocation,
  suggestAreas,
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
import GymResultCard from "./GymResultCard";

const GymMapPanel = lazy(() => import("../../components/GymMapPanel"));

const MAP_OVERVIEW = {
  lat: 36.45,
  lon: 127.85,
  label: "대한민국",
  source: "overview",
};

const LAYER_META = {
  gyms: { title: "체육관", empty: "이 지역에서 복싱장을 찾지 못했습니다" },
  favorites: { title: "찜", empty: "아직 찜한 체육관이 없습니다" },
  sparring: { title: "라이벌", empty: "공개 중인 라이벌이 없습니다" },
};

export default function NearbyGymsPanel({
  categoryNav = null,
  activeLayer = "gyms",
  onSelectLayer,
  rivals = [],
  rivalContent = null,
}) {
  const { profile, userId, updateProfile } = useTraining();
  const [section, setSection] = useState("find");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedRivalArea, setSelectedRivalArea] = useState(null);
  const [favoriteGyms, setFavoriteGyms] = useState(getFavoriteGyms);
  const [position, setPosition] = useState(MAP_OVERVIEW);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const [inquiryKind, setInquiryKind] = useState("trial");
  const [detailGym, setDetailGym] = useState(null);
  const [sheetSnap, setSheetSnap] = useState("half");
  const [chatInquiry, setChatInquiry] = useState(null);
  const [ownerMode, setOwnerMode] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [registrationKind, setRegistrationKind] = useState("owner");
  const [homeGymNotice, setHomeGymNotice] = useState("");
  const [activePreset, setActivePreset] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);
  const initialAreaLoaded = useRef(false);
  const prevLayerRef = useRef(activeLayer);

  const rivalAreas = useMemo(() => groupRivalsByArea(rivals), [rivals]);
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

  const resultCount =
    activeLayer === "favorites"
      ? favoriteGyms.length
      : activeLayer === "sparring"
        ? rivals.length
        : gyms.length;

  const sheetSubtitle =
    position.source === "overview"
      ? "동네를 검색해 지도를 열어보세요"
      : `${position.label} · ${getLocationSourceLabel(position.source)}`;

  useEffect(() => {
    if (prevLayerRef.current === activeLayer) return;
    prevLayerRef.current = activeLayer;
    const timer = window.setTimeout(() => {
      setDetailGym(null);
      setSelectedGym(null);
      setSelectedRivalArea(null);
      setSheetSnap("half");
      setHomeGymNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLayer]);

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
    setSheetSnap("full");
  }

  function closeDetail() {
    setDetailGym(null);
    setSheetSnap("half");
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

  function openRegister(kind = "owner") {
    track("gym_listing_open");
    setEditingListing(null);
    setRegistrationKind(kind);
    setOwnerMode("register");
    setSection("owner");
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
    setError("");
    setLocationHint("");
    setActivePreset(preset);
    setSheetSnap("half");
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

      if (currentPosition.source === "search") {
        setLocationHint(`「${currentPosition.label}」 기준으로 검색했습니다.`);
      } else {
        setLocationHint("");
      }

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
      if (osmResult.status === "rejected") {
        setLocationHint(
          listed.length > 0
            ? `지도 장소 검색이 지연되어 ${BRAND_NAME} 입점관만 표시합니다.`
            : ""
        );
      }
      if (merged.length > 0) {
        setStatus("ready");
      } else if (osmResult.status === "rejected") {
        throw osmResult.reason;
      } else {
        setStatus("empty");
      }
    } catch (loadError) {
      setError(loadError.message || "검색 중 문제가 발생했습니다.");
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
      setError("시·구·동 단위로 지역을 입력해 주세요.");
      setStatus("error");
      setSheetSnap("half");
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
    setDetailGym(null);
    setSheetSnap("half");
  }

  function selectRivalOnMap(area) {
    setSelectedRivalArea(area);
    setSelectedGym(null);
    setDetailGym(null);
    setSheetSnap("peek");
  }

  const mapOverlay = (
    <div className="gym-map-overlay-controls">
      <div className="gym-map-search-row">
        <form className="gym-map-region-search" onSubmit={handleRegionSubmit}>
          <input
            type="search"
            value={regionQuery}
            onChange={(event) => handleRegionChange(event.target.value)}
            placeholder="예: 성수동, 수원 영통구"
            aria-label="지역 검색"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" disabled={status === "loading"}>
            검색
          </button>
        </form>
        {categoryNav}
      </div>
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
      <div className="gym-map-preset-row" aria-label="추천 지역">
        {PRESET_AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            className={`gym-map-preset-chip${
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
    </div>
  );

  const sideRail = (
    <aside className="gym-map-side-rail" aria-label="짐 메뉴">
      <button
        type="button"
        className={`gym-map-side-item${
          activeLayer === "favorites" ? " is-active" : ""
        }`}
        onClick={() => {
          onSelectLayer?.("favorites");
          setSheetSnap("half");
          setSection("find");
        }}
      >
        <span aria-hidden="true">♥</span>
        <em>찜</em>
      </button>
      <button
        type="button"
        className={`gym-map-side-item${section === "sent" ? " is-active" : ""}`}
        onClick={() => switchSection("sent")}
      >
        <span aria-hidden="true">✉</span>
        <em>문의</em>
      </button>
      <button
        type="button"
        className="gym-map-side-item"
        onClick={() => openRegister("community")}
      >
        <span aria-hidden="true">＋</span>
        <em>제보</em>
      </button>
      <button
        type="button"
        className={`gym-map-side-item${
          section === "owner" ? " is-active" : ""
        }`}
        onClick={() => {
          setSection("owner");
          setOwnerMode(null);
        }}
      >
        <span aria-hidden="true">⌂</span>
        <em>관장</em>
      </button>
      {activeLayer !== "gyms" || section !== "find" ? (
        <button
          type="button"
          className="gym-map-side-item"
          onClick={() => {
            onSelectLayer?.("gyms");
            switchSection("find");
          }}
        >
          <span aria-hidden="true">◎</span>
          <em>지도</em>
        </button>
      ) : null}
    </aside>
  );

  const utilityOverlay =
    section === "sent" || section === "owner" ? (
      <div className="gym-map-utility-overlay" role="dialog" aria-modal="true">
        <button
          type="button"
          className="gym-utility-back"
          onClick={() => switchSection("find")}
        >
          ← 지도로
        </button>
        {section === "sent" ? (
          <GymSentInquiriesPanel
            userId={userId}
            embedded
            refreshKey={inboxRefreshKey}
            onOpenChat={openInquiryChat}
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

  function renderSheetBody() {
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

    if (selectedRivalArea && activeLayer === "sparring") {
      return (
        <div className="gym-sheet-preview">
          <div>
            <span>동네 권역</span>
            <strong>{selectedRivalArea.label}</strong>
            <small>
              이 지역에서 라이벌 {selectedRivalArea.count}명을 찾았습니다.
            </small>
          </div>
          <span className="gym-rival-count">{selectedRivalArea.count}명</span>
        </div>
      );
    }

    if (activeLayer === "sparring") {
      return (
        <div className="gym-sheet-layer">
          <p className="gym-map-sheet-caption">
            지도에는 동네 권역만 표시됩니다. 아래 카드에서 관심을 보내세요.
          </p>
          {rivalContent}
        </div>
      );
    }

    if (activeLayer === "favorites") {
      if (favoriteGyms.length === 0) {
        return (
          <div className="gym-state-card">
            <strong>{LAYER_META.favorites.empty}</strong>
            <p>체육관 핀이나 카드에서 찜하면 이 지도에 함께 표시됩니다.</p>
          </div>
        );
      }
      return (
        <div className="gym-result-list">
          {favoriteGyms.map((gym, index) => (
            <GymResultCard
              key={gym.id}
              gym={gym}
              index={index}
              compact
              isOwn={isOwnListedGym(gym, userId)}
              onOpen={openDetail}
              onInquire={openInquiry}
              onFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      );
    }

    if (status === "loading") {
      return <div className="gym-state-card">주변 복싱장을 찾는 중입니다...</div>;
    }

    if (status === "error") {
      return (
        <div className="gym-state-card error">
          <strong>검색에 실패했습니다</strong>
          <p>{error}</p>
          <button
            type="button"
            className="gym-retry-button"
            onClick={() =>
              regionQuery.trim()
                ? loadGyms({ query: regionQuery.trim(), allowFallback: false })
                : setStatus("idle")
            }
          >
            다시 검색
          </button>
        </div>
      );
    }

    if (status === "empty") {
      return (
        <div className="gym-state-card">
          <strong>{LAYER_META.gyms.empty}</strong>
          <p>
            지역 범위를 넓혀 다시 검색해 보세요. 지도 정보는 OpenStreetMap
            등록 상태에 따라 달라질 수 있습니다.
          </p>
          <button
            type="button"
            className="gym-retry-button"
            onClick={() => openRegister("community")}
          >
            새 체육관 등록
          </button>
        </div>
      );
    }

    if (status === "idle" || position.source === "overview") {
      return (
        <div className="gym-state-card">
          <strong>어느 동네의 링을 찾을까요?</strong>
          <p>위 검색창에 시·구·동을 입력하면 지도와 결과가 함께 열립니다.</p>
        </div>
      );
    }

    return (
      <>
        {locationHint ? (
          <p className="gym-location-hint">{locationHint}</p>
        ) : null}
        <div className="gym-result-list">
          {gyms.map((gym, index) => (
            <GymResultCard
              key={gym.id}
              gym={gym}
              index={index}
              compact
              isOwn={isOwnListedGym(gym, userId)}
              onOpen={(item) => {
                setSelectedGym(item);
                setSheetSnap("half");
                openDetail(item);
              }}
              onInquire={openInquiry}
              onFavorite={handleToggleFavorite}
            />
          ))}
        </div>
        <p className="gym-osm-note">
          지도·장소 데이터 © OpenStreetMap contributors · 실제 운영 여부와
          정보가 다를 수 있습니다.
        </p>
      </>
    );
  }

  return (
    <div className="gym-map-service-stage">
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

      <GymMapSheet
        snap={detailGym ? "full" : sheetSnap}
        title={
          detailGym
            ? detailGym.name
            : selectedGym && !detailGym
              ? selectedGym.name
              : LAYER_META[activeLayer]?.title || "결과"
        }
        count={
          detailGym || selectedGym
            ? 1
            : resultCount
        }
        subtitle={
          detailGym
            ? "체육관 홈"
            : selectedGym
              ? selectedGym.source === "listing"
                ? `${BRAND_NAME} 입점`
                : "지도에서 찾은 장소"
              : sheetSubtitle
        }
        onSnapChange={(next) => {
          if (detailGym && next !== "full") {
            closeDetail();
          }
          setSheetSnap(next);
        }}
      >
        {renderSheetBody()}
      </GymMapSheet>

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
