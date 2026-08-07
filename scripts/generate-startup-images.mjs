/**
 * Regenerates public/splash/* from SPLASH_SPEC + public/logo-mark.png.
 * iOS apple-touch-startup-image only — no HTML #boot-splash.
 * Run: node scripts/generate-startup-images.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPLASH_DEVICES, SPLASH_SPEC } from "./splash-spec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "splash");
const logoPath = path.join(root, "public", "logo-mark.png");
if (!fs.existsSync(logoPath)) {
  throw new Error("Missing public/logo-mark.png");
}
const logoSrc = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

function buildSplashHtml() {
  const s = SPLASH_SPEC;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: ${s.background};
    }
    .startup {
      position: fixed;
      inset: 0;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      padding: 0;
      background: ${s.background};
    }
    .startup img {
      width: ${s.logoSizePx}px;
      height: ${s.logoSizePx}px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="startup">
    <img src="${logoSrc}" alt="" width="${s.logoSizePx}" height="${s.logoSizePx}" />
  </div>
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });
const html = buildSplashHtml();
const browser = await chromium.launch({ headless: true });

for (const device of SPLASH_DEVICES) {
  const context = await browser.newContext({
    viewport: { width: device.cssWidth, height: device.cssHeight },
    deviceScaleFactor: device.dpr,
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(50);
  const outPath = path.join(outDir, device.file);
  await page.screenshot({
    path: outPath,
    fullPage: false,
    type: "png",
  });
  const { width, height } = await page.evaluate(() => ({
    width: Math.round(window.devicePixelRatio * window.innerWidth),
    height: Math.round(window.devicePixelRatio * window.innerHeight),
  }));
  console.log(
    `wrote ${device.file} (${width}x${height} px @${device.dpr}x ${device.cssWidth}x${device.cssHeight})`
  );
  await context.close();
}

await browser.close();
console.log("startup images regenerated (iOS only)");
