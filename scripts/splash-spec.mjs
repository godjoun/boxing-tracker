/**
 * Single source of truth for iOS apple-touch-startup-image layout (CSS pixels).
 * Symbol only — no wordmark. This is the sole MANTLE splash (system startup).
 * Regenerate public/splash/* with: node scripts/generate-startup-images.mjs
 */
export const SPLASH_SPEC = {
  background: "#ffffff",
  logoSizePx: 112,
};

/** Portrait launch images referenced from index.html */
export const SPLASH_DEVICES = [
  {
    file: "iphone-14-pro-max.png",
    cssWidth: 430,
    cssHeight: 932,
    dpr: 3,
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-14-pro.png",
    cssWidth: 393,
    cssHeight: 852,
    dpr: 3,
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-12-13.png",
    cssWidth: 390,
    cssHeight: 844,
    dpr: 3,
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-x.png",
    cssWidth: 375,
    cssHeight: 812,
    dpr: 3,
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-12-pro-max.png",
    cssWidth: 428,
    cssHeight: 926,
    dpr: 3,
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-xs-max.png",
    cssWidth: 414,
    cssHeight: 896,
    dpr: 3,
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "iphone-xr.png",
    cssWidth: 414,
    cssHeight: 896,
    dpr: 2,
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    file: "iphone-8.png",
    cssWidth: 375,
    cssHeight: 667,
    dpr: 2,
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
];
