/**
 * PHASE 2 gym exchange UI captures (DEV fixture).
 * Usage: BOOT_URL=http://127.0.0.1:5181 node scripts/capture-gym-exchange-ui.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BOOT_URL || "http://127.0.0.1:5181";
const OUT = path.resolve("tmp/gym-exchange-ui");
const FIXTURE_ID = "mantle-gym-exchange-dev-fixture";

const PROFILE = {
  nickname: "교류테스터",
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
  homeGymName: "Home Gym Fixture",
  homeGymAddress: "",
  contact: "",
  onboardingComplete: true,
};

async function seed(page, theme) {
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

async function openHubCard(page) {
  if (await page.locator(".gym-exchange-joined").count()) return;
  if (await page.locator('[data-testid="gym-exchange-event-card"]').count()) {
    await page.locator('[data-testid="gym-exchange-event-card"]').first().click();
    await page.waitForSelector(".gym-exchange-detail", { timeout: 10000 });
    return;
  }
  await page.locator('[data-tutorial-target="nav-category"]').click();
  await page.getByText("함께하기", { exact: true }).click();
  await page.getByRole("button", { name: "교류" }).click();
  await page.locator('[data-testid="gym-exchange-event-card"]').first().click();
  await page.waitForSelector(".gym-exchange-detail", { timeout: 10000 });
}

async function captureTheme(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await seed(page, theme);

  const shot = async (label) => {
    const file = path.join(OUT, `${theme}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    return file;
  };

  await page.goto(`${BASE}/?exchange=${FIXTURE_ID}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(".gym-exchange-detail", { timeout: 15000 });
  await shot("01-deeplink-detail");

  await page.getByRole("button", { name: "참가하기" }).click();
  await page.waitForSelector(".gym-exchange-join-form");
  await shot("02-join-form");

  const nick = await page.locator(".gym-exchange-join-form input").nth(0).inputValue();
  const gym = await page.locator(".gym-exchange-join-form input").nth(1).inputValue();
  if (nick !== PROFILE.nickname) throw new Error(`nickname default=${nick}`);
  if (gym !== PROFILE.homeGymName) throw new Error(`gym default=${gym}`);

  await page.getByRole("button", { name: "참가 확정" }).click();
  await page.waitForSelector(".gym-exchange-joined", { timeout: 20000 });
  await shot("03-joined");

  await page.getByRole("button", { name: "라운드 증가" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".gym-exchange-rounds-controls strong")
        ?.textContent === "1R",
    null,
    { timeout: 15000 }
  );
  await shot("04-plus-1r");

  await page.getByRole("button", { name: "라운드 감소" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".gym-exchange-rounds-controls strong")
        ?.textContent === "0R",
    null,
    { timeout: 15000 }
  );
  const minusDisabled = await page
    .getByRole("button", { name: "라운드 감소" })
    .isDisabled();
  if (!minusDisabled) throw new Error("minus should be disabled at 0");
  await shot("05-zero-floor");

  await page.getByRole("button", { name: "라운드 증가" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".gym-exchange-rounds-controls strong")
        ?.textContent === "1R"
  );

  await page.reload({ waitUntil: "networkidle" });
  // Deep link already consumed — reopen via hub card
  await openHubCard(page);
  await page.waitForSelector(".gym-exchange-joined", { timeout: 20000 });
  const roundsAfterReload = await page
    .locator(".gym-exchange-rounds-controls strong")
    .textContent();
  if (roundsAfterReload !== "1R") {
    throw new Error(`rounds after reload=${roundsAfterReload}`);
  }
  await shot("06-reload-persisted");

  await page.getByRole("button", { name: "뒤로" }).click();
  await page.waitForSelector('[data-testid="gym-exchange-event-card"]');
  const cardTitles = await page
    .locator('[data-testid="gym-exchange-event-card"] strong')
    .allTextContents();
  await shot("07-hub-card");

  await page.getByRole("button", { name: "프로필" }).click();
  await page.waitForTimeout(1000);
  await shot("08-profile");
  const hasTrace =
    (await page.locator("text=체육관 교류").count()) > 0 ||
    (await page.locator("text=Dev Gym Alpha").count()) > 0;

  await context.close();
  return {
    theme,
    nickDefault: nick,
    gymDefault: gym,
    roundsAfterReload,
    minusDisabledAtZero: minusDisabled,
    hasTrace,
    cardTitles,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const theme of ["light", "dark"]) {
    results.push(await captureTheme(browser, theme));
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  for (const r of results) {
    if (!r.minusDisabledAtZero) throw new Error(`${r.theme}: zero floor`);
    if (r.roundsAfterReload !== "1R") throw new Error(`${r.theme}: persist`);
    if (!r.hasTrace) throw new Error(`${r.theme}: profile trace missing`);
  }
  console.log("gym exchange UI capture OK →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
