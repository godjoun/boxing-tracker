import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { hasMapCoordinates } from "../utils/gymSearch";
import { BRAND_NAME } from "../utils/brand";

function MapViewport({ center, selectedGym }) {
  const map = useMap();

  useEffect(() => {
    const target = selectedGym || center;
    if (!target) return;
    map.flyTo([target.lat, target.lon], selectedGym ? 15 : 13, {
      duration: 0.45,
    });
  }, [center, map, selectedGym]);

  return null;
}

export default function GymMapPanel({
  center,
  gyms = [],
  selectedGym = null,
  favoriteIds = [],
  onSelect,
  onToggleFavorite,
  onOpen,
}) {
  if (!center) return null;
  const favorites = new Set(favoriteIds);

  return (
    <section className="gym-map-shell" aria-label="지역 체육관 지도">
      <MapContainer
        className="gym-map"
        center={[center.lat, center.lon]}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport center={center} selectedGym={selectedGym} />
        {gyms
          .filter(hasMapCoordinates)
          .map((gym) => {
            const listed = gym.source === "listing";
            const selected = selectedGym?.id === gym.id;
            return (
              <CircleMarker
                key={gym.id}
                center={[gym.lat, gym.lon]}
                radius={selected ? 11 : listed ? 9 : 7}
                pathOptions={{
                  color: listed ? "#8a2e2e" : "#161616",
                  fillColor: listed ? "#8a2e2e" : "#ffffff",
                  fillOpacity: selected ? 1 : 0.86,
                  weight: selected ? 4 : 2,
                }}
                eventHandlers={{ click: () => onSelect?.(gym) }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {gym.name}
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>

      <div className="gym-map-legend" aria-label="지도 범례">
        <span><i className="is-listed" />{BRAND_NAME} 입점관</span>
        <span><i />지도 검색</span>
      </div>

      {selectedGym ? (
        <div className="gym-map-preview">
          <div>
            <span>
              {selectedGym.source === "listing" ? `${BRAND_NAME} 입점` : "지도 검색"}
            </span>
            <strong>{selectedGym.name}</strong>
            <small>{selectedGym.address || center.label}</small>
          </div>
          <div className="gym-map-preview-actions">
            <button
              type="button"
              className={`gym-favorite-button${
                favorites.has(selectedGym.id) ? " is-active" : ""
              }`}
              onClick={() => onToggleFavorite?.(selectedGym)}
              aria-pressed={favorites.has(selectedGym.id)}
            >
              {favorites.has(selectedGym.id) ? "♥ 찜됨" : "♡ 찜"}
            </button>
            <button type="button" onClick={() => onOpen?.(selectedGym)}>
              자세히
            </button>
          </div>
        </div>
      ) : (
        <p className="gym-map-guide">지도에서 체육관 핀을 눌러 보세요.</p>
      )}
    </section>
  );
}
