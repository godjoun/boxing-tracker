import { useEffect, useState } from "react";
import {
  getCurrentPosition,
  getMapLinks,
  searchNearbyGyms,
} from "../utils/gymSearch";

export default function GymFinderPage({ onGoBack }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState([]);
  const [position, setPosition] = useState(null);

  async function loadGyms() {
    setStatus("loading");
    setError("");

    try {
      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);

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
    loadGyms();
  }, []);

  return (
    <main className="gym-page">
      <header className="gym-hero">
        <button className="category-back" type="button" onClick={onGoBack}>
          <span>←</span> 더보기
        </button>
        <div className="gym-hero-copy">
          <p>DOJO BREAKER</p>
          <h1>도장깨기</h1>
          <span>내 주변 복싱장 · 체육관을 찾아 지도로 연결합니다.</span>
        </div>
        <div className="gym-mark" aria-hidden="true">
          🥊
        </div>
      </header>

      <section className="gym-panel">
        <div className="gym-panel-heading">
          <div>
            <p className="home-section-label">NEARBY GYMS</p>
            <h2>근처 복싱장</h2>
          </div>
          <button
            type="button"
            className="gym-refresh-button"
            onClick={loadGyms}
            disabled={status === "loading"}
          >
            {status === "loading" ? "검색 중" : "다시 검색"}
          </button>
        </div>

        {position && (
          <p className="gym-location-note">
            현재 위치 기준 · GPS 정확도 약 {Math.round(position.accuracy)}m
          </p>
        )}

        {status === "loading" && (
          <div className="gym-state-card">주변 복싱장을 찾는 중입니다...</div>
        )}

        {status === "error" && (
          <div className="gym-state-card error">
            <strong>위치 검색을 할 수 없습니다</strong>
            <p>{error}</p>
            <button type="button" className="gym-retry-button" onClick={loadGyms}>
              다시 시도
            </button>
          </div>
        )}

        {status === "empty" && (
          <div className="gym-state-card">
            <strong>근처에서 복싱장을 찾지 못했습니다</strong>
            <p>
              지도 앱에서 직접 검색해 보세요. 데이터는 OpenStreetMap 기준입니다.
            </p>
            <div className="gym-fallback-links">
              <a
                href="https://map.naver.com/v5/search/복싱"
                target="_blank"
                rel="noreferrer"
              >
                네이버 지도
              </a>
              <a
                href="https://map.kakao.com/?q=복싱"
                target="_blank"
                rel="noreferrer"
              >
                카카오맵
              </a>
            </div>
          </div>
        )}

        {status === "ready" && (
          <div className="gym-result-list">
            {gyms.map((gym, index) => {
              const links = getMapLinks(gym);

              return (
                <article className="gym-result-card" key={gym.id}>
                  <div className="gym-result-rank">{String(index + 1).padStart(2, "0")}</div>
                  <div className="gym-result-body">
                    <div className="gym-result-top">
                      <strong>{gym.name}</strong>
                      <span>{gym.distanceLabel}</span>
                    </div>
                    {gym.address && <p>{gym.address}</p>}
                    <div className="gym-map-links">
                      <a href={links.naver} target="_blank" rel="noreferrer">
                        네이버
                      </a>
                      <a href={links.kakao} target="_blank" rel="noreferrer">
                        카카오
                      </a>
                      <a href={links.google} target="_blank" rel="noreferrer">
                        구글
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
