import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export function hasGymListingRemote() {
  return isSupabaseConfigured && Boolean(getSupabase());
}

function isRemoteUnavailable(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "");
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "PGRST205" ||
    code === "PGRST202" ||
    code === "42P01" ||
    code === "42883" ||
    status === 0 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status >= 500 ||
    message.includes("does not exist") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("dojo_gym_listings") ||
    message.includes("list_my_dojo_gym_listings")
  );
}

function toWonOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function normalizePhotoUrls(value, fallbackCover = "") {
  const isHttpUrl = (item) => /^https?:\/\//i.test(String(item || "").trim());
  const fromArray = Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(isHttpUrl)
    : [];
  if (fromArray.length > 0) return fromArray.slice(0, 5);
  const cover = String(fallbackCover || "").trim();
  return isHttpUrl(cover) ? [cover] : [];
}

function mapListingRow(row) {
  if (!row?.id) return null;
  const photoUrls = normalizePhotoUrls(row.photo_urls, row.photo_url);
  return {
    id: row.id,
    gymName: row.gym_name || "",
    ownerName: row.owner_name || "",
    phone: row.phone || "",
    address: row.address || "",
    addressDetail: row.address_detail || "",
    intro: row.intro || "",
    areaLabel: row.area_label || "",
    dayPassWon: row.day_pass_won ?? null,
    monthPassWon: row.month_pass_won ?? null,
    rentalHourWon: row.rental_hour_won ?? null,
    photoUrl: photoUrls[0] || row.photo_url || "",
    photoUrls,
    isFeatured: Boolean(row.is_featured),
    status: row.status || "pending",
    createdAt: row.created_at || null,
    applicantActorId: row.applicant_actor_id || null,
    applicantNickname: row.applicant_nickname || "",
    source: "server",
    synced: true,
  };
}

function toRemotePayload(listing, { includeStatus = false } = {}) {
  const photoUrls = normalizePhotoUrls(listing.photoUrls, listing.photoUrl);
  const payload = {
    gym_name: listing.gymName,
    owner_name: listing.ownerName || "",
    phone: listing.phone,
    address: listing.address,
    address_detail: listing.addressDetail || "",
    intro: listing.intro || "",
    area_label: listing.areaLabel || "",
    day_pass_won: toWonOrNull(listing.dayPassWon),
    month_pass_won: toWonOrNull(listing.monthPassWon),
    rental_hour_won: toWonOrNull(listing.rentalHourWon),
    photo_url: photoUrls[0] || "",
    photo_urls: photoUrls,
    applicant_actor_id: listing.applicantActorId || null,
    applicant_nickname: listing.applicantNickname || "",
  };
  if (includeStatus) {
    payload.status = listing.status || "pending";
  }
  return payload;
}

export async function insertRemoteGymListing(listing) {
  const supabase = getSupabase();
  if (!supabase) {
    return { id: null, errorMessage: "서버 연결이 없습니다." };
  }

  const base = {
    id: listing.id,
    ...toRemotePayload(listing),
    status: listing.status || "pending",
    source: "app",
  };

  const withoutUrls = { ...base };
  delete withoutUrls.photo_urls;

  const withoutPhotos = { ...withoutUrls };
  delete withoutPhotos.photo_url;

  const minimalPayload = {
    id: listing.id,
    gym_name: listing.gymName,
    owner_name: listing.ownerName || "",
    phone: listing.phone,
    address: listing.address,
    address_detail: listing.addressDetail || "",
    intro: listing.intro || "",
    area_label: listing.areaLabel || "",
    day_pass_won: toWonOrNull(listing.dayPassWon),
    month_pass_won: toWonOrNull(listing.monthPassWon),
    rental_hour_won: toWonOrNull(listing.rentalHourWon),
    applicant_actor_id: listing.applicantActorId || null,
    applicant_nickname: listing.applicantNickname || "",
    status: listing.status || "pending",
    source: "app",
  };

  const attempts = [base, withoutUrls, withoutPhotos, minimalPayload];
  const wantedPhotos = normalizePhotoUrls(listing.photoUrls, listing.photoUrl);

  try {
    let lastError = null;
    let savedWithoutPhotos = false;
    for (const payload of attempts) {
      const { error } = await supabase.from("dojo_gym_listings").insert(payload);
      if (!error) {
        const droppedPhotos =
          wantedPhotos.length > 0 &&
          (!Object.prototype.hasOwnProperty.call(payload, "photo_url") ||
            !payload.photo_url);
        if (droppedPhotos) {
          savedWithoutPhotos = true;
          break;
        }
        return { id: listing.id, errorMessage: "" };
      }
      lastError = error;
      console.warn("[gymListing] insert failed", error.message || error);
    }

    if (savedWithoutPhotos) {
      const updated = await updateRemoteGymListing(listing);
      if (updated) {
        return { id: listing.id, errorMessage: "" };
      }
      return {
        id: listing.id,
        errorMessage:
          "입점은 저장됐지만 사진 컬럼이 없습니다. dojo_gym_listings_photos.sql을 실행한 뒤 다시 저장해 주세요.",
      };
    }

    return {
      id: null,
      errorMessage: formatInsertError(lastError),
    };
  } catch (error) {
    if (isRemoteUnavailable(error)) {
      return {
        id: null,
        errorMessage: formatInsertError(error),
      };
    }
    throw error;
  }
}

function formatInsertError(error) {
  const message = String(error?.message || error || "");
  const lower = message.toLowerCase();
  if (
    lower.includes("row-level security") ||
    lower.includes("42501") ||
    String(error?.code || "") === "42501"
  ) {
    return "서버 권한(RLS) 때문에 저장이 막혔습니다. Supabase에서 dojo_gym_listings_insert_fix.sql을 실행해 주세요.";
  }
  if (lower.includes("does not exist") || String(error?.code || "") === "42P01") {
    return "dojo_gym_listings 테이블이 없습니다. dojo_gym_listings.sql을 먼저 실행해 주세요.";
  }
  return message || "서버 저장에 실패했습니다.";
}

export async function updateRemoteGymListing(listing) {
  const supabase = getSupabase();
  if (!supabase || !listing?.id || !listing?.applicantActorId) return false;

  const full = toRemotePayload(listing);
  const withoutUrls = { ...full };
  delete withoutUrls.photo_urls;
  const photoOnly = {
    photo_url: full.photo_url || "",
    photo_urls: full.photo_urls || [],
  };
  const photoUrlOnly = {
    photo_url: full.photo_url || "",
  };

  try {
    for (const payload of [full, withoutUrls]) {
      const { error } = await supabase
        .from("dojo_gym_listings")
        .update(payload)
        .eq("id", listing.id)
        .eq("applicant_actor_id", listing.applicantActorId);

      if (!error) {
        // 사진만 한 번 더 밀어 photo_url 누락을 막는다
        if (full.photo_url || (full.photo_urls && full.photo_urls.length)) {
          const photoPayload =
            Object.prototype.hasOwnProperty.call(payload, "photo_urls")
              ? photoOnly
              : photoUrlOnly;
          await supabase
            .from("dojo_gym_listings")
            .update(photoPayload)
            .eq("id", listing.id)
            .eq("applicant_actor_id", listing.applicantActorId);
        }
        return true;
      }
      if (isRemoteUnavailable(error)) return false;
      console.warn("[gymListing] update failed", error.message || error);
    }
    return false;
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function deleteRemoteGymListing(id, actorId) {
  const supabase = getSupabase();
  if (!supabase || !id || !actorId) return false;

  try {
    const { error } = await supabase
      .from("dojo_gym_listings")
      .delete()
      .eq("id", id)
      .eq("applicant_actor_id", actorId);

    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }

    return true;
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

/** 승인된 입점관만 (RLS: status = approved) */
export async function fetchApprovedGymListings() {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let { data, error } = await supabase
      .from("dojo_gym_listings")
      .select(
        "id, gym_name, owner_name, phone, address, address_detail, intro, area_label, day_pass_won, month_pass_won, rental_hour_won, photo_url, photo_urls, is_featured, status, created_at, applicant_actor_id, applicant_nickname"
      )
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("photo_urls") || message.includes("is_featured")) {
        ({ data, error } = await supabase
          .from("dojo_gym_listings")
          .select(
            "id, gym_name, owner_name, phone, address, address_detail, intro, area_label, day_pass_won, month_pass_won, rental_hour_won, photo_url, status, created_at, applicant_actor_id, applicant_nickname"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(80));
      }
    }

    if (error) {
      if (isRemoteUnavailable(error)) return [];
      throw error;
    }

    return (data || []).map(mapListingRow).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return [];
    throw error;
  }
}

/** 내 신청 (pending 포함) — RPC */
export async function fetchMyGymListings(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return [];

  try {
    const { data, error } = await supabase.rpc("list_my_dojo_gym_listings", {
      p_actor_id: actorId,
    });

    if (error) {
      if (isRemoteUnavailable(error)) return [];
      throw error;
    }

    return (data || []).map(mapListingRow).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return [];
    throw error;
  }
}

/** 체육관 사진 → Storage public URL. 실패 시 메시지 포함 */
export async function uploadGymListingPhoto(file, listingId) {
  const supabase = getSupabase();
  if (!supabase || !file || !listingId) {
    return { url: null, errorMessage: "서버 연결 또는 파일이 없습니다." };
  }

  const ext =
    (file.type || "").includes("png")
      ? "png"
      : (file.type || "").includes("webp")
        ? "webp"
        : "jpg";
  const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from("gym-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      console.warn("[gymListing] photo upload failed", error.message || error);
      return {
        url: null,
        errorMessage:
          error.message?.includes("Bucket") || error.message?.includes("not found")
            ? "사진 저장소(gym-photos)가 없습니다. dojo_gym_listings_photos.sql을 실행해 주세요."
            : `사진 업로드 실패: ${error.message || "권한/버킷을 확인해 주세요."}`,
      };
    }

    const { data } = supabase.storage.from("gym-photos").getPublicUrl(path);
    return { url: data?.publicUrl || null, errorMessage: "" };
  } catch (error) {
    if (isRemoteUnavailable(error)) {
      return {
        url: null,
        errorMessage: "사진 업로드에 실패했습니다. 네트워크·버킷을 확인해 주세요.",
      };
    }
    throw error;
  }
}
