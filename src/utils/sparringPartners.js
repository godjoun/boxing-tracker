import { fetchSparringPartners } from "../api/dojoApi";

const STORAGE_KEY = "fitness-league-sparring-listing";

export const WEIGHT_CLASSES = [
  "플라이급",
  "벤텀급",
  "페더급",
  "라이트급",
  "웰터급",
  "미들급",
  "라이트헤비",
  "헤비급",
  "상관없음",
];

export const EXPERIENCE_LEVELS = [
  "초보 (6개월 미만)",
  "1년차",
  "2~3년",
  "4년 이상",
  "아마추어",
];

export const SPARRING_STYLES = ["라이트", "미디엄", "하드", "기술 위주"];

export function getMyListing() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMyListing(listing) {
  const payload = {
    ...listing,
    id: "my-listing",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearMyListing() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function getAvailablePartners(lat, lon, filter = {}) {
  const myListing = getMyListing();
  let results = await fetchSparringPartners(lat, lon, filter);

  if (myListing?.active) {
    results = [
      {
        ...myListing,
        distanceLabel: "내 프로필",
        isMine: true,
        distanceKm: 0,
      },
      ...results,
    ];
  }

  return results.sort((a, b) => {
    if (a.isMine) return -1;
    if (b.isMine) return 1;
    return a.distanceKm - b.distanceKm;
  });
}
