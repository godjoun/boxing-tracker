import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import GymInquiryModal from "../../components/GymInquiryModal";
import {
  getGymDataSourceLabel,
  getLocationSourceLabel,
  isGymSearchAvailable,
  PRESET_AREAS,
  resolveSearchLocation,
  searchNearbyGyms,
  suggestAreas,
} from "../../utils/gymSearch";

export default function NearbyGymsPanel({ onGoBack, embedded = false }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [position, setPosition] = useState(null);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  function openInquiry(gym) {
    track("gym_inquiry_open", { gymId: gym.id });
    setInquiryGym(gym);
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

      const results = await searchNearbyGyms(
        currentPosition.lat,
        currentPosition.lon
      );

      setGyms(results);
      setStatus(results.length > 0 ? "ready" : "empty");
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
          {gyms.map((gym, index) => (
            <article className="gym-result-card" key={gym.id}>
              <div className="gym-result-rank">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="gym-result-body">
                <div className="gym-result-top">
                  <strong>{gym.name}</strong>
                  <span>{gym.distanceLabel}</span>
                </div>
                {gym.address ? <p>{gym.address}</p> : null}
                {gym.phone ? (
                  <p className="gym-result-phone">{gym.phone}</p>
                ) : null}
                {gym.tags?.length > 0 ? (
                  <p className="gym-result-category">{gym.tags.join(" · ")}</p>
                ) : null}
                <button
                  type="button"
                  className="gym-inquiry-button"
                  onClick={() => openInquiry(gym)}
                >
                  문의하기
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {inquiryGym ? (
        <GymInquiryModal
          gym={inquiryGym}
          onClose={() => setInquiryGym(null)}
        />
      ) : null}
    </>
  );
}
