import {
  deleteRemoteGymListing,
  fetchApprovedGymListings,
  fetchMyGymListings,
  hasGymListingRemote,
  insertRemoteGymListing,
  updateRemoteGymListing,
  uploadGymListingPhoto,
} from "../api/gymListingApi";
import { resolveDojoActorId } from "../api/dojoExchangeApi";
import { getDistanceKm, hasMapCoordinates } from "./gymSearch";

const LISTINGS_KEY = "fitness-league-gym-listings";
export const MAX_GYM_PHOTOS = 5;

export { hasGymListingRemote };

export function normalizeGymPhotoUrls(listingOrUrls, fallbackCover = "") {
  const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

  const coerce = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item || "").trim()).filter(Boolean);
          }
        } catch {
          /* ignore */
        }
      }
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed
          .slice(1, -1)
          .split(",")
          .map((part) => part.trim().replace(/^"(.*)"$/, "$1"))
          .filter(Boolean);
      }
      if (isHttpUrl(trimmed)) return [trimmed];
    }
    return [];
  };

  if (Array.isArray(listingOrUrls) || typeof listingOrUrls === "string") {
    return coerce(listingOrUrls).filter(isHttpUrl).slice(0, MAX_GYM_PHOTOS);
  }
  const listing = listingOrUrls || {};
  const fromArray = coerce(listing.photoUrls).filter(isHttpUrl);
  if (fromArray.length > 0) return fromArray.slice(0, MAX_GYM_PHOTOS);
  const cover = String(listing.photoUrl || fallbackCover || "").trim();
  return isHttpUrl(cover) ? [cover] : [];
}

export function coverGymPhoto(listing) {
  return normalizeGymPhotoUrls(listing)[0] || "";
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return "입점";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** 입점 신청 → 검색 카드 형태 */
export function listingToSearchGym(listing, searchLat, searchLon) {
  if (!listing) return null;

  const lat = hasMapCoordinates(listing) ? Number(listing.lat) : null;
  const lon = hasMapCoordinates(listing) ? Number(listing.lon) : null;
  const distanceKm = getDistanceKm(searchLat, searchLon, lat, lon);
  const fullAddress = [listing.address, listing.addressDetail]
    .filter(Boolean)
    .join(" ");

  const tags = [];
  if (listing.isFeatured) tags.push("추천");
  tags.push("입점");
  if (listing.areaLabel) tags.push(listing.areaLabel);

  return {
    id: listing.id,
    name: listing.gymName,
    address: fullAddress,
    lat,
    lon,
    phone: listing.phone || "",
    photoUrl: coverGymPhoto(listing),
    photoUrls: normalizeGymPhotoUrls(listing),
    tags,
    featured: Boolean(listing.isFeatured),
    dayPassWon: listing.dayPassWon ?? null,
    monthPassWon: listing.monthPassWon ?? null,
    rentalHourWon: listing.rentalHourWon ?? null,
    distanceKm,
    distanceLabel: Number.isFinite(distanceKm)
      ? formatDistance(distanceKm)
      : "위치 확인 필요",
    source: "listing",
    intro: listing.intro || "",
    applicantActorId: listing.applicantActorId || null,
  };
}

/** 검색 카드가 내가 등록한 관인지 */
export function isOwnListedGym(gym, userId) {
  if (!gym?.applicantActorId) return false;
  return gym.applicantActorId === resolveDojoActorId(userId);
}

export function mergeGymSearchResults(listedGyms, baseGyms) {
  const rawListed = Array.isArray(listedGyms) ? listedGyms.filter(Boolean) : [];
  const base = Array.isArray(baseGyms) ? baseGyms.filter(Boolean) : [];
  const key = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  const usedBaseIds = new Set();

  const listed = rawListed.map((gym) => {
    const name = key(gym.name);
    const address = key(gym.address);
    const match = base.find((candidate) => {
      if (usedBaseIds.has(candidate.id)) return false;
      const candidateName = key(candidate.name);
      const candidateAddress = key(candidate.address);
      return (
        (name && candidateName && name === candidateName) ||
        (address &&
          candidateAddress &&
          (address.includes(candidateAddress) ||
            candidateAddress.includes(address)))
      );
    });
    if (!match) return gym;
    usedBaseIds.add(match.id);

    const hasExactLocation = hasMapCoordinates(gym);
    return {
      ...match,
      ...gym,
      address: gym.address || match.address,
      lat: hasExactLocation ? Number(gym.lat) : match.lat,
      lon: hasExactLocation ? Number(gym.lon) : match.lon,
      distanceKm: hasExactLocation ? gym.distanceKm : match.distanceKm,
      distanceLabel: hasExactLocation
        ? gym.distanceLabel
        : match.distanceLabel,
      mapUrl: match.mapUrl || gym.mapUrl,
      source: "listing",
    };
  });

  const listedIds = new Set(listed.map((gym) => gym.id));

  const rest = base.filter((gym) => {
    if (listedIds.has(gym.id) || usedBaseIds.has(gym.id)) return false;
    return true;
  });

  return [...listed, ...rest].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (b.featured && !a.featured) return 1;
    if (a.source === "listing" && b.source !== "listing") return -1;
    if (b.source === "listing" && a.source !== "listing") return 1;
    return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
  });
}

export function splitFeaturedGyms(gyms) {
  const list = Array.isArray(gyms) ? gyms : [];
  const featured = list.filter((gym) => gym.featured);
  const rest = list.filter((gym) => !gym.featured);
  return { featured, rest };
}

/** 승인된 입점관 + (있으면) 내 관 사진/승인대기 미리보기 */
export async function loadApprovedGymsForSearch(lat, lon, { userId } = {}) {
  if (!hasGymListingRemote()) return [];

  const listings = await fetchApprovedGymListings();
  let gyms = listings
    .map((listing) => listingToSearchGym(listing, lat, lon))
    .filter(Boolean);

  if (!userId) return gyms;

  const mine = await loadMyGymListings(userId);
  if (!mine.length) return gyms;

  const mineById = new Map(mine.map((item) => [item.id, item]));
  const myActorId = resolveDojoActorId(userId);

  function findOwnListing(gym) {
    const byId = mineById.get(gym.id);
    if (byId) return byId;
    const gymName = String(gym.name || "").trim().toLowerCase();
    if (!gymName) return null;
    return (
      mine.find(
        (item) =>
          String(item.applicantActorId || "") ===
            String(gym.applicantActorId || myActorId) &&
          String(item.gymName || "").trim().toLowerCase() === gymName
      ) || null
    );
  }

  gyms = gyms.map((gym) => {
    const own = findOwnListing(gym);
    if (!own) return gym;
    const ownPhotos = normalizeGymPhotoUrls(own);
    const searchPhotos = normalizeGymPhotoUrls(gym);
    if (ownPhotos.length === 0) return gym;
    if (ownPhotos.length <= searchPhotos.length) return gym;
    return {
      ...gym,
      photoUrl: ownPhotos[0],
      photoUrls: ownPhotos,
    };
  });

  // 승인 관인데 서버 사진이 비어 있고 내 관에 있으면 서버에도 밀어 넣기
  for (const gym of gyms) {
    const own = findOwnListing(gym);
    if (!own) continue;
    const ownPhotos = normalizeGymPhotoUrls(own);
    const searchPhotos = normalizeGymPhotoUrls(gym);
    if (ownPhotos.length === 0 || searchPhotos.length > 0) continue;
    updateRemoteGymListing({
      ...own,
      id: gym.id,
      applicantActorId: gym.applicantActorId || own.applicantActorId,
      photoUrls: ownPhotos,
      photoUrl: ownPhotos[0],
    }).catch(() => {});
  }

  const shownIds = new Set(gyms.map((gym) => gym.id));
  const previews = [];
  for (const listing of mine) {
    if (shownIds.has(listing.id)) continue;
    if (listing.status === "approved") continue;
    const card = listingToSearchGym(listing, lat, lon);
    if (!card) continue;
    card.tags = [
      "승인 대기",
      ...(card.tags || []).filter((tag) => tag !== "입점"),
    ];
    card.ownerPreview = true;
    previews.push(card);
  }

  return [...previews, ...gyms];
}

export function validateGymListingForm(form) {
  const isCommunitySubmission = form.submissionKind === "community";
  const gymName = String(form.gymName || "").trim();
  const ownerName =
    String(form.ownerName || "").trim() ||
    (isCommunitySubmission ? "사용자 제보" : "");
  const phone = String(form.phone || "").trim();
  const address = String(form.address || "").trim();
  const addressDetail = String(form.addressDetail || "").trim();
  const intro = String(form.intro || "").trim();
  const areaLabel = String(form.areaLabel || "").trim();
  const lat = Number(form.lat);
  const lon = Number(form.lon);
  const photoUrls = normalizeGymPhotoUrls(form.photoUrls, form.photoUrl);

  if (gymName.length < 2) {
    return { ok: false, message: "체육관 이름을 2자 이상 입력해 주세요." };
  }
  if (gymName.length > 40) {
    return { ok: false, message: "체육관 이름은 40자 이하로 입력해 주세요." };
  }
  if (!isCommunitySubmission && !ownerName) {
    return { ok: false, message: "담당자(대표) 이름을 입력해 주세요." };
  }
  if (!isCommunitySubmission && (!phone || phone.length < 8)) {
    return { ok: false, message: "연락 가능한 전화번호를 입력해 주세요." };
  }
  if (address.length < 4) {
    return { ok: false, message: "주소를 입력해 주세요." };
  }
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < 33 ||
    lat > 39 ||
    lon < 124 ||
    lon > 132
  ) {
    return {
      ok: false,
      message: "주소 검색 후 지도에서 체육관 위치를 선택해 주세요.",
    };
  }
  if (intro.length > 200) {
    return { ok: false, message: "소개는 200자 이하로 적어 주세요." };
  }

  const parseOptionalWon = (value, label) => {
    if (value === "" || value === null || value === undefined) {
      return { ok: true, value: null };
    }
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
      lat,
      lon,
      photoUrl: photoUrls[0] || "",
      photoUrls,
      dayPassWon: day.value,
      monthPassWon: month.value,
      rentalHourWon: rental.value,
      submissionKind: isCommunitySubmission ? "community" : "owner",
    },
  };
}

function writeLocalListings(list) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // ignore
  }
}

function saveLocalListing(entry) {
  const current = readLocalGymListings();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(
    0,
    20
  );
  writeLocalListings(next);
  return entry;
}

function markLocalSynced(id) {
  const current = readLocalGymListings();
  writeLocalListings(
    current.map((item) =>
      item.id === id
        ? {
            ...item,
            synced: true,
            source: "server",
            lastSyncError: "",
          }
        : item
    )
  );
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

export function removeLocalGymListing(id) {
  writeLocalListings(readLocalGymListings().filter((item) => item.id !== id));
}

export function listingStatusLabel(status) {
  if (status === "approved") return "검색 노출 중";
  if (status === "rejected") return "반려";
  return "승인 대기";
}

/** 로컬 + 서버 내 신청 합치기 */
export async function loadMyGymListings(userId) {
  const actorId = resolveDojoActorId(userId);
  const local = readLocalGymListings();
  const remote = hasGymListingRemote()
    ? await fetchMyGymListings(actorId)
    : [];

  const byId = new Map();
  for (const item of local) {
    byId.set(item.id, { ...item, source: item.source || "local" });
  }
  for (const item of remote) {
    const prev = byId.get(item.id);
    const mergedUrls = normalizeGymPhotoUrls(
      item.photoUrls?.length ? item.photoUrls : prev?.photoUrls,
      item.photoUrl || prev?.photoUrl
    );
    byId.set(item.id, {
      ...prev,
      ...item,
      photoUrls: mergedUrls,
      photoUrl: mergedUrls[0] || item.photoUrl || prev?.photoUrl || "",
      synced: true,
      source: "server",
    });
  }

  return [...byId.values()].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}

/** 이미지 파일 → JPEG Blob (긴 변 1280) */
export function compressImageFile(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("이미지 파일만 올릴 수 있습니다."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("이미지 변환에 실패했습니다."));
            return;
          }
          resolve(
            new File([blob], "gym.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          );
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    img.src = url;
  });
}

export async function uploadListingPhotoAsync(file, listingId) {
  if (!hasGymListingRemote()) {
    return { url: null, errorMessage: "서버 연결이 없습니다." };
  }
  const compressed = await compressImageFile(file);
  return uploadGymListingPhoto(compressed, listingId);
}

async function uploadPhotoFiles(files, listingId, existingUrls = []) {
  const urls = normalizeGymPhotoUrls(existingUrls);
  const errors = [];

  for (const file of files || []) {
    if (urls.length >= MAX_GYM_PHOTOS) break;
    if (!file) continue;
    try {
      const result = await uploadListingPhotoAsync(file, listingId);
      if (result?.url) {
        urls.push(result.url);
      } else if (result?.errorMessage) {
        errors.push(result.errorMessage);
      }
    } catch (error) {
      errors.push(error?.message || "사진 업로드에 실패했습니다.");
    }
  }

  return {
    photoUrls: urls.slice(0, MAX_GYM_PHOTOS),
    photoUrl: urls[0] || "",
    errorMessage: errors[0] || "",
  };
}

/** 로컬 보관 + 가능하면 서버(입점 신청함)로 전송 */
export async function submitGymListingAsync(
  form,
  { userId, nickname, photoFiles = [] } = {}
) {
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
    applicantActorId:
      checked.payload.submissionKind === "community"
        ? null
        : resolveDojoActorId(userId),
    applicantNickname: nickname || "",
    ...checked.payload,
  };

  let photoWarning = "";
  if (photoFiles.length > 0 && hasGymListingRemote()) {
    const uploaded = await uploadPhotoFiles(photoFiles, entry.id, entry.photoUrls);
    entry.photoUrls = uploaded.photoUrls;
    entry.photoUrl = uploaded.photoUrl;
    photoWarning = uploaded.errorMessage;
  } else if (photoFiles.length > 0 && !hasGymListingRemote()) {
    photoWarning =
      "서버 연결이 없어 사진은 저장되지 않았습니다. 연결 후 수정에서 다시 올려 주세요.";
  }

  saveLocalListing(entry);

  if (!hasGymListingRemote()) {
    const syncMessage =
      photoWarning || "서버 설정이 없어 이 기기에만 저장했습니다.";
    saveLocalListing({ ...entry, lastSyncError: syncMessage });
    return {
      ok: true,
      synced: false,
      listing: { ...entry, lastSyncError: syncMessage },
      syncMessage,
    };
  }

  const remote = await insertRemoteGymListing(entry);
  if (!remote.id) {
    const syncMessage = remote.errorMessage || "서버 저장에 실패했습니다.";
    const failed = { ...entry, lastSyncError: syncMessage };
    saveLocalListing(failed);
    return {
      ok: true,
      synced: false,
      listing: failed,
      syncMessage,
    };
  }

  markLocalSynced(entry.id);
  return {
    ok: true,
    synced: true,
    listing: {
      ...entry,
      synced: true,
      source: "server",
      lastSyncError: photoWarning,
    },
    syncMessage: photoWarning,
  };
}

/** 로컬에만 있는 입점을 서버로 다시 보내기 */
export async function syncGymListingToServer(listing) {
  if (!listing?.id) {
    return { ok: false, synced: false, message: "잘못된 등록입니다." };
  }
  if (!hasGymListingRemote()) {
    return { ok: false, synced: false, message: "서버 연결이 없습니다." };
  }

  const remote = await insertRemoteGymListing({
    ...listing,
    status: listing.status || "pending",
  });

  if (!remote.id) {
    // 이미 서버에 있을 수도 있음 → update 시도
    const updated = await updateRemoteGymListing(listing);
    if (updated) {
      markLocalSynced(listing.id);
      return { ok: true, synced: true, message: "" };
    }
    const message = remote.errorMessage || "서버 저장에 실패했습니다.";
    saveLocalListing({ ...listing, synced: false, lastSyncError: message });
    return {
      ok: false,
      synced: false,
      message,
    };
  }

  markLocalSynced(listing.id);
  return { ok: true, synced: true, message: "" };
}

/** 내 등록 수정 */
export async function updateGymListingAsync(
  listingId,
  form,
  { userId, nickname, photoFiles = [], existing } = {}
) {
  const checked = validateGymListingForm(form);
  if (!checked.ok) {
    return { ok: false, message: checked.message, synced: false, listing: null };
  }

  const actorId = resolveDojoActorId(userId);
  let photoUrls = normalizeGymPhotoUrls(
    checked.payload.photoUrls,
    checked.payload.photoUrl
  );
  let photoWarning = "";

  if (photoFiles.length > 0 && hasGymListingRemote()) {
    const uploaded = await uploadPhotoFiles(photoFiles, listingId, photoUrls);
    photoUrls = uploaded.photoUrls;
    photoWarning = uploaded.errorMessage;
  } else if (photoFiles.length > 0 && !hasGymListingRemote()) {
    photoWarning =
      "서버 연결이 없어 새 사진은 저장되지 않았습니다. 연결 후 다시 저장해 주세요.";
  }

  const entry = {
    ...existing,
    id: listingId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    status: existing?.status || "pending",
    applicantActorId: existing?.applicantActorId || actorId,
    applicantNickname: nickname || existing?.applicantNickname || "",
    ...checked.payload,
    photoUrls,
    photoUrl: photoUrls[0] || "",
    synced: false,
    source: "local",
    lastSyncError: photoWarning,
  };

  saveLocalListing(entry);

  if (!hasGymListingRemote()) {
    return {
      ok: true,
      synced: false,
      listing: entry,
      syncMessage: photoWarning,
    };
  }

  const ok = await updateRemoteGymListing(entry);
  if (!ok) {
    return {
      ok: true,
      synced: false,
      listing: entry,
      syncMessage:
        photoWarning ||
        "서버 수정에 실패했습니다. dojo_gym_listings_photos.sql 실행 여부를 확인해 주세요.",
    };
  }

  markLocalSynced(entry.id);
  return {
    ok: true,
    synced: true,
    listing: {
      ...entry,
      synced: true,
      source: "server",
      lastSyncError: photoWarning,
    },
    syncMessage: photoWarning,
  };
}

/** 내 등록 삭제 */
export async function deleteGymListingAsync(listingId, { userId } = {}) {
  const actorId = resolveDojoActorId(userId);
  removeLocalGymListing(listingId);

  if (!hasGymListingRemote()) {
    return { ok: true, synced: false };
  }

  const synced = await deleteRemoteGymListing(listingId, actorId);
  return { ok: true, synced };
}
