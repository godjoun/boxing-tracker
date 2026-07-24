import { fetchNearbyGyms as fetchGymsFromApi } from "../api/dojoApi";
import { geocodeOsmArea } from "../api/osmGymApi";

const LOCATION_STORAGE_KEY = "fitness-league-search-location";

export const PRESET_AREAS = [
  { id: "seoul-gangnam", label: "서울 강남", lat: 37.4979, lon: 127.0276 },
  { id: "seoul-hongdae", label: "서울 홍대", lat: 37.5563, lon: 126.9236 },
  { id: "busan-seomyeon", label: "부산 서면", lat: 35.1579, lon: 129.0595 },
  { id: "daegu-dongseong", label: "대구 동성로", lat: 35.8694, lon: 128.5938 },
  { id: "gwangju-sangmu", label: "광주 상무", lat: 35.1466, lon: 126.8514 },
];

/** 직접 검색용 지역 (프리셋 + 별칭) */
export const SEARCHABLE_AREAS = [
  {
    id: "gunsan-center",
    label: "군산",
    aliases: ["군산", "군산시", "나운", "미장", "조촌", "구암"],
    lat: 35.9676,
    lon: 126.7369,
  },
  {
    id: "gunsan-transport",
    label: "군산 수송동",
    aliases: ["수송", "수송동", "군산 수송"],
    lat: 35.9745,
    lon: 126.715,
  },
  {
    id: "iksan",
    label: "익산",
    aliases: ["익산", "익산시", "영등"],
    lat: 35.9483,
    lon: 126.9578,
  },
  {
    id: "jeonju",
    label: "전주",
    aliases: ["전주", "전주시", "객사", "서신", "효자"],
    lat: 35.8242,
    lon: 127.148,
  },
  {
    id: "seoul-gangnam",
    label: "서울 강남",
    aliases: ["강남", "역삼", "선릉", "삼성동", "논현"],
    lat: 37.4979,
    lon: 127.0276,
  },
  {
    id: "seoul-hongdae",
    label: "서울 홍대",
    aliases: ["홍대", "홍익대", "연남", "상수", "합정"],
    lat: 37.5563,
    lon: 126.9236,
  },
  {
    id: "seoul-jamsil",
    label: "서울 잠실",
    aliases: ["잠실", "송파", "석촌", "방이"],
    lat: 37.5133,
    lon: 127.1028,
  },
  {
    id: "seoul-mapo",
    label: "서울 마포",
    aliases: ["마포", "공덕", "아현", "망원"],
    lat: 37.566,
    lon: 126.901,
  },
  {
    id: "seoul-sungsu",
    label: "서울 성수",
    aliases: ["성수", "성수동", "건대", "서울숲"],
    lat: 37.5445,
    lon: 127.0559,
  },
  {
    id: "seoul-cityhall",
    label: "서울 시청",
    aliases: ["서울", "종로", "중구", "시청", "명동"],
    lat: 37.5665,
    lon: 126.978,
  },
  {
    id: "busan-seomyeon",
    label: "부산 서면",
    aliases: ["부산", "서면", "부산진"],
    lat: 35.1579,
    lon: 129.0595,
  },
  {
    id: "daegu-dongseong",
    label: "대구 동성로",
    aliases: ["대구", "동성로"],
    lat: 35.8694,
    lon: 128.5938,
  },
  {
    id: "incheon-bupyeong",
    label: "인천 부평",
    aliases: ["인천", "부평"],
    lat: 37.507,
    lon: 126.7219,
  },
  {
    id: "gwangju-sangmu",
    label: "광주 상무",
    aliases: ["광주", "상무"],
    lat: 35.1466,
    lon: 126.8514,
  },
];

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function normalizePosition(position) {
  return {
    lat: position.lat,
    lon: position.lon,
    label: position.label || "선택한 위치",
    source: position.source || "manual",
    accuracy: position.accuracy ?? null,
  };
}

function saveSearchLocation(position) {
  try {
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(normalizePosition(position))
    );
  } catch {
    // ignore storage failures
  }
}

function getSavedSearchLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return normalizePosition(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** "강남", "홍대", "부산" 등 지역 문자열 → 좌표 */
export function findAreaByQuery(query) {
  const q = normalizeQuery(query);
  if (!q) return null;

  const scored = SEARCHABLE_AREAS.map((area) => {
    const label = normalizeQuery(area.label);
    const aliases = (area.aliases || []).map(normalizeQuery);
    let score = 0;

    if (label === q || aliases.includes(q)) score = 100;
    else if (label.includes(q) || aliases.some((alias) => alias.includes(q))) {
      score = 80;
    } else if (aliases.some((alias) => q.includes(alias) && alias.length >= 2)) {
      score = 60;
    }

    return { area, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.area || null;
}

export function suggestAreas(query, limit = 6) {
  const q = normalizeQuery(query);
  if (!q) return SEARCHABLE_AREAS.slice(0, limit);

  return SEARCHABLE_AREAS.filter((area) => {
    const hay = [area.label, ...(area.aliases || [])]
      .map(normalizeQuery)
      .join(" ");
    return hay.includes(q);
  }).slice(0, limit);
}

export async function resolveSearchLocation(options = {}) {
  const {
    preset = null,
    query = null,
    allowFallback = true,
  } = options;

  if (query) {
    const area = findAreaByQuery(query);
    const resolved = area || (await geocodeOsmArea(query));
    if (!resolved) {
      throw new Error(
        `"${query.trim()}" 지역을 찾지 못했습니다. 시·구·동 이름으로 다시 검색해 주세요.`
      );
    }
    const position = normalizePosition({
      lat: resolved.lat,
      lon: resolved.lon,
      label: resolved.label || query.trim(),
      source: "search",
      accuracy: resolved.accuracy ?? null,
    });
    saveSearchLocation(position);
    return position;
  }

  if (preset) {
    const area =
      SEARCHABLE_AREAS.find((item) => item.id === preset) ||
      PRESET_AREAS.find((item) => item.id === preset);
    if (area) {
      const position = normalizePosition({
        lat: area.lat,
        lon: area.lon,
        label: area.label,
        source: "preset",
        accuracy: 1000,
      });
      saveSearchLocation(position);
      return position;
    }
  }

  const saved = getSavedSearchLocation();
  if (saved) {
    return saved;
  }

  throw new Error(
    allowFallback
      ? "검색할 지역을 선택해 주세요."
      : "위치를 확인할 수 없습니다."
  );
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    ![lat1, lon1, lat2, lon2].every(
      (value) => value !== null && value !== "" && Number.isFinite(Number(value))
    )
  ) {
    return Number.NaN;
  }
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

export function hasMapCoordinates(item) {
  if (
    item?.lat === null ||
    item?.lat === "" ||
    item?.lat === undefined ||
    item?.lon === null ||
    item?.lon === "" ||
    item?.lon === undefined
  ) {
    return false;
  }
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/** 지도에 올릴 수 있는 국내 좌표 + 검색 반경 안인지 */
export function isNearbyMapGym(gym, center, radiusKm = 20) {
  if (!hasMapCoordinates(gym) || !hasMapCoordinates(center)) return false;
  const lat = Number(gym.lat);
  const lon = Number(gym.lon);
  if (lat < 33 || lat > 39 || lon < 124 || lon > 132) return false;
  const distanceKm = getDistanceKm(center.lat, center.lon, lat, lon);
  return Number.isFinite(distanceKm) && distanceKm <= radiusKm;
}

export async function searchNearbyGyms(lat, lon) {
  return fetchGymsFromApi(lat, lon, 12);
}

export function isGymSearchAvailable() {
  return true;
}

export function getGymDataSourceLabel(source) {
  if (source === "server") return "자체 서버";
  if (source === "listing") return "입점";
  if (source === "local") return "자체 데이터";
  return "자체 데이터";
}

export function getLocationSourceLabel(source) {
  switch (source) {
    case "gps":
      return "GPS";
    case "preset":
      return "지역 선택";
    case "search":
      return "지역 검색";
    default:
      return "저장된 위치";
  }
}

export function getMapLinks(gym) {
  const query = encodeURIComponent(`${gym.name} ${gym.address || ""}`.trim());
  const coords = `${gym.lat},${gym.lon}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${coords}`,
    coords,
    query,
  };
}

export function getSavedLocation() {
  return getSavedSearchLocation();
}
