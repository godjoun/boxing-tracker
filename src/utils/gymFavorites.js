const GYM_FAVORITES_KEY = "mantle-gym-favorites";
const LEGACY_GYM_FAVORITES_KEY = "anima-gym-favorites";
const MAX_FAVORITES = 30;

function sanitizeGym(gym) {
  if (!gym?.id || !gym?.name) return null;
  const hasLat =
    gym.lat !== null &&
    gym.lat !== "" &&
    gym.lat !== undefined &&
    Number.isFinite(Number(gym.lat));
  const hasLon =
    gym.lon !== null &&
    gym.lon !== "" &&
    gym.lon !== undefined &&
    Number.isFinite(Number(gym.lon));
  return {
    id: String(gym.id),
    name: String(gym.name),
    address: String(gym.address || ""),
    lat: hasLat ? Number(gym.lat) : null,
    lon: hasLon ? Number(gym.lon) : null,
    phone: String(gym.phone || ""),
    photoUrl: String(gym.photoUrl || ""),
    photoUrls: Array.isArray(gym.photoUrls) ? gym.photoUrls.slice(0, 5) : [],
    tags: Array.isArray(gym.tags) ? gym.tags.slice(0, 6) : [],
    featured: Boolean(gym.featured),
    source: gym.source === "listing" ? "listing" : "osm",
    intro: String(gym.intro || ""),
    mapUrl: String(gym.mapUrl || ""),
    dayPassWon: gym.dayPassWon ?? null,
    monthPassWon: gym.monthPassWon ?? null,
    rentalHourWon: gym.rentalHourWon ?? null,
    applicantActorId: gym.applicantActorId || null,
    savedAt: new Date().toISOString(),
  };
}

function readRawFavorites() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(GYM_FAVORITES_KEY) ||
      localStorage.getItem(LEGACY_GYM_FAVORITES_KEY) ||
      "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((gym) => gym?.id) : [];
  } catch {
    return [];
  }
}

export function getFavoriteGyms() {
  return readRawFavorites();
}

export function toggleFavoriteGym(gym) {
  const nextGym = sanitizeGym(gym);
  if (!nextGym || typeof localStorage === "undefined") {
    return getFavoriteGyms();
  }

  const current = getFavoriteGyms();
  const exists = current.some((item) => item.id === nextGym.id);
  const next = exists
    ? current.filter((item) => item.id !== nextGym.id)
    : [nextGym, ...current.filter((item) => item.id !== nextGym.id)].slice(
        0,
        MAX_FAVORITES
      );

  localStorage.setItem(GYM_FAVORITES_KEY, JSON.stringify(next));
  localStorage.removeItem(LEGACY_GYM_FAVORITES_KEY);
  return next;
}

export function getFavoriteGymIds() {
  return getFavoriteGyms().map((gym) => gym.id);
}
