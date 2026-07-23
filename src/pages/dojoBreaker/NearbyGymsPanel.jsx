import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import GymDetailPanel from "../../components/GymDetailPanel";
import GymInquiryChatModal from "../../components/GymInquiryChatModal";
import GymInquiryModal from "../../components/GymInquiryModal";
import GymInquiryLedgerPanel from "../../components/GymInquiryLedgerPanel";
import GymSentInquiriesPanel from "../../components/GymSentInquiriesPanel";
import GymListingRegisterPanel from "../../components/GymListingRegisterPanel";
import GymMyListingsPanel from "../../components/GymMyListingsPanel";
import { inquiryKindLabel } from "../../utils/gymInquiry";
import {
  countUnreadInquiryThreads,
  listInquiryThreadsAsync,
} from "../../utils/gymInquiryChat";
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
  isOwnListedGym,
  loadApprovedGymsForSearch,
  mergeGymSearchResults,
  splitFeaturedGyms,
} from "../../utils/gymListing";
import GymResultCard from "./GymResultCard";

const SECTIONS = [
  { id: "find", label: "찾기" },
  { id: "sent", label: "내 문의" },
  { id: "owner", label: "내 관" },
];

export default function NearbyGymsPanel({ onGoBack, embedded = false }) {
  const { profile, userId } = useTraining();
  const [section, setSection] = useState("find");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
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

  async function refreshUnreadBadges() {
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
  }

  useEffect(() => {
    refreshUnreadBadges();
    const timer = window.setInterval(refreshUnreadBadges, 12000);
    return () => window.clearInterval(timer);
  }, [userId]);

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
    track("gym_inquiry_open", { gymId: gym.id });
    setInquiryGym(gym);
  }

  function openDetail(gym) {
    track("gym_detail_open", { gymId: gym.id, source: gym.source || "" });
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
        loadApprovedGymsForSearch(currentPosition.lat, currentPosition.lon, {
          userId,
        }),
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
                  preferGps: position.source === "gps",
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
        지역을 검색한 뒤 관을 골라 문의하세요.
      </p>

      <form className="gym-region-search" onSubmit={handleRegionSubmit}>
        <label className="gym-region-search-field" htmlFor="gym-region-input">
          <span className="gym-region-search-label-sr">지역 검색</span>
          <div className="gym-region-search-row">
            <input
              id="gym-region-input"
              type="search"
              value={regionQuery}
              onChange={(event) => handleRegionChange(event.target.value)}
              placeholder="체육관 지역 검색 (예: 강남, 홍대)"
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

      <p className="gym-search-context is-caption">
        {position
          ? `${position.label} · ${getLocationSourceLabel(position.source)}`
          : "위치 확인 중"}
        {status === "ready" && gyms[0]
          ? ` · ${getGymDataSourceLabel(gyms[0].source)}`
          : ""}
      </p>

      <section className="gym-search-bar is-secondary" aria-label="빠른 위치">
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
          <strong>이 지역에 입점한 체육관이 아직 없습니다</strong>
          <p>
            승인된 입점관만 검색에 나옵니다. 관을 운영 중이면 「내 관」에서
            등록해 보세요.
          </p>
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
                      <strong>추천</strong>
                      <span>관이 올리는 노출 자리</span>
                    </div>
                    {featured.map((gym, index) => (
                      <GymResultCard
                        key={gym.id}
                        gym={gym}
                        index={index}
                        featured
                        isOwn={isOwnListedGym(gym, userId)}
                        onOpen={openDetail}
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
                    isOwn={isOwnListedGym(gym, userId)}
                    onOpen={openDetail}
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
