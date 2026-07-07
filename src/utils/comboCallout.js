/**
 * 라운드 중 콤보를 음성으로 불러주는 콜아웃(coach callout) 기능.
 * 브라우저 SpeechSynthesis(TTS)로 "잽, 크로스" 같은 콤보를 읽어줍니다.
 */

const CALLOUT_PREF_KEY = "fitness-league-combo-callout";

export const CALLOUT_PACES = [
  { id: "slow", label: "느리게", seconds: 6 },
  { id: "normal", label: "보통", seconds: 4 },
  { id: "fast", label: "빠르게", seconds: 3 },
];

/** 초보 친화 콤보 풀 (쉬운 순 → 실전). */
export const COMBO_CALLOUTS = [
  ["잽"],
  ["잽", "잽"],
  ["잽", "크로스"],
  ["잽", "잽", "크로스"],
  ["잽", "크로스", "리드 훅"],
  ["크로스", "리드 훅"],
  ["잽", "크로스", "잽"],
  ["잽", "리드 훅", "크로스"],
  ["잽", "크로스", "리드 훅", "크로스"],
  ["슬립", "크로스"],
  ["잽", "슬립", "크로스"],
  ["잽", "바디 크로스"],
];

export function isCalloutSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function loadCalloutPref() {
  try {
    const raw = JSON.parse(localStorage.getItem(CALLOUT_PREF_KEY) || "null");

    if (!raw || typeof raw !== "object") {
      return { enabled: false, pace: "normal" };
    }

    return {
      enabled: Boolean(raw.enabled),
      pace: CALLOUT_PACES.some((pace) => pace.id === raw.pace)
        ? raw.pace
        : "normal",
    };
  } catch {
    return { enabled: false, pace: "normal" };
  }
}

export function saveCalloutPref(pref) {
  try {
    localStorage.setItem(CALLOUT_PREF_KEY, JSON.stringify(pref));
  } catch {
    // ignore storage failures
  }
}

export function getPaceSeconds(paceId) {
  const pace = CALLOUT_PACES.find((item) => item.id === paceId);
  return (pace || CALLOUT_PACES[1]).seconds;
}

let koreanVoice = null;

function pickKoreanVoice() {
  if (!isCalloutSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  koreanVoice =
    voices.find((voice) => voice.lang === "ko-KR") ||
    voices.find((voice) => voice.lang && voice.lang.startsWith("ko")) ||
    null;

  return koreanVoice;
}

export function primeCalloutVoices() {
  if (!isCalloutSupported()) return;

  pickKoreanVoice();

  if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
    window.speechSynthesis.onvoiceschanged = () => pickKoreanVoice();
  }
}

/** iOS/Safari는 첫 발화가 사용자 제스처 안에서 일어나야 이후 재생이 허용됩니다. */
export function warmUpCallout() {
  if (!isCalloutSupported()) return;

  try {
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

export function speakCombo(moves) {
  if (!isCalloutSupported()) return;

  const text = Array.isArray(moves) ? moves.join(", ") : String(moves);
  if (!text) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = koreanVoice || pickKoreanVoice();

    utterance.lang = "ko-KR";
    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

export function pickRandomCombo() {
  return COMBO_CALLOUTS[Math.floor(Math.random() * COMBO_CALLOUTS.length)];
}

export function cancelCallout() {
  if (!isCalloutSupported()) return;

  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
