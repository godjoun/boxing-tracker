import {
  fetchApprovedGymListings,
  hasGymListingRemote,
  insertRemoteGymListing,
} from "../api/gymListingApi";
import { resolveDojoActorId } from "../api/dojoExchangeApi";
import { findAreaByQuery, getDistanceKm } from "./gymSearch";

const LISTINGS_KEY = "fitness-league-gym-listings";

export { hasGymListingRemote };

function formatDistance(km) {
  if (!Number.isFinite(km)) return "입점";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** 입점 신청 → 검색 카드 형태 */
export function listingToSearchGym(listing, searchLat, searchLon) {
  if (!listing) return null;

  const area =
    findAreaByQuery(listing.areaLabel) || findAreaByQuery(listing.address);
  const lat = area?.lat ?? searchLat;
  const lon = area?.lon ?? searchLon;
  const distanceKm = getDistanceKm(searchLat, searchLon, lat, lon);
  const fullAddress = [listing.address, listing.addressDetail]
    .filter(Boolean)
    .join(" ");

  return {
    id: listing.id,
    name: listing.gymName,
    address: fullAddress,
    lat,
    lon,
    phone: listing.phone || "",
    tags: ["입점", listing.areaLabel].filter(Boolean),
    dayPassWon: listing.dayPassWon ?? null,
    monthPassWon: listing.monthPassWon ?? null,
    rentalHourWon: listing.rentalHourWon ?? null,
    distanceKm,
    distanceLabel: area ? formatDistance(distanceKm) : "입점",
    source: "listing",
    intro: listing.intro || "",
  };
}

export function mergeGymSearchResults(listedGyms, baseGyms) {
  const listed = Array.isArray(listedGyms) ? listedGyms.filter(Boolean) : [];
  const base = Array.isArray(baseGyms) ? baseGyms.filter(Boolean) : [];
  const listedIds = new Set(listed.map((gym) => gym.id));
  const listedNames = new Set(
    listed.map((gym) => String(gym.name || "").trim().toLowerCase())
  );

  const rest = base.filter((gym) => {
    if (listedIds.has(gym.id)) return false;
    const name = String(gym.name || "").trim().toLowerCase();
    return !name || !listedNames.has(name);
  });

  return [...listed, ...rest].sort((a, b) => {
    if (a.source === "listing" && b.source !== "listing") return -1;
    if (b.source === "listing" && a.source !== "listing") return 1;
    return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
  });
}

/** 승인된 입점관을 검색 결과용으로 로드 */
export async function loadApprovedGymsForSearch(lat, lon) {
  if (!hasGymListingRemote()) return [];

  const listings = await fetchApprovedGymListings();
  return listings
    .map((listing) => listingToSearchGym(listing, lat, lon))
    .filter(Boolean);
}

export function validateGymListingForm(form) {
  const gymName = String(form.gymName || "").trim();
  const ownerName = String(form.ownerName || "").trim();
  const phone = String(form.phone || "").trim();
  const address = String(form.address || "").trim();
  const addressDetail = String(form.addressDetail || "").trim();
  const intro = String(form.intro || "").trim();
  const areaLabel = String(form.areaLabel || "").trim();

  if (gymName.length < 2) {
    return { ok: false, message: "체육관 이름을 2자 이상 입력해 주세요." };
  }
  if (gymName.length > 40) {
    return { ok: false, message: "체육관 이름은 40자 이하로 입력해 주세요." };
  }
  if (!ownerName) {
    return { ok: false, message: "담당자(대표) 이름을 입력해 주세요." };
  }
  if (!phone || phone.length < 8) {
    return { ok: false, message: "연락 가능한 전화번호를 입력해 주세요." };
  }
  if (address.length < 4) {
    return { ok: false, message: "주소를 입력해 주세요." };
  }
  if (intro.length > 200) {
    return { ok: false, message: "소개는 200자 이하로 적어 주세요." };
  }

  const parseOptionalWon = (value, label) => {
    if (value === "" || value === null || value === undefined) return { ok: true, value: null };
    const n = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, message: `${label}은 0 이상 숫자로 입력해 주세요.` };
    }
    return { ok: true, value: Math.round(n) };
  };

  const day = parseOptionalWon(form.dayPassWon, "일일권");
  if (!day.ok) return day;
  const month = parseOptionalWon(form.monthPassWon, "한달권");
  if (!month.ok) return month;
  const rental = parseOptionalWon(form.rentalHourWon, "대여비");
  if (!rental.ok) return rental;

  return {
    ok: true,
    payload: {
      gymName,
      ownerName,
      phone,
      address,
      addressDetail,
      intro,
      areaLabel,
      dayPassWon: day.value,
      monthPassWon: month.value,
      rentalHourWon: rental.value,
    },
  };
}

function saveLocalListing(entry) {
  if (typeof localStorage === "undefined") return entry;
  try {
    const current = JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]");
    const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 20);
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify([entry]));
  }
  return entry;
}

function markLocalSynced(id) {
  if (typeof localStorage === "undefined" || !id) return;
  try {
    const current = JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]");
    if (!Array.isArray(current)) return;
    localStorage.setItem(
      LISTINGS_KEY,
      JSON.stringify(
        current.map((item) =>
          item.id === id ? { ...item, synced: true, source: "server" } : item
        )
      )
    );
  } catch {
    // ignore
  }
}

export function readLocalGymListings() {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 로컬 보관 + 가능하면 서버(입점 신청함)로 전송 */
export async function submitGymListingAsync(form, { userId, nickname } = {}) {
  const checked = validateGymListingForm(form);
  if (!checked.ok) {
    return { ok: false, message: checked.message, synced: false, listing: null };
  }

  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    synced: false,
    source: "local",
    applicantActorId: resolveDojoActorId(userId),
    applicantNickname: nickname || "",
    ...checked.payload,
  };

  saveLocalListing(entry);

  if (!hasGymListingRemote()) {
    return { ok: true, synced: false, listing: entry };
  }

  const remoteId = await insertRemoteGymListing(entry);
  if (!remoteId) {
    return { ok: true, synced: false, listing: entry };
  }

  markLocalSynced(entry.id);
  return {
    ok: true,
    synced: true,
    listing: { ...entry, synced: true, source: "server" },
  };
}
