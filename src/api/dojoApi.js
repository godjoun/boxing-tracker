import { LOCAL_SPARRING_PARTNERS } from "../data/localDojoData";
import { normalizeWeightClass } from "../data/proBoxingWeightClasses";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function withDistance(items, lat, lon, mapper) {
  return items
    .map((item) => {
      const distanceKm = getDistanceKm(lat, lon, item.lat, item.lon);
      return mapper(item, distanceKm);
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function searchLocalGyms() {
  // 시드(예시) 체육관은 운영 목록에서 제외. 입점(approved)만 NearbyGymsPanel에서 합침.
  return [];
}

function searchLocalPartners(lat, lon, filter = {}, radiusKm = 15) {
  let partners = withDistance(
    LOCAL_SPARRING_PARTNERS.filter((partner) => partner.active),
    lat,
    lon,
    (partner, distanceKm) => ({
      ...partner,
      distanceKm,
      distanceLabel: formatDistance(distanceKm),
      source: "local",
      isDemo: false,
    })
  ).filter((partner) => partner.distanceKm <= radiusKm);

  if (filter.weightClass && filter.weightClass !== "전체") {
    partners = partners.filter(
      (partner) =>
        normalizeWeightClass(partner.weightClass) === filter.weightClass ||
        partner.weightClass === "상관없음",
    );
  }

  if (filter.experience && filter.experience !== "전체") {
    partners = partners.filter(
      (partner) => partner.experience === filter.experience
    );
  }

  return partners;
}

async function fetchFromApi(path, fallback) {
  if (!API_BASE) {
    return fallback();
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items || [];
    return items.map((item) => ({ ...item, source: item.source || "server" }));
  } catch {
    return fallback();
  }
}

export function hasDojoApiConfigured() {
  return Boolean(API_BASE);
}

export function getDojoApiInfo() {
  return {
    configured: hasDojoApiConfigured(),
    baseUrl: API_BASE || "로컬 데이터",
  };
}

export async function fetchNearbyGyms(lat, lon, radiusKm = 12) {
  return fetchFromApi(
    `/api/gyms/nearby?lat=${lat}&lon=${lon}&radius=${radiusKm}`,
    () => searchLocalGyms(lat, lon, radiusKm)
  );
}

export async function fetchSparringPartners(lat, lon, filter = {}) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });

  if (filter.weightClass && filter.weightClass !== "전체") {
    params.set("weightClass", filter.weightClass);
  }

  if (filter.experience && filter.experience !== "전체") {
    params.set("experience", filter.experience);
  }

  return fetchFromApi(
    `/api/sparring/partners?${params.toString()}`,
    () => searchLocalPartners(lat, lon, filter)
  );
}
