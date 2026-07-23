import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function PickerEvents({ onChange }) {
  useMapEvents({
    click(event) {
      onChange?.({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
  });
  return null;
}

function PickerViewport({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lon], 16, { duration: 0.4 });
  }, [center, map]);
  return null;
}

export default function GymLocationPicker({ center, position, onChange }) {
  const mapCenter = center || position;
  if (!mapCenter) return null;

  return (
    <div className="gym-location-picker">
      <p>지도를 눌러 사업장 입구 위치를 정확히 표시해 주세요.</p>
      <MapContainer
        className="gym-location-picker-map"
        center={[mapCenter.lat, mapCenter.lon]}
        zoom={16}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickerViewport center={mapCenter} />
        <PickerEvents onChange={onChange} />
        {position ? (
          <CircleMarker
            center={[position.lat, position.lon]}
            radius={10}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#8a2e2e",
              fillOpacity: 1,
              weight: 3,
            }}
          />
        ) : null}
      </MapContainer>
      <small>
        {position
          ? `선택 완료 · ${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}`
          : "아직 위치를 선택하지 않았습니다."}
      </small>
    </div>
  );
}
