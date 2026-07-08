const TUTORIAL_STORAGE_KEY = "fitness-league-tutorial-complete";

export function isTutorialComplete() {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function completeTutorial() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

export function resetTutorial() {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}
