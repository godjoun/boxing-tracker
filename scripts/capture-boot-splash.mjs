/**
 * Boot splash cold-start capture (light + dark).
 * Seeds returning-user profile, records splash→home handoff.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BOOT_URL || "http://127.0.0.1:5180";
const OUT = path.resolve("tmp/boot-splash-shots");

const PROFILE = {
  nickname: "테스트",
  bio: "",
  photo: "",
  homeHeroPhoto: "",
  heightCm: 175,
  weightKg: 70,
  reachCm: 180,
  weightClass: "라이트급",
  experience: "1년차",
  sparringStyle: "미디엄",
  area: "서울",
  homeGymId: "",
  homeGymName: "",
  homeGymAddress: "",
  contact: "",
  onboardingComplete: true,
};

async function seed(page, theme) {
  await page.addInitScript(
    ({ profile, theme }) => {
      localStorage.setItem("round-on-theme", theme);
      localStorage.setItem(
        "fitness-league-tutorial-complete",
        "1"
      );
      // guest + vite DEV userId 키 모두 시드
      for (const key of [
        "fitness-league-profile",
        "fitness-league-profile-dev-local-user",
      ]) {
        localStorage.setItem(key, JSON.stringify(profile));
      }
      localStorage.setItem("fitness-league-fresh-onboarding-v1", "1");
    },
    { profile: PROFILE, theme }
  );
}

async function captureTheme(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  await seed(page, theme);

  const frames = [];
  const onFrame = async (label) => {
    const file = path.join(OUT, `${theme}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    frames.push(file);
  };

  // Navigate and sample early frames
  const nav = page.goto(BASE, { waitUntil: "commit" });
  await page.waitForTimeout(16);
  await onFrame("01-commit");
  await nav;
  await onFrame("02-dom");

  // Wait until splash gone + app ready
  await page.waitForFunction(() => {
    return (
      !document.getElementById("boot-splash") &&
      document.documentElement.classList.contains("app-ready")
    );
  }, { timeout: 8000 });

  await onFrame("03-ready");

  const state = await page.evaluate(() => ({
    splash: Boolean(document.getElementById("boot-splash")),
    appReady: document.documentElement.classList.contains("app-ready"),
    dataTheme: document.documentElement.dataset.theme,
    shell: document.querySelector(".app-shell")?.className || "",
    rootVisibility: getComputedStyle(document.getElementById("root")).visibility,
    hasOnboarding: Boolean(document.querySelector(".onboarding-page")),
    hasEntryBanner: Boolean(document.querySelector(".entry-banner")),
    hasHome: Boolean(
      document.querySelector(".home-page, .home-scene, [data-page='home']")
    ),
  }));

  await page.waitForTimeout(200);
  await onFrame("04-settled");

  const videoPath = await page.video()?.path();
  await context.close();

  // Rename video
  let savedVideo = null;
  if (videoPath && fs.existsSync(videoPath)) {
    savedVideo = path.join(OUT, `${theme}-cold.webm`);
    fs.renameSync(videoPath, savedVideo);
  }

  return { theme, state, frames, video: savedVideo };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const theme of ["light", "dark"]) {
    results.push(await captureTheme(browser, theme));
  }
  await browser.close();

  const report = path.join(OUT, "report.json");
  fs.writeFileSync(report, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  for (const r of results) {
    if (r.state.splash) throw new Error(`${r.theme}: splash still present`);
    if (!r.state.appReady) throw new Error(`${r.theme}: not app-ready`);
    if (r.state.dataTheme !== r.theme) {
      throw new Error(`${r.theme}: data-theme=${r.state.dataTheme}`);
    }
    if (!r.state.shell.includes(`theme-${r.theme}`)) {
      throw new Error(`${r.theme}: shell=${r.state.shell}`);
    }
    if (r.state.rootVisibility !== "visible") {
      throw new Error(`${r.theme}: root visibility=${r.state.rootVisibility}`);
    }
    if (r.state.hasOnboarding || r.state.hasEntryBanner) {
      throw new Error(`${r.theme}: still onboarding/entry instead of home`);
    }
  }
  console.log("boot splash capture OK →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
