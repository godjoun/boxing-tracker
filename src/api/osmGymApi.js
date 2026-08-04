const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BOXING_NAME_PATTERN = "복싱|권투|boxing|boxe";
const OSM_CACHE_PREFIX = "mantle-osm-gym-search";
const LOCATION_CACHE_PREFIX = "mantle-osm-location";
const OSM_CACHE_TTL_MS = 30 * 60 * 1000;
const OSM_STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOCATION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map();

function readCache(key, maxAgeMs) {
  try {
    const raw = localStorage.getItem(key);
    const cached = raw ? JSON.parse(raw) : memoryCache.get(key);
    if (!cached || Date.now() - Number(cached.savedAt || 0) > maxAgeMs) {
      return null;
    }
    return cached.value;
  } catch {
    const cached = memoryCache.get(key);
    return cached && Date.now() - cached.savedAt <= maxAgeMs
      ? cached.value
      : null;
  }
}

function writeCache(key, value) {
  const cached = { savedAt: Date.now(), value };
  memoryCache.set(key, cached);
  try {
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Memory cache still prevents repeated requests during this session.
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function getElementCenter(element) {
  const lat = Number(element?.lat ?? element?.center?.lat);
  const lon = Number(element?.lon ?? element?.center?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function buildAddress(tags = {}) {
  const street = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  return [
    tags["addr:city"] || tags["addr:province"],
    tags["addr:district"] || tags["addr:borough"],
    street,
  ]
    .filter(Boolean)
    .join(" ");
}

export function normalizeOsmGym(element) {
  const center = getElementCenter(element);
  const name = String(element?.tags?.name || "").trim();
  if (!center || !name) return null;

  const tags = element.tags || {};
  return {
    id: `osm-${element.type}-${element.id}`,
    osmId: element.id,
    osmType: element.type,
    name,
    address: buildAddress(tags),
    lat: center.lat,
    lon: center.lon,
    phone: tags.phone || tags["contact:phone"] || "",
    website: tags.website || tags["contact:website"] || "",
    tags: ["지도 검색"],
    featured: false,
    source: "osm",
    distanceLabel: "",
    mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

export function normalizePhotonLocation(feature, fallbackLabel = "") {
  const properties = feature?.properties || {};
  const lon = Number(feature?.geometry?.coordinates?.[0]);
  const lat = Number(feature?.geometry?.coordinates?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const cityLabel = String(
    properties.city ||
      properties.locality ||
      properties.district ||
      properties.county ||
      properties.state ||
      properties.country ||
      fallbackLabel
  ).trim();
  const countryLabel = String(properties.country || "").trim();
  const label = [cityLabel, countryLabel]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");

  return {
    lat,
    lon,
    label: label || fallbackLabel || "선택한 위치",
    cityLabel: cityLabel || fallbackLabel,
    countryLabel,
  };
}

export async function geocodeOsmArea(query) {
  const value = String(query || "").trim();
  if (!value) return null;

  const params = new URLSearchParams({
    q: value,
    limit: "1",
  });
  const response = await fetchWithTimeout(`${PHOTON_URL}?${params}`, {}, 5000);
  if (!response.ok) throw new Error("지역 좌표를 불러오지 못했습니다.");

  const payload = await response.json();
  const location = normalizePhotonLocation(payload?.features?.[0], value);
  if (!location) return null;

  return {
    ...location,
    label: value,
    source: "search",
    accuracy: null,
  };
}

export async function reverseGeocodeOsmArea(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const cacheKey = `${LOCATION_CACHE_PREFIX}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  const cached = readCache(cacheKey, LOCATION_CACHE_TTL_MS);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    limit: "1",
  });
  const response = await fetchWithTimeout(
    `${PHOTON_REVERSE_URL}?${params}`,
    {},
    4500
  );
  if (!response.ok) throw new Error("현재 도시를 확인하지 못했습니다.");

  const payload = await response.json();
  const location = normalizePhotonLocation(payload?.features?.[0]);
  if (location) writeCache(cacheKey, location);
  return location;
}

export async function searchOsmBoxingGyms({
  lat,
  lon,
  radiusKm = 8,
  limit = 80,
}) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
    return [];
  }

  const normalizedRadiusKm = Math.min(
    Math.max(Number(radiusKm) || 8, 2),
    15
  );
  const cacheKey = `${OSM_CACHE_PREFIX}:${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}:${normalizedRadiusKm}`;
  const cached = readCache(cacheKey, OSM_CACHE_TTL_MS);
  if (cached) return cached.slice(0, limit);

  const radius = normalizedRadiusKm * 1000;
  const query = `
    [out:json][timeout:6];
    (
      nwr(around:${radius},${lat},${lon})["sport"="boxing"];
      nwr(around:${radius},${lat},${lon})["leisure"="fitness_centre"]["name"~"${BOXING_NAME_PATTERN}",i];
      nwr(around:${radius},${lat},${lon})["leisure"="sports_centre"]["name"~"${BOXING_NAME_PATTERN}",i];
      nwr(around:${radius},${lat},${lon})["club"="sport"]["name"~"${BOXING_NAME_PATTERN}",i];
    );
    out center tags;
  `;

  try {
    const response = await fetchWithTimeout(
      OVERPASS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ data: query }),
      },
      6500
    );
    if (!response.ok) {
      throw new Error("지도 체육관 검색이 잠시 지연되고 있습니다.");
    }

    const payload = await response.json();
    if (payload?.remark && !(payload?.elements || []).length) {
      throw new Error("지도 체육관 검색이 잠시 지연되고 있습니다.");
    }
    const seen = new Set();
    const gyms = (payload?.elements || [])
      .map(normalizeOsmGym)
      .filter((gym) => {
        if (!gym || seen.has(gym.id)) return false;
        seen.add(gym.id);
        return true;
      });
    writeCache(cacheKey, gyms);
    return gyms.slice(0, limit);
  } catch (error) {
    const stale = readCache(cacheKey, OSM_STALE_TTL_MS);
    if (stale) return stale.slice(0, limit);
    if (error?.name === "AbortError") {
      throw new Error("지도 체육관 검색이 잠시 지연되고 있습니다.", {
        cause: error,
      });
    }
    throw error;
  }
}
