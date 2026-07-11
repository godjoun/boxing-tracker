import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import GymInquiryModal from "../../components/GymInquiryModal";
import {
  getGymDataSourceLabel,
  getLocationSourceLabel,
  getSavedLocation,
  isGymSearchAvailable,
  PRESET_AREAS,
  resolveSearchLocation,
  searchNearbyGyms,
} from "../../utils/gymSearch";
import { getDojoApiInfo } from "../../api/dojoApi";

export default function NearbyGymsPanel({ onGoBack }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [position, setPosition] = useState(null);
  const [locationHint, setLocationHint] = useState("");
  const [inquiryGym, setInquiryGym] = useState(null);
  const apiInfo = getDojoApiInfo();

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
            ? "GPS를 사용할 수 없어 기본 위치로 설정했습니다. 지역 버튼을 눌러 변경하세요."
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

  function handleUseGps() {
    loadGyms({ preferGps: true, allowFallback: false });
  }

  function handlePresetSelect(presetId) {
    loadGyms({ preset: presetId });
  }

  return (
    <>
      <button className="category-back dojo-sub-back" type="button" onClick={onGoBack}>
        <span>←</span> 도장깨기
      </button>

      <section className="gym-panel gym-location-panel">
        <div className="gym-panel-heading">
          <div>
            <p className="home-section-label">SEARCH AREA</p>
            <h2>검색 위치 설정</h2>
          </div>
        </div>

        <p className="gym-location-note">
          GPS 또는 지역 버튼으로 위치를 설정하세요. 데이터: {apiInfo.baseUrl}
        </p>

        <div className="gym-location-actions">
          <button
            type="button"
            className="gym-refresh-button"
            onClick={handleUseGps}
            disabled={status === "loading"}
          >
            GPS 사용
          </button>
        </div>

        <div className="gym-preset-list">
          {PRESET_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              className="gym-preset-chip"
              onClick={() => handlePresetSelect(area.id)}
              disabled={status === "loading"}
            >
              {area.label}
            </button>
          ))}
        </div>
      </section>

      <section className="gym-panel">
        <div className="gym-panel-heading">
          <div>
            <p className="home-section-label">NEARBY GYMS</p>
            <h2>주변 체육관 찾기</h2>
          </div>
          <button
            type="button"
            className="gym-refresh-button"
            onClick={() =>
              loadGyms({
                preferGps: position?.source === "gps",
                preset:
                  position?.source === "preset"
                    ? PRESET_AREAS.find((area) => area.label === position.label)?.id
                    : null,
                allowFallback: position?.source === "default",
              })
            }
            disabled={status === "loading"}
          >
            {status === "loading" ? "검색 중" : "다시 검색"}
          </button>
        </div>

        {position && (
          <p className="gym-location-note">
            {position.label} · {getLocationSourceLabel(position.source)}
            {position.accuracy ? ` · 정확도 약 ${Math.round(position.accuracy)}m` : ""}
            {" · "}
            {getGymDataSourceLabel(gyms[0]?.source)}
          </p>
        )}

        {locationHint && <p className="gym-location-hint">{locationHint}</p>}

        {status === "loading" && (
          <div className="gym-state-card">주변 복싱장을 찾는 중입니다...</div>
        )}

        {status === "error" && (
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
        )}

        {status === "empty" && (
          <div className="gym-state-card">
            <strong>근처에서 복싱장을 찾지 못했습니다</strong>
            <p>다른 지역 버튼으로 위치를 바꿔 다시 검색해 보세요.</p>
          </div>
        )}

        {status === "ready" && (
          <div className="gym-result-list">
            {gyms.map((gym, index) => (
              <article className="gym-result-card" key={gym.id}>
                <div className="gym-result-rank">{String(index + 1).padStart(2, "0")}</div>
                <div className="gym-result-body">
                  <div className="gym-result-top">
                    <strong>{gym.name}</strong>
                    <span>{gym.distanceLabel}</span>
                  </div>
                  {gym.address && <p>{gym.address}</p>}
                  {gym.phone && <p className="gym-result-phone">{gym.phone}</p>}
                  {gym.tags?.length > 0 && (
                    <p className="gym-result-category">{gym.tags.join(" · ")}</p>
                  )}
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
        )}
      </section>

      {inquiryGym ? (
        <GymInquiryModal gym={inquiryGym} onClose={() => setInquiryGym(null)} />
      ) : null}
    </>
  );
}
