import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 900 },
  deviceScaleFactor: 2,
});

await page.addInitScript(() => {
  localStorage.setItem("fitness-league-fresh-onboarding-v1", "1");
  localStorage.setItem(
    "fitness-league-profile",
    JSON.stringify({
      nickname: "개발자",
      onboardingComplete: true,
      experience: "초보",
    })
  );
  localStorage.setItem("fitness-league-tutorial-complete", "1");
  localStorage.setItem("fitness-league-theme", "dark");
});

await page.goto("https://boxing-tracker.vercel.app/", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(2000);
await page.screenshot({
  path: "docs/home-preview.png",
  fullPage: false,
});
await browser.close();
