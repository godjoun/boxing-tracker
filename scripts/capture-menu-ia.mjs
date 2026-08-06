import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "tmp", "menu-ia-shots");
const base = process.env.MENU_BASE || "http://127.0.0.1:5173/";

fs.mkdirSync(outDir, { recursive: true });

async function enterApp(page) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(500);

  const start = page.getByRole("button", { name: "START" });
  if (await start.isVisible({ timeout: 2000 }).catch(() => false)) {
    await start.click({ timeout: 3000 });
    await page.waitForTimeout(500);
  }

  const nick = page.locator('input[type="text"], input:not([type])').first();
  if (await nick.isVisible({ timeout: 1500 }).catch(() => false)) {
    await nick.fill(`캡처${Date.now().toString().slice(-6)}`);
    const submit = page.getByRole("button", { name: "시작하기" });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click({ timeout: 3000 });
      await page
        .locator(".app-bottom-nav")
        .waitFor({ timeout: 25000 })
        .catch(() => {});
      await page.waitForTimeout(400);
    }
  }

  for (let i = 0; i < 8; i++) {
    const skip = page
      .getByRole("button", {
        name: /건너뛰|닫기|다음에|나중에|알겠어요|완료/,
      })
      .first();
    if (!(await skip.isVisible().catch(() => false))) break;
    await skip.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
  }

  await page
    .locator(".app-bottom-nav")
    .waitFor({ timeout: 15000 })
    .catch(() => {});
}

async function goCategory(page) {
  await page.locator('.app-bottom-nav button:has-text("전체")').click({
    timeout: 8000,
  });
  await page.waitForTimeout(450);
  await page.getByRole("heading", { name: "전체 메뉴" }).waitFor({
    timeout: 8000,
  });
}

async function shot(page, name) {
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
  });
  console.log("shot", name);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  await enterApp(page);
  await goCategory(page);
  await shot(page, "01-menu-root");

  const labels = await page.locator(".app-menu-row-copy strong").allTextContents();
  fs.writeFileSync(
    path.join(outDir, "labels.json"),
    JSON.stringify(labels, null, 2)
  );

  await page.locator('.app-menu-row:has-text("앱 설정")').click();
  await page.waitForTimeout(400);
  await page.getByRole("heading", { name: "앱 설정" }).waitFor({ timeout: 5000 });
  await shot(page, "02-menu-settings");

  await page.getByRole("button", { name: "전체 메뉴로 돌아가기" }).click();
  await page.waitForTimeout(300);

  await page.locator('.app-menu-row:has-text("함께하기")').click();
  await page.waitForTimeout(800);
  await shot(page, "03-together-hub");

  await page.locator('.app-bottom-nav button:has-text("전체")').click();
  await page.waitForTimeout(400);
  await page.locator('.app-menu-row:has-text("훈련 카드 만들기")').click();
  await page.waitForTimeout(800);
  await shot(page, "04-card-maker");

  await browser.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
