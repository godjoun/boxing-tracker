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
    message.includes("dojo_gym_listings")
  );
}

function toWonOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export async function insertRemoteGymListing(listing) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const payload = {
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
    status: "pending",
    source: "app",
  };

  try {
    // select 없이 insert — anon에 select RLS가 없어도 성공 판정
    const { error } = await supabase.from("dojo_gym_listings").insert(payload);

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
