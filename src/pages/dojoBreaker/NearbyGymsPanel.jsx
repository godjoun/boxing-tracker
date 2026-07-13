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
} from "../../utils/gymSearch";

export default function NearbyGymsPanel({ onGoBack }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [position, setPosition] = useState(null);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  function openInquiry(gym) {
    track("gym_inquiry_open", { gymId: gym.id });
    setInquiryGym(gym);
  }

  async function loadGyms(options = {}) {
    const {
      preferGps = false,
      preset = null,
      allowFallback = !preferGps && !preset,
    } = options;

    setStatus("loading");
    setError("");
    setLocationHint("");
    setActivePreset(preset);

    try {
      const currentPosition = await resolveSearchLocation({
        preferGps,
        preset,
        allowFallback,
      });

      setPosition(currentPosition);

      if (currentPosition.source !== "gps") {
        setLocationHint(
          currentPosition.source === "default"
            ? "GPS를 쓸 수 없어 기본 위치입니다. 지역을 바꿔 보세요."
            : ""
        );
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

  useEffect(() => {
    loadGyms({ preferGps: true, allowFallback: true });
  }, []);

  return (
    <>
      <header className="gym-search-header">
        <button className="category-back" type="button" onClick={onGoBack}>
          ← 도장
        </button>
        <h1>주변 체육관</h1>
        <p className="gym-search-context">
          {position
            ? `${position.label} · ${getLocationSourceLabel(position.source)}`
            : "위치 확인 중"}
          {status === "ready" && gyms[0]
            ? ` · ${getGymDataSourceLabel(gyms[0].source)}`
            : ""}
        </p>
      </header>

      <section className="gym-search-bar" aria-label="검색 위치">
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
              onClick={() => loadGyms({ preset: area.id })}
              disabled={status === "loading"}
            >
              {area.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="gym-refresh-button"
          onClick={() =>
            loadGyms({
              preferGps: position?.source === "gps",
              preset: activePreset,
              allowFallback: position?.source === "default",
            })
          }
          disabled={status === "loading"}
        >
          {status === "loading" ? "검색 중" : "다시"}
        </button>
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
          <p>다른 지역으로 바꿔 다시 검색해 보세요.</p>
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
                  체험 문의
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {inquiryGym ? (
        <GymInquiryModal gym={inquiryGym} onClose={() => setInquiryGym(null)} />
      ) : null}
    </>
  );
}
