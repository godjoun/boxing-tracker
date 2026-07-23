const INTEREST_KEY = "fitness-league-sparring-interests";

function readInterests() {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(INTEREST_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInterests(items) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(INTEREST_KEY, JSON.stringify(items.slice(0, 80)));
}

/** 레거시 로컬 관심 기록: 실제 매칭은 Supabase RPC를 사용한다. */
export function hasSparringInterest(partnerId, userId = null) {
  if (!partnerId) return false;
  return readInterests().some(
    (item) =>
      item.partnerId === partnerId &&
      (!userId || item.fromUserId === userId)
  );
}

export function sendSparringInterest(partner, fromUser = {}) {
  if (!partner?.id) return null;

  const entry = {
    id: crypto.randomUUID(),
    partnerId: partner.id,
    partnerNickname: partner.nickname || "상대",
    fromUserId: fromUser.userId || null,
    fromNickname: fromUser.nickname || "나",
    createdAt: new Date().toISOString(),
  };

  const withoutDup = readInterests().filter(
    (item) =>
      !(
        item.partnerId === entry.partnerId &&
        item.fromUserId === entry.fromUserId
      )
  );

  writeInterests([entry, ...withoutDup]);
  return entry;
}

export function cancelSparringInterest(partnerId, userId = null) {
  if (!partnerId || !hasSparringInterest(partnerId, userId)) return false;

  writeInterests(
    readInterests().filter(
      (item) =>
        !(
          item.partnerId === partnerId &&
          (!userId || item.fromUserId === userId)
        )
    )
  );
  return true;
}

export function listSparringInterests(userId = null) {
  const all = readInterests();
  if (!userId) return all;
  return all.filter((item) => item.fromUserId === userId);
}

/** 공개 카드에서 연락처 제거 */
export function toPublicSparringPartner(partner) {
  if (!partner) return partner;
  const { contact: _contact, ...rest } = partner;
  return rest;
}
