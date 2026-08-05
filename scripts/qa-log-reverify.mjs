/**
 * #3 기록 4종 + #8 저장 연타 재검증 (제품 코드 미변경)
 * 격리 Playwright 컨텍스트 — 실사용자 데이터 미사용
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "tmp", "qa-log-reverify");
const base = process.env.QA_BASE || "http://127.0.0.1:4180/";

fs.mkdirSync(path.join(outDir, "shots"), { recursive: true });

const env = {
  device: "Desktop Chromium (Playwright)",
  os: process.platform,
  browser: "Chromium headless",
  pwa: false,
  baseUrl: base,
  ranAt: new Date().toISOString(),
};

const createdData = [];
const consoleErrors = [];

async function shot(page, name) {
  const rel = `tmp/qa-log-reverify/shots/${name}.png`;
  await page.screenshot({ path: path.join(root, rel), fullPage: false });
  return rel;
}

async function dismissChrome(page) {
  for (let i = 0; i < 12; i++) {
    const skip = page
      .getByRole("button", {
        name: /건너뛰|닫기|나중에|알겠어요|다음에|다음|완료/,
      })
      .first();
    if (!(await skip.isVisible().catch(() => false))) break;
    await skip.click({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(220);
  }
}

async function enterApp(page) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(400);
  const start = page.getByRole("button", { name: "START" });
  if (await start.isVisible({ timeout: 3000 }).catch(() => false)) {
    await start.click();
    await page.waitForTimeout(400);
  }
  const nick = page.locator('input[type="text"], input:not([type])').first();
  if (await nick.isVisible({ timeout: 2000 }).catch(() => false)) {
    const name = `QA로그${Date.now().toString().slice(-5)}`;
    await nick.fill(name);
    createdData.push({ type: "nickname", value: name });
    await page.getByRole("button", { name: "시작하기" }).click();
    await page.locator(".app-bottom-nav").waitFor({ timeout: 30000 });
  }
  await dismissChrome(page);
}

async function goTab(page, label) {
  await dismissChrome(page);
  if (!(await page.locator(".app-bottom-nav").isVisible().catch(() => false))) {
    const back = page
      .locator("button")
      .filter({ hasText: /←|뒤로|전체|훈련|홈/ })
      .first();
    if (await back.isVisible().catch(() => false)) await back.click().catch(() => {});
  }
  await page.locator(`.app-bottom-nav button:has-text("${label}")`).click({
    timeout: 8000,
  });
  await page.waitForTimeout(350);
  await dismissChrome(page);
}

async function countLogs(page) {
  return page.evaluate(() => {
    let n = 0;
    let latest = null;
    for (const k of Object.keys(localStorage)) {
      if (!k.includes("fitness-league-logs")) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        n += arr.length;
        if (arr[0]) latest = arr[0];
      } catch {}
    }
    return { count: n, latest };
  });
}

async function selectLogCategory(page, label) {
  await page
    .locator(".log-category-pills button", { hasText: label })
    .click({ timeout: 5000 });
  await page.waitForTimeout(250);
  const close = page.getByRole("button", { name: "닫기" }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click().catch(() => {});
  }
}

async function fillBoxingLog(page) {
  await selectLogCategory(page, "복싱");
  await page.locator(".log-round-quick button", { hasText: "3R" }).click({
    timeout: 5000,
  });
  await page.waitForTimeout(150);
}

async function fillManualMinutes(page, { minutes, distanceKm = null } = {}) {
  const details = page.locator("details.log-manual-details").first();
  await details.locator("summary").click({ timeout: 5000 });
  await page.waitForTimeout(150);
  if (distanceKm != null) {
    await page
      .locator(".log-manual-details .log-field", { hasText: "거리(km)" })
      .locator("input")
      .fill(String(distanceKm));
  }
  await page
    .locator(".log-manual-details .log-field", { hasText: "시간(분)" })
    .locator("input")
    .fill(String(minutes));
  await page.waitForTimeout(150);
}

async function fillRunningLog(page) {
  await selectLogCategory(page, "러닝");
  // 러닝은 시간 + 거리 모두 필수
  await fillManualMinutes(page, { minutes: 25, distanceKm: 3.5 });
}

async function fillWalkingLog(page) {
  await selectLogCategory(page, "걷기");
  await fillManualMinutes(page, { minutes: 18 });
}

async function fillWeightsLog(page) {
  await selectLogCategory(page, "웨이트");
  await page.locator("#log-weight-name").fill("QA스쿼트");
  await page
    .locator(".log-weights-fields .log-field", { hasText: "세트" })
    .locator("input")
    .fill("3");
  await page
    .locator(".log-weights-fields .log-field", { hasText: "횟수" })
    .locator("input")
    .fill("10");
  await page.waitForTimeout(150);
}

async function saveButton(page) {
  return page.locator("button.log-submit").first();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: path.join(outDir, "video"),
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ text: msg.text(), loc: msg.location()?.url || "" });
    }
  });

  await enterApp(page);
  await goTab(page, "기록");

  const cats = [
    { name: "복싱", fill: () => fillBoxingLog(page) },
    { name: "러닝", fill: () => fillRunningLog(page) },
    { name: "웨이트", fill: () => fillWeightsLog(page) },
    { name: "걷기", fill: () => fillWalkingLog(page) },
  ];

  const perCategory = [];
  const media = [];
  let savedOk = 0;
  let failReason = null;

  try {
    for (const cat of cats) {
      await goTab(page, "기록");
      await cat.fill();
      const save = await saveButton(page);
      const enabled = !(await save.isDisabled());
      if (!enabled) {
        failReason = `${cat.name}: 필수값 입력 후에도 저장 버튼 disabled`;
        media.push(await shot(page, `fail-${cat.name}-disabled`));
        perCategory.push({
          category: cat.name,
          result: "FAIL",
          delta: 0,
          enabled: false,
        });
        break;
      }
      const before = await countLogs(page);
      await save.click({ timeout: 5000 });
      await page.waitForTimeout(700);
      await dismissChrome(page);
      const after = await countLogs(page);
      const delta = after.count - before.count;
      const summary =
        after.latest?.type ||
        after.latest?.customType ||
        after.latest?.category ||
        "";
      const body = await page.locator("main.log-page").innerText();
      const inRecent =
        body.includes(String(summary).slice(0, 4)) ||
        body.includes(cat.name) ||
        (cat.name === "웨이트" && /스쿼트|웨이트/.test(body));
      media.push(await shot(page, `03-${cat.name}`));
      const ok = delta === 1;
      if (ok) {
        savedOk += 1;
        createdData.push({
          type: "log",
          category: cat.name,
          id: after.latest?.id,
          summary,
          minutes: after.latest?.minutes,
          rounds: after.latest?.rounds,
        });
      } else {
        failReason = `${cat.name}: 기대 delta=1, 실제 ${delta}`;
      }
      perCategory.push({
        category: cat.name,
        result: ok ? "PASS" : "FAIL",
        delta,
        enabled: true,
        summary,
        inRecentUi: inRecent,
        logCountAfter: after.count,
      });
      if (!ok) break;
    }

    // category switch clears
    let clearedOnSwitch = false;
    if (!failReason) {
      await selectLogCategory(page, "웨이트");
      await page.locator("#log-weight-name").fill("임시입력");
      await selectLogCategory(page, "복싱");
      const panel = await page.locator(".log-core-panel").innerText();
      clearedOnSwitch = /라운드를 선택/.test(panel);
      media.push(await shot(page, "03-switch-clear"));
      if (!clearedOnSwitch) {
        failReason = "카테고리 전환 후 복싱 입력이 비어 있지 않음";
      }
    }

    // #8 double tap
    let doubleResult = null;
    if (!failReason) {
      await goTab(page, "기록");
      await fillBoxingLog(page);
      const save = await saveButton(page);
      const before = await countLogs(page);
      await Promise.all([save.click(), save.click(), save.click()]);
      await page.waitForTimeout(900);
      const after = await countLogs(page);
      const delta = after.count - before.count;
      media.push(await shot(page, "08-double-save"));
      doubleResult = {
        result: delta <= 1 ? "PASS" : "FAIL",
        delta,
        before: before.count,
        after: after.count,
      };
      if (delta === 1) {
        createdData.push({
          type: "log",
          category: "복싱-연타",
          id: after.latest?.id,
        });
      }
      if (delta > 1) failReason = `저장 연타 중복 delta=${delta}`;
    }

    const finalCount = (await countLogs(page)).count;
    const overall =
      savedOk === 4 &&
      !failReason &&
      doubleResult?.result === "PASS"
        ? "PASS"
        : "FAIL";

    const report = {
      result: overall,
      env,
      perCategory,
      doubleSave: doubleResult,
      clearedOnSwitch: failReason?.includes("전환") ? false : savedOk === 4,
      failReason,
      createdLogCount: finalCount,
      createdData,
      media,
      consoleErrors,
    };

    fs.writeFileSync(
      path.join(outDir, "results.json"),
      JSON.stringify(report, null, 2)
    );
    console.log(JSON.stringify({ result: overall, perCategory, doubleResult, finalCount, failReason }, null, 2));
  } catch (e) {
    const report = {
      result: "FAIL",
      env,
      failReason: String(e),
      perCategory,
      createdData,
      media,
      consoleErrors,
    };
    fs.writeFileSync(
      path.join(outDir, "results.json"),
      JSON.stringify(report, null, 2)
    );
    console.error(e);
  }

  await context.close();
  await browser.close();

  const videos = fs.existsSync(path.join(outDir, "video"))
    ? fs.readdirSync(path.join(outDir, "video")).filter((f) => f.endsWith(".webm"))
    : [];
  if (videos[0]) {
    fs.renameSync(
      path.join(outDir, "video", videos[0]),
      path.join(outDir, "log-reverify.webm")
    );
    console.log("video tmp/qa-log-reverify/log-reverify.webm");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
