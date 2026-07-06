let artworkCache = null;

function getArtwork() {
  if (artworkCache) return artworkCache;

  const origin = window.location.origin;
  artworkCache = [
    { src: `${origin}/icons.svg`, sizes: "512x512", type: "image/svg+xml" },
  ];

  return artworkCache;
}

export function supportsTimerMediaSession() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function updateTimerMediaSession(summary) {
  if (!supportsTimerMediaSession() || !summary) {
    return;
  }

  const statusPrefix = summary.isRunning ? "" : "일시정지 · ";
  const phaseText =
    summary.phase === "done"
      ? "훈련 완료"
      : `${statusPrefix}${summary.phaseLabel} ${summary.timeLabel}`;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: phaseText,
    artist: `${summary.roundLabel} · ${summary.title}`,
    album: "복싱 라운드 타이머",
    artwork: getArtwork(),
  });

  navigator.mediaSession.playbackState = summary.isRunning ? "playing" : "paused";
}

export function bindTimerMediaSessionHandlers({ onPlay, onPause }) {
  if (!supportsTimerMediaSession()) {
    return () => {};
  }

  try {
    navigator.mediaSession.setActionHandler("play", onPlay);
    navigator.mediaSession.setActionHandler("pause", onPause);
    navigator.mediaSession.setActionHandler("stop", onPause);
  } catch {
    return () => {};
  }

  return () => {
    try {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    } catch {
      // noop
    }
  };
}

export function clearTimerMediaSession() {
  if (!supportsTimerMediaSession()) {
    return;
  }

  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    navigator.mediaSession.setActionHandler("play", null);
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("stop", null);
  } catch {
    // noop
  }
}
