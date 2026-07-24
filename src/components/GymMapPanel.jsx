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

function MapViewport({ center, selectedGym, selectedRivalArea }) {
  const map = useMap();

  useEffect(() => {
    const target = selectedGym || selectedRivalArea || center;
    if (!target) return;
    map.flyTo(
      [target.lat, target.lon],
      selectedGym ? 15 : selectedRivalArea ? 12 : target.source === "overview" ? 7 : 13,
      { duration: 0.45 }
    );
  }, [center, map, selectedGym, selectedRivalArea]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map, center]);

  return null;
}

export default function GymMapPanel({
  center,
  gyms = [],
  rivalAreas = [],
  selectedGym = null,
  selectedRivalArea = null,
  overlay = null,
  onSelect,
  onSelectRival,
}) {
  if (!center) return null;

  return (
    <section className="gym-map-shell is-service" aria-label="지역 체육관 지도">
      <MapContainer
        className="gym-map is-service"
        center={[center.lat, center.lon]}
        zoom={center.source === "overview" ? 7 : 13}
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport
          center={center}
          selectedGym={selectedGym}
          selectedRivalArea={selectedRivalArea}
        />
        {gyms.filter(hasMapCoordinates).map((gym) => {
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
        {rivalAreas.map((area) => {
          const selected = selectedRivalArea?.id === area.id;
          return (
            <CircleMarker
              key={`rival-${area.id}`}
              center={[area.lat, area.lon]}
              radius={selected ? 22 : 17}
              pathOptions={{
                color: "#8a2e2e",
                fillColor: "#8a2e2e",
                fillOpacity: selected ? 0.72 : 0.48,
                weight: selected ? 3 : 2,
              }}
              eventHandlers={{ click: () => onSelectRival?.(area) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {area.label} · 라이벌 {area.count}명
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {overlay ? <div className="gym-map-overlay">{overlay}</div> : null}

      <div className="gym-map-legend" aria-label="지도 범례">
        <span>
          <i className="is-listed" />
          {BRAND_NAME} 입점관
        </span>
        <span>
          <i />
          지도 검색
        </span>
        {rivalAreas.length > 0 ? (
          <span>
            <i className="is-rival" />
            라이벌 권역
          </span>
        ) : null}
      </div>
    </section>
  );
}
