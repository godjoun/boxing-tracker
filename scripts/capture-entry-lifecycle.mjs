/**
 * App entry cold-start capture (first user + returning, light + dark).
 * Verifies: no HTML boot-splash, app-ready → onboarding or home complete.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BOOT_URL || "http://127.0.0.1:5180";
const OUT = path.resolve("tmp/entry-lifecycle-shots");

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

async function seedReturning(page, theme) {
  await page.addInitScript(
    ({ profile, theme }) => {
      localStorage.setItem("round-on-theme", theme);
      localStorage.setItem("fitness-league-tutorial-complete", "1");
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

async function seedFirstUser(page, theme) {
  await page.addInitScript(
    ({ theme }) => {
      localStorage.clear();
      localStorage.setItem("round-on-theme", theme);
    },
    { theme }
  );
}

async function captureCase(browser, { id, theme, firstUser }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  if (firstUser) {
    await seedFirstUser(page, theme);
  } else {
    await seedReturning(page, theme);
  }

  const frames = [];
  const onFrame = async (label) => {
    const file = path.join(OUT, `${id}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    frames.push(file);
  };

  const nav = page.goto(BASE, { waitUntil: "commit" });
  await page.waitForTimeout(16);
  await onFrame("01-commit");
  await nav;
  await onFrame("02-dom");

  await page.waitForFunction(() => {
    return document.documentElement.classList.contains("app-ready");
  }, { timeout: 8000 });

  await onFrame("03-ready");

  const state = await page.evaluate(() => {
    const root = document.getElementById("root");
    return {
      bootSplash: Boolean(document.getElementById("boot-splash")),
      appReady: document.documentElement.classList.contains("app-ready"),
      dataTheme: document.documentElement.dataset.theme,
      shell: document.querySelector(".app-shell")?.className || "",
      rootVisibility: root ? getComputedStyle(root).visibility : "missing",
      hasOnboarding: Boolean(document.querySelector(".onboarding-page")),
      hasEntryBanner: Boolean(document.querySelector(".entry-banner")),
      hasHomeNav: Boolean(
        document.querySelector(".app-bottom-nav, .bottom-nav")
      ),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });

  // START 버튼은 Playwright locator로 재확인
  const startVisible = await page
    .getByRole("button", { name: "START" })
    .isVisible()
    .catch(() => false);
  state.hasStart = startVisible;

  await page.waitForTimeout(200);
  await onFrame("04-settled");

  const videoPath = await page.video()?.path();
  await context.close();

  let savedVideo = null;
  if (videoPath && fs.existsSync(videoPath)) {
    savedVideo = path.join(OUT, `${id}-cold.webm`);
    fs.renameSync(videoPath, savedVideo);
  }

  return { id, theme, firstUser, state, frames, video: savedVideo };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const cases = [
    { id: "first-light", theme: "light", firstUser: true },
    { id: "first-dark", theme: "dark", firstUser: true },
    { id: "returning-light", theme: "light", firstUser: false },
    { id: "returning-dark", theme: "dark", firstUser: false },
  ];
  const results = [];
  for (const c of cases) {
    results.push(await captureCase(browser, c));
  }
  await browser.close();

  const report = path.join(OUT, "report.json");
  fs.writeFileSync(report, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  for (const r of results) {
    if (r.state.bootSplash) {
      throw new Error(`${r.id}: HTML boot-splash still present`);
    }
    if (!r.state.appReady) throw new Error(`${r.id}: not app-ready`);
    if (r.state.rootVisibility !== "visible") {
      throw new Error(`${r.id}: root visibility=${r.state.rootVisibility}`);
    }
    if (r.firstUser) {
      if (!r.state.hasOnboarding || !r.state.hasEntryBanner || !r.state.hasStart) {
        throw new Error(`${r.id}: expected complete onboarding first screen`);
      }
      // 온보딩 entry는 항상 라이트 스테이지
    } else {
      if (r.state.dataTheme !== r.theme) {
        throw new Error(`${r.id}: data-theme=${r.state.dataTheme}`);
      }
      if (!r.state.shell.includes(`theme-${r.theme}`)) {
        throw new Error(`${r.id}: shell=${r.state.shell}`);
      }
      if (r.state.hasOnboarding || r.state.hasEntryBanner) {
        throw new Error(`${r.id}: still onboarding instead of home`);
      }
    }
  }
  console.log("entry lifecycle capture OK →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
