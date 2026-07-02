const BOXING_KEYWORDS = /복싱|boxing|boxeo|kickbox|킥복싱|주짓수|무에타이|격투|체육관|도장|짐|gym|fight/i;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
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

function getElementCoords(element) {
  if (element.type === "node") {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  return null;
}

function getGymLabel(tags = {}) {
  return (
    tags.name ||
    tags["name:ko"] ||
    tags["name:en"] ||
    tags.operator ||
    tags.brand ||
    ""
  );
}

function getGymAddress(tags = {}) {
  const parts = [
    tags["addr:city"] || tags.city,
    tags["addr:district"] || tags.district,
    tags["addr:street"] || tags.street,
    tags["addr:housenumber"] || tags.housenumber,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" ");
  return tags["addr:full"] || tags.address || "";
}

function isBoxingRelated(tags = {}) {
  const label = getGymLabel(tags);
  const sport = tags.sport || "";
  const leisure = tags.leisure || "";
  const amenity = tags.amenity || "";
  const description = `${label} ${sport} ${leisure} ${amenity}`;

  return (
    BOXING_KEYWORDS.test(description) ||
    sport.includes("boxing") ||
    sport.includes("kickboxing")
  );
}

function normalizeGym(element, originLat, originLon) {
  const coords = getElementCoords(element);
  if (!coords) return null;

  const tags = element.tags || {};
  const name = getGymLabel(tags);

  if (!name) return null;

  const distanceKm = getDistanceKm(
    originLat,
    originLon,
    coords.lat,
    coords.lon
  );

  return {
    id: `${element.type}-${element.id}`,
    name,
    address: getGymAddress(tags),
    lat: coords.lat,
    lon: coords.lon,
    distanceKm,
    distanceLabel: formatDistance(distanceKm),
    sport: tags.sport || "",
    source: "openstreetmap",
  };
}

async function searchOverpass(lat, lon, radiusMeters = 8000) {
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="fitness_centre"](around:${radiusMeters},${lat},${lon});
      way["leisure"="fitness_centre"](around:${radiusMeters},${lat},${lon});
      node["sport"="boxing"](around:${radiusMeters},${lat},${lon});
      way["sport"="boxing"](around:${radiusMeters},${lat},${lon});
      node["sport"="kickboxing"](around:${radiusMeters},${lat},${lon});
      way["sport"="kickboxing"](around:${radiusMeters},${lat},${lon});
      node["amenity"="dojo"](around:${radiusMeters},${lat},${lon});
      way["amenity"="dojo"](around:${radiusMeters},${lat},${lon});
    );
    out center 40;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error("주변 체육관 검색에 실패했습니다.");
  }

  const data = await response.json();
  const gyms = (data.elements || [])
    .map((element) => normalizeGym(element, lat, lon))
    .filter(Boolean)
    .filter((gym) => isBoxingRelated({ name: gym.name, sport: gym.sport }));

  const unique = new Map();
  gyms.forEach((gym) => {
    const key = `${gym.name}-${gym.lat.toFixed(4)}-${gym.lon.toFixed(4)}`;
    if (!unique.has(key) || unique.get(key).distanceKm > gym.distanceKm) {
      unique.set(key, gym);
    }
  });

  return Array.from(unique.values()).sort(
    (a, b) => a.distanceKm - b.distanceKm
  );
}

async function searchNominatim(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", "복싱 체육관");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "12");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("viewbox", `${lon - 0.08},${lat + 0.08},${lon + 0.08},${lat - 0.08}`);
  url.searchParams.set("bounded", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) return [];

  const results = await response.json();

  return results
    .map((item) => {
      const itemLat = Number(item.lat);
      const itemLon = Number(item.lon);
      const distanceKm = getDistanceKm(lat, lon, itemLat, itemLon);

      return {
        id: `nominatim-${item.place_id}`,
        name: item.display_name?.split(",")[0] || item.name || "복싱 체육관",
        address: item.display_name || "",
        lat: itemLat,
        lon: itemLon,
        distanceKm,
        distanceLabel: formatDistance(distanceKm),
        sport: "boxing",
        source: "nominatim",
      };
    })
    .filter((gym) => gym.distanceKm <= 12);
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 정보를 사용할 수 없습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("위치 권한이 필요합니다. 설정에서 위치를 허용해 주세요."));
          return;
        }

        reject(new Error("현재 위치를 가져오지 못했습니다."));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}

export async function searchNearbyGyms(lat, lon) {
  const [overpassResults, nominatimResults] = await Promise.allSettled([
    searchOverpass(lat, lon),
    searchNominatim(lat, lon),
  ]);

  const merged = new Map();

  [overpassResults, nominatimResults].forEach((result) => {
    if (result.status !== "fulfilled") return;

    result.value.forEach((gym) => {
      const key = `${gym.name}-${gym.lat.toFixed(3)}-${gym.lon.toFixed(3)}`;
      if (!merged.has(key) || merged.get(key).distanceKm > gym.distanceKm) {
        merged.set(key, gym);
      }
    });
  });

  return Array.from(merged.values())
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 12);
}

export function getMapLinks(gym) {
  const query = encodeURIComponent(`${gym.name} ${gym.address}`.trim());
  const coords = `${gym.lat},${gym.lon}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${coords}`,
    naver: `https://map.naver.com/v5/search/${query}`,
    kakao: `https://map.kakao.com/?q=${query}`,
  };
}
