/**
 * 모바일(특히 iOS) + 에어팟/블루투스 이어폰에서 라운드 알림음이
 * 화면이 꺼져도 들리도록 오디오 세션을 유지합니다.
 */

let audioContext = null;
let keepAliveAudio = null;
let keepAliveNodes = null;

const SILENT_AUDIO_SRC =
  "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/HJjVAAAAAAAAAAAAAAAAAAAA";

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export async function resumeTimerAudio() {
  const context = getAudioContext();

  if (context?.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // noop
    }
  }

  if (keepAliveAudio?.paused) {
    try {
      await keepAliveAudio.play();
    } catch {
      // noop
    }
  }
}

function startSilentKeepAlive() {
  if (!keepAliveAudio) {
    keepAliveAudio = new Audio(SILENT_AUDIO_SRC);
    keepAliveAudio.loop = true;
    keepAliveAudio.preload = "auto";
    keepAliveAudio.setAttribute("playsinline", "true");
    keepAliveAudio.volume = 0.02;
  }

  const context = getAudioContext();

  if (context && !keepAliveNodes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    keepAliveNodes = { oscillator, gain };
  }

  return keepAliveAudio.play().catch(() => {});
}

export async function startTimerAudioSession() {
  await resumeTimerAudio();
  await startSilentKeepAlive();
}

export function stopTimerAudioSession() {
  if (keepAliveAudio) {
    keepAliveAudio.pause();
    keepAliveAudio.currentTime = 0;
  }

  if (keepAliveNodes) {
    try {
      keepAliveNodes.oscillator.stop();
      keepAliveNodes.oscillator.disconnect();
      keepAliveNodes.gain.disconnect();
    } catch {
      // noop
    }

    keepAliveNodes = null;
  }
}

export async function playTimerBeep(soundMode = "basic", type = "work") {
  if (soundMode === "mute") return;

  const context = getAudioContext();
  if (!context) return;

  await resumeTimerAudio();

  const now = context.currentTime;

  if (soundMode === "basic") {
    const isRest = type === "rest";
    const isDone = type === "done";
    const baseFrequencies = isRest ? [520, 1040, 1560] : [740, 1480, 2220];
    const duration = isDone ? 0.95 : 0.72;
    const volume = isDone ? 0.34 : 0.28;

    baseFrequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        volume / (index + 1),
        now + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    });

    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencyMap = {
    prep: 920,
    work: 1120,
    rest: 620,
    cooldown: 620,
    done: 1280,
  };
  const durationMap = {
    prep: 0.26,
    work: 0.3,
    rest: 0.34,
    cooldown: 0.34,
    done: 0.46,
  };

  const frequency = frequencyMap[type] || 1120;
  const duration = durationMap[type] || 0.3;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.42, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

export async function previewTimerBeep(soundMode = "basic") {
  await startTimerAudioSession();
  await playTimerBeep(soundMode, "work");
}

export function supportsHeadphoneTimerAudio() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}
