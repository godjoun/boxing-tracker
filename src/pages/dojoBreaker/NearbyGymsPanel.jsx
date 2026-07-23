import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import GymDetailPanel from "../../components/GymDetailPanel";
import GymInquiryChatModal from "../../components/GymInquiryChatModal";
import GymInquiryModal from "../../components/GymInquiryModal";
import GymInquiryLedgerPanel from "../../components/GymInquiryLedgerPanel";
import GymSentInquiriesPanel from "../../components/GymSentInquiriesPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import { searchOsmBoxingGyms } from "../../api/osmGymApi";
import { inquiryKindLabel } from "../../utils/gymInquiry";
import {
  countUnreadInquiryThreads,
  listInquiryThreadsAsync,
} from "../../utils/gymInquiryChat";
import { useTraining } from "../../store/TrainingContext";
import {
  getDistanceKm,
  getLocationSourceLabel,
  hasMapCoordinates,
  PRESET_AREAS,
  resolveSearchLocation,
  suggestAreas,
} from "../../utils/gymSearch";
import {
  isOwnListedGym,
  loadApprovedGymsForSearch,
  mergeGymSearchResults,
} from "../../utils/gymListing";
import {
  getFavoriteGyms,
  toggleFavoriteGym,
} from "../../utils/gymFavorites";
import GymResultCard from "./GymResultCard";

const GymMapPanel = lazy(() => import("../../components/GymMapPanel"));

const SECTIONS = [
  { id: "find", label: "찾기" },
  { id: "sent", label: "내 문의" },
  { id: "owner", label: "내 관" },
];

export default function NearbyGymsPanel() {
  const { profile, userId } = useTraining();
  const [section, setSection] = useState("find");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [favoriteGyms, setFavoriteGyms] = useState(getFavoriteGyms);
  const [position, setPosition] = useState(null);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const [detailGym, setDetailGym] = useState(null);
  const [chatInquiry, setChatInquiry] = useState(null);
  const [ownerMode, setOwnerMode] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [unreadSent, setUnreadSent] = useState(0);
  const [unreadOwner, setUnreadOwner] = useState(0);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);

  const refreshUnreadBadges = useCallback(async () => {
    if (!userId) {
      setUnreadSent(0);
      setUnreadOwner(0);
      return;
    }
    try {
      const { threads, myActorId } = await listInquiryThreadsAsync(userId);
      setUnreadSent(countUnreadInquiryThreads(threads, myActorId, "inquirer"));
      setUnreadOwner(countUnreadInquiryThreads(threads, myActorId, "owner"));
    } catch {
      /* 배지는 실패해도 무시 */
    }
  }, [userId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(refreshUnreadBadges, 0);
    const timer = window.setInterval(refreshUnreadBadges, 12000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshUnreadBadges]);

  function closeChatAndRefresh() {
    setChatInquiry(null);
    setInboxRefreshKey((value) => value + 1);
    refreshUnreadBadges();
  }

  function switchSection(next) {
    track("gym_section_tab", { section: next });
    setSection(next);
    setDetailGym(null);
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
    setInquiryGym(gym);
  }

  function openDetail(gym) {
    track("gym_detail_open", {
      gymId: gym.id,
      source: gym.source || "",
      acquisitionSource: gym.featured ? "featured" : "organic",
    });
    setDetailGym(gym);
  }

  function openRegister() {
    track("gym_listing_open");
    setEditingListing(null);
    setOwnerMode("register");
  }

  function openLedger() {
    track("gym_inquiry_ledger_open");
    setOwnerMode("ledger");
  }

  function openInquiryChat(item) {
    setChatInquiry(item);
  }

  async function loadGyms(options = {}) {
    const {
      preset = null,
      query = null,
      allowFallback = false,
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
      const listed =
        listedResult.status === "fulfilled" ? listedResult.value : [];
      const merged = mergeGymSearchResults(listed, osmGyms);
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
      if (osmResult.status === "rejected") {
        setLocationHint(
          listed.length > 0
            ? "지도 장소 검색이 지연되어 ANIMA 입점관만 표시합니다."
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

  function handleToggleFavorite(gym) {
    const next = toggleFavoriteGym(gym);
    setFavoriteGyms(next);
    track("gym_favorite_toggle", {
      gymId: gym.id,
      source: gym.source || "",
      saved: next.some((item) => item.id === gym.id),
    });
  }

  const sectionNav = (
    <nav className="gym-role-tabs" aria-label="체육관 역할">
      {SECTIONS.map((item) => {
        const unread =
          item.id === "sent" ? unreadSent : item.id === "owner" ? unreadOwner : 0;
        return (
          <button
            key={item.id}
            type="button"
            className={`gym-role-tab${section === item.id ? " is-active" : ""}`}
            onClick={() => switchSection(item.id)}
          >
            <span>{item.label}</span>
            {unread > 0 ? (
              <span className="gym-role-tab-badge" aria-label={`안 읽음 ${unread}`}>
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  if (section === "sent") {
    return (
      <>
        {sectionNav}
        <GymSentInquiriesPanel
          userId={userId}
          embedded
          refreshKey={inboxRefreshKey}
          onOpenChat={openInquiryChat}
        />
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
      </>
    );
  }

  if (section === "owner") {
    if (ownerMode === "ledger") {
      return (
        <>
          {sectionNav}
          <GymInquiryLedgerPanel
            userId={userId}
            nickname={profile?.nickname || ""}
            embedded
            refreshKey={inboxRefreshKey}
            onClose={() => setOwnerMode(null)}
            onOpenManage={() => setOwnerMode(null)}
          />
        </>
      );
    }

    if (ownerMode === "register") {
      return (
        <>
          {sectionNav}
          <GymListingRegisterPanel
            userId={userId}
            nickname={profile?.nickname || ""}
            initialListing={editingListing}
            onClose={() => {
              setEditingListing(null);
              setOwnerMode(null);
            }}
            onSaved={() => {
              if (position) {
                loadGyms({
                  query: position.source === "search" ? regionQuery : null,
                  preset: activePreset,
                });
              }
            }}
          />
        </>
      );
    }

    return (
      <>
        {sectionNav}
        <GymMyListingsPanel
          userId={userId}
          nickname={profile?.nickname || ""}
          embedded
          onCreate={openRegister}
          onOpenLedger={openLedger}
          onEdit={(listing) => {
            setEditingListing(listing);
            setOwnerMode("register");
          }}
        />
      </>
    );
  }

  if (detailGym) {
    return (
      <>
        <GymDetailPanel
          gym={detailGym}
          isOwn={isOwnListedGym(detailGym, userId)}
          onClose={() => setDetailGym(null)}
          onInquire={openInquiry}
          onOpenLedger={() => {
            setDetailGym(null);
            setSection("owner");
            setOwnerMode("ledger");
          }}
        />
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

  return (
    <>
      {sectionNav}

      <p className="gym-role-hint gym-find-next">
        지역을 고른 뒤 지도에서 복싱장을 둘러보세요.
      </p>
      <button
        type="button"
        className="gym-owner-recruit-button"
        onClick={() => {
          track("gym_owner_recruit_open");
          setSection("owner");
          setOwnerMode("register");
        }}
      >
        체육관을 운영하시나요? 무료 입점 신청 →
      </button>

      <form className="gym-region-search" onSubmit={handleRegionSubmit}>
        <label className="gym-region-search-field" htmlFor="gym-region-input">
          <span className="gym-region-search-label-sr">지역 검색</span>
          <div className="gym-region-search-row">
            <input
              id="gym-region-input"
              type="search"
              value={regionQuery}
              onChange={(event) => handleRegionChange(event.target.value)}
              placeholder="지역 검색 (예: 성수동, 수원 영통구)"
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

      <section
        className="gym-search-bar is-secondary"
        aria-label="추천 지역"
      >
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

      {position ? (
        <p className="gym-search-context is-caption">
          {position.label} · {getLocationSourceLabel(position.source)}
        </p>
      ) : (
        <section className="gym-region-entry" aria-label="지역 선택 안내">
          <p className="home-section-label">CHOOSE AN AREA</p>
          <h2>어느 동네의 링을 찾을까요?</h2>
          <p>
            현재 위치는 요청하지 않습니다. 선택한 지역의 중심 좌표만
            OpenStreetMap 검색에 사용합니다.
          </p>
        </section>
      )}

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
          <strong>이 지역에서 복싱장을 찾지 못했습니다</strong>
          <p>
            지역 범위를 넓혀 다시 검색해 보세요. 지도 정보는
            OpenStreetMap 등록 상태에 따라 달라질 수 있습니다.
          </p>
        </div>
      ) : null}

      {status === "ready" ? (
        <>
          <Suspense
            fallback={<div className="gym-state-card">지도를 여는 중...</div>}
          >
            <GymMapPanel
              center={position}
              gyms={gyms}
              selectedGym={selectedGym}
              favoriteIds={favoriteGyms.map((gym) => gym.id)}
              onSelect={setSelectedGym}
              onToggleFavorite={handleToggleFavorite}
              onOpen={openDetail}
            />
          </Suspense>
          <p className="gym-osm-note">
            지도·장소 데이터 © OpenStreetMap contributors · 실제 운영 여부와
            정보가 다를 수 있습니다.
          </p>

          {gyms.some(
            (gym) =>
              gym.source === "listing" &&
              !hasMapCoordinates(gym)
          ) ? (
            <section className="gym-unmapped-listings">
              <div className="gym-shortlist-head">
                <div>
                  <p className="home-section-label">ANIMA LISTING</p>
                  <h2>위치 확인 중인 입점관</h2>
                </div>
              </div>
              <p>
                관에서 지도 위치를 다시 저장하기 전까지 목록으로만 표시합니다.
              </p>
              {gyms
                .filter(
                  (gym) =>
                    gym.source === "listing" &&
                    !hasMapCoordinates(gym)
                )
                .map((gym, index) => (
                  <GymResultCard
                    key={gym.id}
                    gym={gym}
                    index={index}
                    compact
                    isOwn={isOwnListedGym(gym, userId)}
                    onOpen={openDetail}
                    onInquire={openInquiry}
                  />
                ))}
            </section>
          ) : null}

          <section className="gym-shortlist" aria-label="내가 선택한 체육관">
            <div className="gym-shortlist-head">
              <div>
                <p className="home-section-label">MY SHORTLIST</p>
                <h2>내가 선택한 체육관</h2>
              </div>
              <span>{favoriteGyms.length}</span>
            </div>
            {favoriteGyms.length > 0 ? (
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
            ) : (
              <p className="gym-shortlist-empty">
                지도 핀을 눌러 마음에 드는 체육관을 찜해 보세요.
              </p>
            )}
          </section>
        </>
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
