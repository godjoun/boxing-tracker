import { normalizeLogCategory } from "./logCategories";
import { normalizeProofLog } from "./recordSource";
import { normalizeLogScores } from "./trainingStats";

function normalizeTrainingLogDraft(log) {
  return normalizeProofLog(normalizeLogCategory(log));
}

/** 로드, 추가, 수정, 백업 복원이 함께 쓰는 기록 정규화. 저장 키는 바꾸지 않는다. */
export function normalizeStoredTrainingLogs(logs = []) {
  const sourceLogs = Array.isArray(logs) ? logs : [];
  return normalizeLogScores(
    sourceLogs
      .filter((log) => log && typeof log === "object")
      .map((log) => normalizeTrainingLogDraft(log))
  );
}

export function normalizeTrainingLog(log) {
  const [normalized] = normalizeStoredTrainingLogs([log]);
  return normalized ?? null;
}
