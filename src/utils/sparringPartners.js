import { fetchSparringPartners } from "../api/dojoApi";
import {
  normalizeWeightClass,
  suggestWeightClass,
} from "../data/proBoxingWeightClasses";
import {
  enrichSparringPartner,
  sortSparringPartners,
} from "./veteranPerks";

export {
  formatWeightClassOption,
  getWeightClassDisplayKg,
  isValidWeightClass,
  normalizeWeightClass,
  suggestWeightClass,
  WEIGHT_CLASS_ANY,
  WEIGHT_CLASSES,
} from "../data/proBoxingWeightClasses";

const STORAGE_KEY_PREFIX = "fitness-league-sparring-listing";

export const EXPERIENCE_LEVELS = [
  "초보 (6개월 미만)",
  "1년차",
  "2~3년",
  "4년 이상",
  "아마추어",
];

export const SPARRING_STYLES = ["라이트", "미디엄", "하드", "기술 위주"];

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX;
}

export function migrateLegacyListing(userId) {
  if (!userId) return;

  const nextKey = getStorageKey(userId);

  if (localStorage.getItem(nextKey)) {
    return;
  }

  const legacy = localStorage.getItem(STORAGE_KEY_PREFIX);

  if (legacy) {
    localStorage.setItem(nextKey, legacy);
  }
}

export function getMyListing(userId) {
  migrateLegacyListing(userId);

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMyListing(listing, userId) {
  const payload = {
    ...listing,
    id: "my-listing",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
  return payload;
}

export function clearMyListing(userId) {
  localStorage.removeItem(getStorageKey(userId));
}

export function buildListingFromProfile(profile, { active = false, fighterLevel = 1 } = {}) {
  return enrichSparringPartner(
    {
      nickname: profile.nickname || "나",
      weightClass: normalizeWeightClass(
        profile.weightClass || suggestWeightClass(profile.weightKg),
      ),
      experience: profile.experience || "1년차",
      style: profile.sparringStyle || "미디엄",
      area: profile.area || "",
      note: profile.bio || "",
      contact: profile.contact || "",
      heightCm: profile.heightCm || null,
      weightKg: profile.weightKg || null,
      reachCm: profile.reachCm || null,
      active,
      distanceKm: 0,
    },
    fighterLevel
  );
}

export function syncListingFromProfile(profile, userId, options = {}) {
  const existing = getMyListing(userId);
  const nextListing = {
    ...buildListingFromProfile(profile, {
      active: existing?.active ?? options.active ?? false,
      fighterLevel: options.fighterLevel ?? existing?.fighterLevel ?? 1,
    }),
    note: existing?.note || profile.bio || "",
    contact: existing?.contact || profile.contact || "",
    area: existing?.area || profile.area || "",
  };

  return saveMyListing(nextListing, userId);
}

export async function getAvailablePartners(
  lat,
  lon,
  filter = {},
  userId,
  { fighterLevel = 1 } = {}
) {
  const myListing = getMyListing(userId);
  let results = await fetchSparringPartners(lat, lon, filter);

  results = results.map((partner) =>
    enrichSparringPartner(partner, partner.fighterLevel ?? partner.level)
  );

  if (myListing?.active) {
    const enrichedMine = enrichSparringPartner(
      {
        ...myListing,
        distanceLabel: "내 프로필",
        isMine: true,
        distanceKm: 0,
      },
      fighterLevel
    );

    results = [enrichedMine, ...results.filter((partner) => !partner.isMine)];
  }

  return sortSparringPartners(results);
}
