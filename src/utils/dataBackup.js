import { sanitizeProfileForBackup } from "./privacy";

export const BACKUP_VERSION = 1;
export const BACKUP_APP_ID = "boxing-tracker";

export function createBackupPayload({ logs, feed, profile, mode }) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP_ID,
    data: {
      logs: Array.isArray(logs) ? logs : [],
      feed: Array.isArray(feed) ? feed : [],
      profile: sanitizeProfileForBackup(
        profile && typeof profile === "object" ? profile : {}
      ),
      mode: mode || "solo",
    },
  };
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("백업 파일 형식이 올바르지 않습니다.");
  }

  if (payload.app && payload.app !== BACKUP_APP_ID) {
    throw new Error("다른 앱의 백업 파일입니다.");
  }

  if (!payload.data || typeof payload.data !== "object") {
    throw new Error("백업 데이터가 비어 있습니다.");
  }

  if (!Array.isArray(payload.data.logs)) {
    throw new Error("훈련 기록 데이터가 없습니다.");
  }

  return payload;
}

export function parseBackupFileText(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON 파일을 읽을 수 없습니다.");
  }

  return validateBackupPayload(parsed);
}

export function mergeLogs(existingLogs, importedLogs) {
  const byId = new Map();

  existingLogs.forEach((log) => {
    if (log?.id) byId.set(log.id, log);
  });

  importedLogs.forEach((log) => {
    if (!log?.id) return;
    byId.set(log.id, log);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));

    if (dateCompare !== 0) return dateCompare;

    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function mergeFeed(existingFeed, importedFeed) {
  const byKey = new Map();

  existingFeed.forEach((item) => {
    const key = item.feedId || item.id;
    if (key) byKey.set(key, item);
  });

  importedFeed.forEach((item) => {
    const key = item.feedId || item.id;
    if (key) byKey.set(key, item);
  });

  return Array.from(byKey.values()).sort((a, b) =>
    String(b.sharedAt || "").localeCompare(String(a.sharedAt || ""))
  );
}

export function downloadBackupJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `boxing-tracker-backup-${stamp}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function formatBackupSummary(payload) {
  const logs = payload?.data?.logs || [];
  const profile = payload?.data?.profile || {};

  return {
    exportedAt: payload?.exportedAt || "",
    logCount: logs.length,
    nickname: profile.nickname || "나",
    version: payload?.version || 0,
  };
}
