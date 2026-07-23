const PHOTON_URL = "https://photon.komoot.io/api/";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BOXING_NAME_PATTERN = "복싱|권투|boxing|boxe";

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

export async function geocodeOsmArea(query) {
  const value = String(query || "").trim();
  if (!value) return null;

  const params = new URLSearchParams({
    q: value,
    limit: "1",
    bbox: "124,33,132,39",
  });
  const response = await fetch(`${PHOTON_URL}?${params}`);
  if (!response.ok) throw new Error("지역 좌표를 불러오지 못했습니다.");

  const payload = await response.json();
  const feature = payload?.features?.[0];
  const lon = Number(feature?.geometry?.coordinates?.[0]);
  const lat = Number(feature?.geometry?.coordinates?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    lat,
    lon,
    label: value,
    source: "search",
    accuracy: null,
  };
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

  const radius = Math.min(Math.max(Number(radiusKm) || 8, 2), 15) * 1000;
  const query = `
    [out:json][timeout:18];
    (
      nwr(around:${radius},${lat},${lon})["sport"="boxing"];
      nwr(around:${radius},${lat},${lon})["leisure"="fitness_centre"]["name"~"${BOXING_NAME_PATTERN}",i];
      nwr(around:${radius},${lat},${lon})["leisure"="sports_centre"]["name"~"${BOXING_NAME_PATTERN}",i];
      nwr(around:${radius},${lat},${lon})["club"="sport"]["name"~"${BOXING_NAME_PATTERN}",i];
    );
    out center tags;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: query }),
  });
  if (!response.ok) throw new Error("지도 체육관 검색이 잠시 지연되고 있습니다.");

  const payload = await response.json();
  if (payload?.remark && !(payload?.elements || []).length) {
    throw new Error("지도 체육관 검색이 잠시 지연되고 있습니다.");
  }
  const seen = new Set();
  return (payload?.elements || [])
    .map(normalizeOsmGym)
    .filter((gym) => {
      if (!gym || seen.has(gym.id)) return false;
      seen.add(gym.id);
      return true;
    })
    .slice(0, limit);
}
