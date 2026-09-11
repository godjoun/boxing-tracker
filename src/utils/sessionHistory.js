import { isDevSurfaceLog } from "./devMode";
import { getLogMinutes } from "./trainingStats";

export function getSessionHistoryChange(logs, completedLogId) {
  if (!completedLogId) return null;
  const visibleLogs = logs.filter((log) => !isDevSurfaceLog(log));
  const savedLog = visibleLogs.find((log) => log.id === completedLogId);
  if (!savedLog) return null;

  const minutes = (log) => {
    const value = getLogMinutes(log);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const previousMinutes = visibleLogs
    .filter((log) => log.id !== completedLogId)
    .reduce((sum, log) => sum + minutes(log), 0);

  return {
    addedMinutes: minutes(savedLog),
    previousMinutes,
    totalMinutes: previousMinutes + minutes(savedLog),
    totalRecords: visibleLogs.length,
  };
}
