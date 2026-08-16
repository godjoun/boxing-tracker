import { getTechniqueCatalog } from "./techniqueCatalog";

export const STYLE_PROGRESS_STORAGE_KEY = "mantle-style-progress-v1";

function emptyState() {
  return {
    completed: {},
    lastStyleId: null,
    lastStageId: null,
    lastCompletedAt: null,
  };
}

function getCatalogStyle(styleId) {
  if (!styleId) return null;
  return getTechniqueCatalog().find((style) => style.id === styleId) || null;
}

function getStageList(style) {
  return Array.isArray(style?.stages) ? style.stages : [];
}

function normalizeCompleted(completed) {
  if (!completed || typeof completed !== "object" || Array.isArray(completed)) {
    return {};
  }

  const next = {};

  for (const style of getTechniqueCatalog()) {
    const raw = completed[style.id];
    if (!Array.isArray(raw)) continue;

    const allowed = new Set(getStageList(style).map((stage) => stage.id));
    const unique = [];

    for (const stageId of raw) {
      if (typeof stageId !== "string" || !allowed.has(stageId)) continue;
      if (unique.includes(stageId)) continue;
      unique.push(stageId);
    }

    if (unique.length > 0) {
      next[style.id] = unique;
    }
  }

  return next;
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") {
    return emptyState();
  }

  const completed = normalizeCompleted(raw.completed);
  const lastStyleId =
    typeof raw.lastStyleId === "string" && getCatalogStyle(raw.lastStyleId)
      ? raw.lastStyleId
      : null;
  const lastStyle = lastStyleId ? getCatalogStyle(lastStyleId) : null;
  const lastStageId =
    lastStyle &&
    typeof raw.lastStageId === "string" &&
    getStageList(lastStyle).some((stage) => stage.id === raw.lastStageId)
      ? raw.lastStageId
      : null;

  return {
    completed,
    lastStyleId,
    lastStageId,
    lastCompletedAt:
      typeof raw.lastCompletedAt === "string" ? raw.lastCompletedAt : null,
  };
}

export function readStyleProgress() {
  if (typeof localStorage === "undefined") {
    return emptyState();
  }

  try {
    const raw = localStorage.getItem(STYLE_PROGRESS_STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

function writeStyleProgress(progress) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STYLE_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function getCompletedStyleStages(
  styleId,
  progress = readStyleProgress()
) {
  const list = progress.completed?.[styleId];
  return Array.isArray(list) ? [...list] : [];
}

export function isStyleStageComplete(
  styleId,
  stageId,
  progress = readStyleProgress()
) {
  return getCompletedStyleStages(styleId, progress).includes(stageId);
}

export function getStyleStageStats(styleId, progress = readStyleProgress()) {
  const style = getCatalogStyle(styleId);
  const total = getStageList(style).length;
  const completed = getCompletedStyleStages(styleId, progress).length;

  return { completed, total };
}

export function getNextStyleStage(styleId, progress = readStyleProgress()) {
  const style = getCatalogStyle(styleId);
  if (!style) return null;

  const done = new Set(getCompletedStyleStages(styleId, progress));
  const stageIndex = getStageList(style).findIndex(
    (stage) => !done.has(stage.id)
  );

  if (stageIndex < 0) return null;

  const stage = style.stages[stageIndex];

  return {
    styleId: style.id,
    styleTitle: style.title,
    stageId: stage.id,
    stageTitle: stage.title,
    stageLabel: stage.label,
    order: stageIndex + 1,
    total: style.stages.length,
  };
}

export function canMarkStyleStageComplete({
  isFullComplete,
  styleId,
  styleCategoryId,
} = {}) {
  if (!isFullComplete || !styleId || !styleCategoryId) return false;
  const style = getCatalogStyle(styleId);
  return Boolean(
    style && getStageList(style).some((stage) => stage.id === styleCategoryId)
  );
}

export function previewStyleProgressAfterComplete(
  styleId,
  stageId,
  progress = readStyleProgress()
) {
  if (!canMarkStyleStageComplete({
    isFullComplete: true,
    styleId,
    styleCategoryId: stageId,
  })) {
    return progress;
  }

  const existing = getCompletedStyleStages(styleId, progress);

  return {
    ...progress,
    completed: {
      ...progress.completed,
      [styleId]: existing.includes(stageId)
        ? existing
        : [...existing, stageId],
    },
    lastStyleId: styleId,
    lastStageId: stageId,
  };
}

export function recordStyleProgressIfFullComplete({
  isFullComplete,
  styleId,
  styleCategoryId,
} = {}) {
  if (
    !canMarkStyleStageComplete({
      isFullComplete,
      styleId,
      styleCategoryId,
    })
  ) {
    return readStyleProgress();
  }

  return markStyleStageComplete(styleId, styleCategoryId);
}

export function markStyleStageComplete(
  styleId,
  stageId,
  now = new Date()
) {
  if (
    !canMarkStyleStageComplete({
      isFullComplete: true,
      styleId,
      styleCategoryId: stageId,
    })
  ) {
    return readStyleProgress();
  }

  const next = {
    ...previewStyleProgressAfterComplete(styleId, stageId),
    lastCompletedAt:
      now instanceof Date ? now.toISOString() : String(now || ""),
  };

  writeStyleProgress(next);
  return next;
}

function parseStyleFlowSteps(style) {
  const fromKey = String(style?.key || "")
    .split("→")
    .map((step) => step.trim())
    .filter(Boolean);
  const stages = getStageList(style);

  if (fromKey.length === stages.length) {
    return fromKey;
  }

  return stages.map((stage) => stage.label || stage.title).filter(Boolean);
}

/** Catalog-only. Does not read or write style progress storage. */
export function getStyleTimerStep(styleId, stageId) {
  const style = getCatalogStyle(styleId);
  if (!style || !stageId) return null;

  const stages = getStageList(style);
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index < 0) return null;

  return {
    styleId: style.id,
    styleTitle: style.title,
    styleEn: style.en || "",
    stageId,
    stageTitle: stages[index].title || "",
    stageLabel: stages[index].label || "",
    order: index + 1,
    total: stages.length,
    flowSteps: parseStyleFlowSteps(style),
    currentFlowIndex: index,
  };
}

export function getLastStyleContinue(progress = readStyleProgress()) {
  if (!progress.lastStyleId) return null;
  return getNextStyleStage(progress.lastStyleId, progress);
}

export function getStyleProgressionView(
  styleId,
  stageId,
  progress = readStyleProgress()
) {
  const style = getCatalogStyle(styleId);
  if (!style) return null;

  const preview = previewStyleProgressAfterComplete(styleId, stageId, progress);
  const stats = getStyleStageStats(styleId, preview);
  const stageIndex = getStageList(style).findIndex(
    (stage) => stage.id === stageId
  );
  const stage = stageIndex >= 0 ? style.stages[stageIndex] : null;
  const next = getNextStyleStage(styleId, preview);

  return {
    kind: "style",
    styleId: style.id,
    styleTitle: style.title,
    stageId,
    stageTitle: stage?.title || "",
    stageOrder: stageIndex >= 0 ? stageIndex + 1 : 0,
    completedCount: stats.completed,
    total: stats.total,
    next: next
      ? {
          kind: "style",
          styleId: next.styleId,
          stageId: next.stageId,
          title: next.stageTitle,
          order: next.order,
        }
      : null,
  };
}
