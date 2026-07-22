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

function mapListingRow(row) {
  if (!row?.id) return null;
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
    photoUrl: row.photo_url || "",
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
    photo_url: listing.photoUrl || "",
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
  if (!supabase) return null;

  const fullPayload = {
    id: listing.id,
    ...toRemotePayload(listing),
    status: "pending",
    source: "app",
  };

  const legacyPayload = { ...fullPayload };
  delete legacyPayload.photo_url;

  try {
    let { error } = await supabase.from("dojo_gym_listings").insert(fullPayload);

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("photo_url") || message.includes("is_featured")) {
        ({ error } = await supabase
          .from("dojo_gym_listings")
          .insert(legacyPayload));
      }
    }

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return listing.id;
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function updateRemoteGymListing(listing) {
  const supabase = getSupabase();
  if (!supabase || !listing?.id || !listing?.applicantActorId) return false;

  try {
    const { error } = await supabase
      .from("dojo_gym_listings")
      .update(toRemotePayload(listing))
      .eq("id", listing.id)
      .eq("applicant_actor_id", listing.applicantActorId);

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
        "id, gym_name, owner_name, phone, address, address_detail, intro, area_label, day_pass_won, month_pass_won, rental_hour_won, photo_url, is_featured, status, created_at, applicant_actor_id, applicant_nickname"
      )
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("is_featured")) {
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

/** 체육관 사진 → Storage public URL */
export async function uploadGymListingPhoto(file, listingId) {
  const supabase = getSupabase();
  if (!supabase || !file || !listingId) return null;

  const ext =
    (file.type || "").includes("png")
      ? "png"
      : (file.type || "").includes("webp")
        ? "webp"
        : "jpg";
  const path = `${listingId}/${Date.now()}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from("gym-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    const { data } = supabase.storage.from("gym-photos").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
