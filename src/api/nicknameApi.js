import { getSupabase } from "../lib/supabaseClient";

const LOCAL_REGISTRY_KEY = "fitness-league-nickname-registry";

export function normalizeNickname(nickname) {
  return String(nickname || "").trim().toLowerCase();
}

export function validateNicknameFormat(nickname) {
  const trimmed = String(nickname || "").trim();

  if (trimmed.length < 2) {
    throw new Error("파이터 이름은 2자 이상 입력해 주세요.");
  }

  if (trimmed.length > 12) {
    throw new Error("파이터 이름은 12자 이하로 입력해 주세요.");
  }

  if (!/^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ_]+$/.test(trimmed)) {
    throw new Error("한글, 영문, 숫자만 사용할 수 있습니다.");
  }

  return trimmed;
}

function readLocalRegistry() {
  try {
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalRegistry(registry) {
  localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registry));
}

function isTakenLocally(normalized, userId) {
  const registry = readLocalRegistry();
  const ownerId = registry[normalized];

  return Boolean(ownerId && ownerId !== userId);
}

function isMissingTableError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "");

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("fighter_nicknames") ||
    message.includes("does not exist")
  );
}

async function checkRemoteNickname(nickname, userId) {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("fighter_nicknames")
    .select("user_id")
    .eq("nickname", nickname)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }

    throw error;
  }

  if (data?.user_id && data.user_id !== userId) {
    return {
      available: false,
      message: "이미 사용 중인 이름입니다.",
    };
  }

  return {
    available: true,
    message: "사용 가능한 이름입니다.",
  };
}

export async function checkNicknameAvailability(nickname, userId) {
  const trimmed = validateNicknameFormat(nickname);
  const normalized = normalizeNickname(trimmed);

  if (isTakenLocally(normalized, userId)) {
    return {
      available: false,
      nickname: trimmed,
      message: "이미 사용 중인 이름입니다.",
    };
  }

  const remoteResult = await checkRemoteNickname(trimmed, userId);

  if (remoteResult) {
    return {
      ...remoteResult,
      nickname: trimmed,
    };
  }

  return {
    available: true,
    nickname: trimmed,
    message: "사용 가능한 이름입니다.",
  };
}

export async function registerNickname(nickname, userId) {
  const trimmed = validateNicknameFormat(nickname);
  const normalized = normalizeNickname(trimmed);
  const registry = readLocalRegistry();

  registry[normalized] = userId;
  writeLocalRegistry(registry);

  const supabase = getSupabase();

  if (!supabase || userId === "local-user" || userId === "dev-local-user") {
    return trimmed;
  }

  const { error } = await supabase.from("fighter_nicknames").upsert(
    {
      user_id: userId,
      nickname: trimmed,
    },
    { onConflict: "user_id" },
  );

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return trimmed;
}
