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
    code === "PGRST202" ||
    code === "42P01" ||
    code === "42883" ||
    message.includes("fighter_nicknames") ||
    message.includes("check_nickname_available") ||
    message.includes("does not exist") ||
    message.includes("could not find the function")
  );
}

function isRemoteUnavailableError(error) {
  if (isMissingTableError(error)) {
    return true;
  }

  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "");
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "Failed to fetch" ||
    status === 0 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status >= 500 ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("jwt") ||
    message.includes("invalid api key") ||
    message.includes("invalid api")
  );
}

async function checkRemoteNickname(nickname) {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  try {
    // 전체 테이블을 읽지 않고, 사용 가능 여부(boolean)만 반환하는 RPC 사용
    const { data, error } = await supabase.rpc("check_nickname_available", {
      p_nickname: nickname,
    });

    if (error) {
      if (isRemoteUnavailableError(error)) {
        return null;
      }

      throw error;
    }

    if (data === false) {
      return {
        available: false,
        message: "이미 사용 중인 이름입니다.",
      };
    }

    return {
      available: true,
      message: "사용 가능한 이름입니다.",
    };
  } catch (error) {
    // 로컬 우선: 서버가 죽거나 키가 잘못돼도 온보딩을 막지 않는다.
    if (isRemoteUnavailableError(error)) {
      return null;
    }

    throw error;
  }
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

  let remoteResult = null;

  try {
    remoteResult = await checkRemoteNickname(trimmed);
  } catch (error) {
    console.warn("닉네임 원격 확인 실패, 로컬 확인으로 진행:", error);
    remoteResult = null;
  }

  if (remoteResult) {
    return {
      ...remoteResult,
      nickname: trimmed,
    };
  }

  return {
    available: true,
    nickname: trimmed,
    message: "사용 가능한 이름입니다. (이 기기 기준)",
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

  try {
    const { error } = await supabase.from("fighter_nicknames").upsert(
      {
        user_id: userId,
        nickname: trimmed,
      },
      { onConflict: "user_id" },
    );

    if (error && !isRemoteUnavailableError(error)) {
      throw error;
    }
  } catch (error) {
    if (!isRemoteUnavailableError(error)) {
      throw error;
    }

    console.warn("닉네임 원격 등록 실패, 로컬만 저장:", error);
  }

  return trimmed;
}
