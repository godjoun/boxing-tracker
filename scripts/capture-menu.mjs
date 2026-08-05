import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "tmp", "menu-shots");
const base = process.env.MENU_BASE || "http://127.0.0.1:5176/";

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

async function ensureDark(page) {
  const lightOffer = page.locator(
    '.app-menu-row:has-text("라이트 모드")'
  );
  if (await lightOffer.isVisible().catch(() => false)) return;
  const darkOffer = page.locator('.app-menu-row:has-text("다크 모드")');
  if (await darkOffer.isVisible().catch(() => false)) {
    await darkOffer.click();
    await page.waitForTimeout(350);
    await goCategory(page);
  }
}

async function shot(page, name) {
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
  });
  console.log("shot", name);
}

async function scrollMain(page, y) {
  await page.evaluate((top) => {
    const main = document.querySelector(".app-main");
    if (main) main.scrollTop = top;
    else window.scrollTo(0, top);
  }, y);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  await enterApp(page);
  await page.screenshot({ path: path.join(outDir, "00-after-entry.png") });

  await goCategory(page);
  await ensureDark(page);

  await scrollMain(page, 0);
  await shot(page, "01-menu-top");

  await scrollMain(page, 260);
  await shot(page, "02-menu-mid");

  await scrollMain(page, 9999);
  await shot(page, "03-menu-bottom");

  await scrollMain(page, 0);
  const lockMode = await page.evaluate(() => {
    const combo = [...document.querySelectorAll(".app-menu-row")].find((r) =>
      r.textContent.includes("콤보 만들기")
    );
    if (!combo) return "missing";
    if (combo.classList.contains("is-locked")) return "natural";
    combo.classList.add("is-locked");
    combo.setAttribute("aria-label", "콤보 만들기, 레벨 10 해금");
    const small = combo.querySelector("small");
    if (small) small.textContent = "LV.10 해금";
    const arrow = combo.querySelector(".app-menu-row-arrow");
    if (arrow) {
      arrow.innerHTML =
        '<svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="6.5" y="11" width="11" height="9" rx="1.5"/><path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11"/></svg>';
    }
    return "forced-dev";
  });
  fs.writeFileSync(path.join(outDir, "lock-note.txt"), `${lockMode}\n`);
  await shot(page, "04-menu-locked");

  await page.reload({ waitUntil: "domcontentloaded" });
  await enterApp(page);
  await goCategory(page);
  await ensureDark(page);

  await page.locator('.app-menu-row:has-text("커뮤니티")').click();
  await page.waitForTimeout(800);
  await shot(page, "05-community");

  await page.locator('.app-bottom-nav button:has-text("전체")').click();
  await page.waitForTimeout(400);
  await page.locator('.app-menu-row:has-text("체육관 찾기")').click();
  await page.waitForTimeout(800);
  await shot(page, "06-gyms");

  // Flow video
  const flows = [
    { label: "루틴 보기", back: /category-back|뒤로|전체 메뉴/ },
    { label: "내 성장 보기", back: /뒤로|전체/ },
    { label: "훈련 명패 만들기", back: /전체 메뉴로|명패로/ },
    { label: "커뮤니티", back: null },
    { label: "체육관 찾기", back: null },
  ];

  for (const flow of flows) {
    await page.locator('.app-bottom-nav button:has-text("전체")').click();
    await page.waitForTimeout(400);
    await page.locator(`.app-menu-row:has-text("${flow.label}")`).click();
    await page.waitForTimeout(700);
    if (flow.back) {
      const back = page.getByRole("button", { name: flow.back }).first();
      if (await back.isVisible().catch(() => false)) {
        await back.click();
      } else {
        const anyBack = page.locator("button.category-back, button.combo-creator-back, .profile-page button").filter({ hasText: /←|뒤로|전체/ }).first();
        if (await anyBack.isVisible().catch(() => false)) await anyBack.click();
        else await page.locator('.app-bottom-nav button:has-text("전체")').click();
      }
    } else {
      await page.locator('.app-bottom-nav button:has-text("전체")').click();
    }
    await page.waitForTimeout(450);
  }

  await context.close();
  await browser.close();

  const videos = fs.readdirSync(outDir).filter((f) => f.endsWith(".webm"));
  if (videos.length) {
    const src = path.join(outDir, videos.sort((a, b) => fs.statSync(path.join(outDir, b)).mtimeMs - fs.statSync(path.join(outDir, a)).mtimeMs)[0]);
    fs.renameSync(src, path.join(outDir, "07-menu-flows.webm"));
    console.log("video 07-menu-flows.webm");
  }
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
