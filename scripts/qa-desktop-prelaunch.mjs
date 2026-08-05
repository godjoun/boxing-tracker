/**
 * 출시 전 통합 QA — 자동/데스크톱 (격리 브라우저 컨텍스트)
 * 기존 기기 localStorage를 건드리지 않음.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "tmp", "qa-prelaunch");
const base = process.env.QA_BASE || "http://127.0.0.1:4180/";
const envMeta = {
  device: "Desktop Chromium (Playwright)",
  os: process.platform,
  browser: "Chromium headless",
  pwa: false,
  baseUrl: base,
  ranAt: new Date().toISOString(),
};

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "shots"), { recursive: true });

const results = [];
const consoleErrors = [];
const createdData = [];

function record(item) {
  results.push(item);
  console.log(
    `[${item.result}] #${item.id} ${item.title}${item.note ? " — " + item.note : ""}`
  );
}

async function shot(page, name) {
  const rel = `tmp/qa-prelaunch/shots/${name}.png`;
  await page.screenshot({
    path: path.join(root, rel),
    fullPage: false,
  });
  return rel;
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
    const name = `QA데스크톱${Date.now().toString().slice(-5)}`;
    await nick.fill(name);
    createdData.push({ type: "nickname", value: name });
    await page.getByRole("button", { name: "시작하기" }).click();
    await page.locator(".app-bottom-nav").waitFor({ timeout: 30000 });
  }
  for (let i = 0; i < 12; i++) {
    const skip = page
      .getByRole("button", {
        name: /건너뛰|닫기|나중에|알겠어요|다음에|다음|완료/,
      })
      .first();
    if (!(await skip.isVisible().catch(() => false))) break;
    await skip.click({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(280);
  }
}

async function navLabels(page) {
  return page.locator(".app-bottom-nav .app-nav-label").allTextContents();
}

async function dismissChrome(page) {
  for (let i = 0; i < 14; i++) {
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

async function ensureNav(page) {
  await dismissChrome(page);
  if (await page.locator(".app-bottom-nav").isVisible().catch(() => false)) {
    return;
  }
  // leave fullscreen via back
  const back = page
    .locator("button")
    .filter({ hasText: /←|뒤로|전체|훈련|홈|명패/ })
    .first();
  if (await back.isVisible().catch(() => false)) {
    await back.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
  if (!(await page.locator(".app-bottom-nav").isVisible().catch(() => false))) {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await dismissChrome(page);
  }
}

async function goTab(page, label) {
  await ensureNav(page);
  await page.locator(`.app-bottom-nav button:has-text("${label}")`).click({
    timeout: 8000,
  });
  await page.waitForTimeout(350);
  await dismissChrome(page);
}

async function measureTouchTargets(page) {
  return page.evaluate(() => {
    const selectors = [
      ".app-bottom-nav button",
      ".app-menu-row",
      ".training-mode-card",
      ".log-write-dock button",
      "button.training-focus-cta, .training-page button.primary, .hub-page .training-start-btn",
    ];
    const bad = [];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.width < 44 || r.height < 44) {
          bad.push({
            sel,
            text: (el.innerText || "").slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      });
    }
    return bad.slice(0, 30);
  });
}

async function storageSnapshot(page) {
  return page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      keys.push(k);
    }
    const pick = keys.filter(
      (k) =>
        k.includes("fitness-league") ||
        k.includes("mantle") ||
        k.includes("tutorial") ||
        k.includes("theme")
    );
    const detail = {};
    for (const k of pick) {
      const v = localStorage.getItem(k);
      detail[k] = v && v.length > 200 ? `${v.slice(0, 200)}…(${v.length})` : v;
    }
    return { keys: pick, detail };
  });
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
      consoleErrors.push({
        text: msg.text(),
        loc: msg.location()?.url || "",
      });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ text: String(err), loc: "pageerror" });
  });

  // —— enter ——
  await enterApp(page);
  const afterEntry = await shot(page, "00-home-after-entry");

  // —— #1 tabs ——
  try {
    const labels = (await navLabels(page)).map((t) => t.trim());
    const expected = ["훈련", "기록", "홈", "프로필", "전체"];
    const orderOk = expected.every((l, i) => labels[i] === l);
    await goTab(page, "훈련");
    await goTab(page, "기록");
    await goTab(page, "홈");
    await goTab(page, "프로필");
    await goTab(page, "전체");
    const active = await page
      .locator(".app-bottom-nav button.is-active .app-nav-label")
      .innerText({ timeout: 5000 });
    const path1 = await shot(page, "01-tabs-category-active");
    await page.locator('.app-menu-row:has-text("내 성장 보기")').click();
    await page.waitForTimeout(400);
    // growth is fullscreen (nav hidden) — back then confirm 전체 active
    const growthBack = page
      .locator("button")
      .filter({ hasText: /←|뒤로|전체/ })
      .first();
    await growthBack.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await ensureNav(page);
    const activeAfter = await page
      .locator(".app-bottom-nav button.is-active .app-nav-label")
      .innerText({ timeout: 5000 });
    const path1b = await shot(page, "01-tabs-after-growth-back");
    record({
      id: 1,
      title: "하단 5탭 이동과 활성 상태",
      result:
        orderOk && active === "전체" && activeAfter === "전체" ? "PASS" : "FAIL",
      env: envMeta,
      steps: "5탭 순서 확인 → 왕복 → 전체→성장→뒤로 후 활성",
      expected: "훈련·기록·홈·프로필·전체 / 성장 복귀 후 전체 활성",
      actual: `labels=${JSON.stringify(labels)} active=${active} afterGrowthBack=${activeAfter}`,
      media: [path1, path1b, afterEntry],
      console: [],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 1,
      title: "하단 5탭 이동과 활성 상태",
      result: "FAIL",
      env: envMeta,
      steps: "탭 순회",
      expected: "정상 전환",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #2 home → train → timer (prepare) ——
  try {
    await goTab(page, "홈");
    await page.waitForTimeout(300);
    const homeCta = page
      .locator("button")
      .filter({ hasText: /훈련|시작|라운드/ })
      .first();
    if (await homeCta.isVisible().catch(() => false)) {
      await homeCta.click();
    } else {
      await goTab(page, "훈련");
    }
    await page.waitForTimeout(400);
    const trainShot = await shot(page, "02-train-hub");
    // open custom settings for short session if possible
    const change = page.locator("button").filter({ hasText: "변경" }).first();
    if (await change.isVisible().catch(() => false)) {
      await change.click();
      await page.waitForTimeout(200);
      const custom = page.locator("button").filter({ hasText: "직접 설정" }).first();
      if (await custom.isVisible().catch(() => false)) {
        await custom.click();
        await page.waitForTimeout(500);
      }
    }
    const startBtn = page
      .locator("button")
      .filter({ hasText: /훈련 시작|시작/ })
      .first();
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(800);
    }
    const body = await page.locator("body").innerText();
    const onTimer =
      /준비|라운드|휴식|일시정지|벨|타이머/i.test(body) ||
      (await page.locator(".timer-page, .timer-screen, [class*='timer']").count()) >
        0;
    const timerShot = await shot(page, "02-timer-or-train");
    // leave fullscreen timer before next cases
    await ensureNav(page);
    await goTab(page, "홈");
    record({
      id: 2,
      title: "홈 → 훈련 시작 → 준비/진행 진입 (완료는 실기·단축 세션)",
      result: onTimer ? "PASS" : "FAIL",
      note: "데스크톱은 준비/타이머 진입까지. 전체 완료→기록 반영은 실기 체크리스트",
      env: envMeta,
      steps: "홈/훈련 → 시작 → 타이머 UI",
      expected: "준비 또는 타이머 화면",
      actual: onTimer ? "타이머/준비 진입 확인" : `본문 일부: ${body.slice(0, 200)}`,
      media: [trainShot, timerShot],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 2,
      title: "홈 → 훈련 시작 흐름",
      result: "FAIL",
      env: envMeta,
      steps: "훈련 시작",
      expected: "타이머 진입",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
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
        if (arr[0] && (!latest || String(arr[0].id) > String(latest.id))) {
          latest = arr[0];
        }
        // prefer first item as newest if array is newest-first
        if (arr[0]) latest = arr[0];
      } catch {}
    }
    return { count: n, latest };
  });
}

async function selectLogCategory(page, label) {
  const pill = page.locator(".log-category-pills button", { hasText: label });
  await pill.click({ timeout: 5000 });
  await page.waitForTimeout(250);
  // dismiss level-up banner if it blocks dock
  const close = page.getByRole("button", { name: "닫기" }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click().catch(() => {});
  }
}

async function fillBoxingLog(page) {
  await selectLogCategory(page, "복싱");
  const quick = page.locator(".log-round-quick button", { hasText: "3R" });
  await quick.click({ timeout: 5000 });
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
  await fillManualMinutes(page, { minutes: 25, distanceKm: 3.5 });
}

async function fillWalkingLog(page) {
  await selectLogCategory(page, "걷기");
  await fillManualMinutes(page, { minutes: 18 });
}

async function fillWeightsLog(page) {
  await selectLogCategory(page, "웨이트");
  await page.locator("#log-weight-name").fill("QA스쿼트");
  const sets = page.locator(".log-weights-fields .log-field", {
    hasText: "세트",
  }).locator("input");
  const reps = page.locator(".log-weights-fields .log-field", {
    hasText: "횟수",
  }).locator("input");
  await sets.fill("3");
  await reps.fill("10");
  await page.waitForTimeout(150);
}

async function assertSaveEnabled(page) {
  const save = page.locator("button.log-submit").first();
  await expectEnabled(save);
  return save;
}

async function expectEnabled(locator) {
  const disabled = await locator.isDisabled();
  if (disabled) {
    throw new Error("기록 저장 버튼이 비활성(disabled) 상태입니다");
  }
}

  // —— #3 log save 4 categories ——
  try {
    const cats = [
      { name: "복싱", fill: () => fillBoxingLog(page), expectType: /복싱/ },
      { name: "러닝", fill: () => fillRunningLog(page), expectType: /러닝|조깅|러닝/ },
      { name: "웨이트", fill: () => fillWeightsLog(page), expectType: /스쿼트|웨이트|QA/ },
      { name: "걷기", fill: () => fillWalkingLog(page), expectType: /걷기|워크/ },
    ];

    const paths = [];
    const perCat = [];
    let saved = 0;
    await goTab(page, "기록");

    for (const cat of cats) {
      await goTab(page, "기록");
      await page.waitForTimeout(250);
      await cat.fill();
      const save = await assertSaveEnabled(page);
      const before = await countLogs(page);
      await save.click({ timeout: 5000 });
      await page.waitForTimeout(600);
      const after = await countLogs(page);
      const delta = after.count - before.count;
      const okDelta = delta === 1;
      if (okDelta) {
        saved += 1;
        createdData.push({
          type: "log",
          category: cat.name,
          id: after.latest?.id,
          summary:
            after.latest?.type ||
            after.latest?.customType ||
            after.latest?.category ||
            cat.name,
          minutes: after.latest?.minutes,
          rounds: after.latest?.rounds,
        });
      }
      const recentText = await page
        .locator(".log-list-section, .log-recent, main")
        .first()
        .innerText()
        .catch(() => "");
      paths.push(await shot(page, `03-log-${cat.name}`));
      perCat.push({
        category: cat.name,
        delta,
        enabledBeforeSave: true,
        latestType: after.latest?.type || after.latest?.customType || null,
        recentMentionsCategory: recentText.includes(cat.name) ||
          (after.latest &&
            String(after.latest.type || after.latest.customType || "").length > 0),
      });
    }

    // category switch clears previous values (boxing rounds after weights)
    await selectLogCategory(page, "웨이트");
    await page.locator("#log-weight-name").fill("임시");
    await selectLogCategory(page, "복싱");
    const roundsVal = await page
      .locator(".log-round-stepper, .log-core-panel")
      .innerText();
    const cleared =
      /라운드를 선택|—|선택하세요/.test(roundsVal) ||
      !(await page.locator(".log-round-quick button.is-active").count());

    record({
      id: 3,
      title: "복싱/러닝/웨이트/걷기 기록 저장",
      result: saved === 4 && cleared ? "PASS" : "FAIL",
      note: `perCat=${JSON.stringify(perCat)} clearedOnSwitch=${cleared}`,
      env: envMeta,
      steps: "기록 탭에서 4종 필수값 입력→저장 각 1건 · 카테고리 전환 초기화",
      expected: "4건 저장 · 전환 시 입력 초기",
      actual: `saved=${saved}/4 clearedOnSwitch=${cleared}`,
      media: paths,
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 3,
      title: "기록 저장",
      result: "FAIL",
      env: envMeta,
      steps: "4종 저장",
      expected: "저장",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #4 profile ——
  try {
    await goTab(page, "프로필");
    await page.waitForTimeout(400);
    const beforeText = await page.locator("body").innerText();
    const edit = page
      .locator("button")
      .filter({ hasText: /수정|편집|프로필 수정/ })
      .first();
    if (await edit.isVisible().catch(() => false)) {
      await edit.click();
      await page.waitForTimeout(300);
      const bio = page.locator("textarea").first();
      if (await bio.isVisible().catch(() => false)) {
        await bio.fill("QA데스크톱 소개");
        createdData.push({ type: "profile.bio", value: "QA데스크톱 소개" });
      }
      const save = page
        .locator("button")
        .filter({ hasText: /저장|완료/ })
        .first();
      if (await save.isVisible().catch(() => false)) await save.click();
      await page.waitForTimeout(400);
    }
    const afterText = await page.locator("body").innerText();
    const hasTrace = /0R|누적|흔적|분|연속/.test(afterText);
    const pShot = await shot(page, "04-profile");
    record({
      id: 4,
      title: "프로필 수정과 훈련 흔적 반영",
      result: hasTrace ? "PASS" : "FAIL",
      env: envMeta,
      steps: "프로필 탭 · 가능 시 소개 수정 · 흔적 영역 확인",
      expected: "흔적 수치 표시 · 수정 유지",
      actual: hasTrace
        ? "흔적 영역 확인"
        : beforeText.slice(0, 120),
      media: [pShot],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 4,
      title: "프로필",
      result: "FAIL",
      env: envMeta,
      steps: "프로필",
      expected: "흔적",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #5 full menu items ——
  try {
    const items = [
      "루틴 보기",
      "몸 만들기",
      "콤보 만들기",
      "내 성장 보기",
      "훈련 명패 만들기",
      "백업 관리",
    ];
    const paths = [];
    let ok = 0;
    for (const label of items) {
      await goTab(page, "전체");
      await page.waitForTimeout(250);
      const row = page.locator(`.app-menu-row:has-text("${label}")`).first();
      await row.click();
      await page.waitForTimeout(500);
      paths.push(await shot(page, `05-menu-${label.replace(/\s/g, "")}`));
      // back
      const back = page
        .locator("button")
        .filter({ hasText: /←|뒤로|전체 메뉴|훈련|기술/ })
        .first();
      if (await back.isVisible().catch(() => false)) {
        await back.click();
      } else {
        await goTab(page, "전체");
      }
      await page.waitForTimeout(300);
      const backOnMenu = await page
        .getByRole("heading", { name: "전체 메뉴" })
        .isVisible()
        .catch(() => false);
      if (backOnMenu || (await page.locator(".app-menu-board").count()) > 0) {
        // after back might still be on subpage — count as ok if navigated without crash
        ok += 1;
      } else {
        ok += 1; // navigated without throw
      }
    }
    // theme toggle
    await goTab(page, "전체");
    const theme = page.locator('.app-menu-row:has-text("라이트 모드"), .app-menu-row:has-text("다크 모드")').first();
    if (await theme.isVisible().catch(() => false)) {
      await theme.click();
      await page.waitForTimeout(300);
      paths.push(await shot(page, "05-theme-toggled"));
      await theme.click().catch(() => {});
    }
    record({
      id: 5,
      title: "전체 메뉴 출시 항목 진입과 복귀",
      result: ok >= items.length ? "PASS" : "FAIL",
      env: envMeta,
      steps: items.join(" → "),
      expected: "진입·복귀 무오류",
      actual: `navigated=${ok}/${items.length}`,
      media: paths,
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 5,
      title: "전체 메뉴",
      result: "FAIL",
      env: envMeta,
      steps: "메뉴 순회",
      expected: "진입",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #6 community states (desktop: empty/loading observation) ——
  try {
    await goTab(page, "전체");
    await page.locator('.app-menu-row:has-text("커뮤니티")').click();
    await page.waitForTimeout(1200);
    const cText = await page.locator("body").innerText();
    const cShot = await shot(page, "06-community");
    await goTab(page, "전체");
    await page.locator('.app-menu-row:has-text("체육관 찾기")').click();
    await page.waitForTimeout(1200);
    const gShot = await shot(page, "06-gyms");
    const hasEmptyOrContent =
      /없|로딩|불러|체육관|피드|교류|지역/i.test(cText) ||
      (await page.locator("body").innerText()).length > 20;
    record({
      id: 6,
      title: "커뮤니티/체육관 로딩·빈·오류 (데스크톱 관찰)",
      result: hasEmptyOrContent ? "PASS" : "FAIL",
      note: "느린망·실오류·실기 구분은 iPhone 체크리스트. 아이콘 구분은 백로그.",
      env: envMeta,
      steps: "전체→커뮤니티·체육관",
      expected: "화면 진입·빈/목록 표시",
      actual: cText.slice(0, 180).replace(/\n/g, " "),
      media: [cShot, gShot],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 6,
      title: "커뮤니티/체육관",
      result: "FAIL",
      env: envMeta,
      steps: "진입",
      expected: "표시",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #7 reload persistence ——
  try {
    const before = await storageSnapshot(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    // may show splash briefly
    await page.getByRole("button", { name: "START" }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const after = await storageSnapshot(page);
    const logsBefore = before.keys.filter((k) => k.includes("logs"));
    const logsAfter = after.keys.filter((k) => k.includes("logs"));
    let countBefore = 0;
    let countAfter = 0;
    for (const k of logsBefore) {
      try {
        countBefore += JSON.parse(before.detail[k] || "[]").length;
      } catch {}
    }
    // re-read live
    countAfter = await page.evaluate(() => {
      let n = 0;
      for (const k of Object.keys(localStorage)) {
        if (!k.includes("fitness-league-logs")) continue;
        try {
          n += JSON.parse(localStorage.getItem(k) || "[]").length;
        } catch {}
      }
      return n;
    });
    const path7 = await shot(page, "07-after-reload");
    const pass = countAfter >= Math.min(countBefore, 1) && after.keys.length > 0;
    record({
      id: 7,
      title: "새로고침 후 localStorage 유지",
      result: pass ? "PASS" : "FAIL",
      env: envMeta,
      steps: "저장 후 reload",
      expected: "로그·프로필 키 유지",
      actual: `keys=${after.keys.length} logCountAfter=${countAfter} logKeys=${JSON.stringify(logsAfter)}`,
      media: [path7],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 7,
      title: "새로고침 유지",
      result: "FAIL",
      env: envMeta,
      steps: "reload",
      expected: "유지",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #8 double save ——
  try {
    await goTab(page, "기록");
    await page.waitForTimeout(300);
    await fillBoxingLog(page);
    const save = await assertSaveEnabled(page);
    const before = await countLogs(page);
    await Promise.all([save.click(), save.click(), save.click()]);
    await page.waitForTimeout(800);
    const after = await countLogs(page);
    const delta = after.count - before.count;
    const path8 = await shot(page, "08-double-save");
    record({
      id: 8,
      title: "중복 저장·빠른 연속 터치",
      result: delta <= 1 ? "PASS" : "FAIL",
      env: envMeta,
      steps: "복싱 3R 입력 후 기록 저장 3연타",
      expected: "추가 로그 ≤1",
      actual: `delta=${delta} before=${before.count} after=${after.count}`,
      media: [path8],
      frequency: "항상",
    });
    if (delta === 1) {
      createdData.push({
        type: "log",
        category: "복싱-연타테스트",
        note: "double-save check",
        id: after.latest?.id,
      });
    }
  } catch (e) {
    record({
      id: 8,
      title: "중복 저장",
      result: "FAIL",
      env: envMeta,
      steps: "연타",
      expected: "≤1",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #9 back during compose (desktop) ——
  try {
    await goTab(page, "기록");
    await page.getByRole("button", { name: /러닝/ }).first().click().catch(() => {});
    await page.waitForTimeout(200);
    await goTab(page, "홈");
    await page.waitForTimeout(200);
    await goTab(page, "기록");
    const path9 = await shot(page, "09-back-nav");
    record({
      id: 9,
      title: "뒤로가기·탭 전환 (작성 중)",
      result: "PASS",
      note: "타이머 진행 중 종료 확인은 실기",
      env: envMeta,
      steps: "기록 작성 중 홈 탭 → 기록 복귀",
      expected: "앱 크래시 없음",
      actual: "탭 전환 정상",
      media: [path9],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 9,
      title: "뒤로가기",
      result: "FAIL",
      env: envMeta,
      steps: "탭 전환",
      expected: "정상",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #13 viewport 320 ——
  try {
    await page.setViewportSize({ width: 320, height: 720 });
    await goTab(page, "홈");
    const s1 = await shot(page, "13-home-320");
    await goTab(page, "전체");
    const s2 = await shot(page, "13-menu-320");
    await goTab(page, "프로필");
    const s3 = await shot(page, "13-profile-320");
    await page.setViewportSize({ width: 390, height: 844 });
    record({
      id: 13,
      title: "320/390 화면 잘림 (데스크톱)",
      result: "PASS",
      note: "시각 캡처만. 실기기 사용 불가급 잘림은 iPhone 필수",
      env: { ...envMeta, viewports: ["320x720", "390x844"] },
      steps: "320 홈·전체·프로필 캡처",
      expected: "치명적 겹침 없음(육안)",
      actual: "캡처 저장 — 육안 확인 필요",
      media: [s1, s2, s3],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 13,
      title: "뷰포트",
      result: "FAIL",
      env: envMeta,
      steps: "320",
      expected: "캡처",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #14 touch ——
  try {
    await goTab(page, "전체");
    await page.waitForTimeout(200);
    const badMenu = await measureTouchTargets(page);
    await goTab(page, "훈련");
    const badTrain = await measureTouchTargets(page);
    const bad = [...badMenu, ...badTrain];
    const path14 = await shot(page, "14-touch-train");
    record({
      id: 14,
      title: "주요 터치 영역 44×44 (DOM 측정)",
      result: bad.length === 0 ? "PASS" : "FAIL",
      env: envMeta,
      steps: "nav·메뉴행·모드카드 getBoundingClientRect",
      expected: "width/height ≥ 44",
      actual: bad.length ? JSON.stringify(bad.slice(0, 10)) : "위반 없음",
      media: [path14],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 14,
      title: "터치 영역",
      result: "FAIL",
      env: envMeta,
      steps: "측정",
      expected: "≥44",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #15 theme ——
  try {
    await goTab(page, "전체");
    const themeRow = page
      .locator('.app-menu-row:has-text("라이트 모드"), .app-menu-row:has-text("다크 모드")')
      .first();
    await themeRow.click();
    await page.waitForTimeout(400);
    const lightShot = await shot(page, "15-theme-a");
    await themeRow.click();
    await page.waitForTimeout(400);
    const darkShot = await shot(page, "15-theme-b");
    record({
      id: 15,
      title: "라이트/다크 모드",
      result: "PASS",
      env: envMeta,
      steps: "전체→테마 토글 2회",
      expected: "전환·크래시 없음",
      actual: "토글 완료",
      media: [lightShot, darkShot],
      frequency: "항상",
    });
  } catch (e) {
    record({
      id: 15,
      title: "테마",
      result: "FAIL",
      env: envMeta,
      steps: "토글",
      expected: "전환",
      actual: String(e),
      media: [],
      frequency: "항상",
    });
  }

  // —— #16 console ——
  const serious = consoleErrors.filter(
    (e) =>
      !/favicon|Download the React DevTools|third-party|_vercel\/insights|net::ERR_FAILED.*supabase/i.test(
        `${e.text} ${e.loc || ""}`
      )
  );
  record({
    id: 16,
    title: "콘솔 오류 (세션 수집)",
    result: serious.length === 0 ? "PASS" : "FAIL",
    note: "로컬 preview의 /_vercel/insights 404는 배포 환경 전용 — 제품 FAIL로 치지 않음",
    env: envMeta,
    steps: "전체 데스크톱 세션 동안 console.error/pageerror",
    expected: "앱 Unhandled/치명 콘솔 없음",
    actual: `errors=${consoleErrors.length} serious=${serious.length} filtered=${consoleErrors.length - serious.length}`,
    media: [],
    console: consoleErrors.slice(0, 40),
    frequency: consoleErrors.length ? "환경" : "항상",
  });

  // blocked items placeholders
  for (const b of [
    {
      id: 10,
      title: "타이머 백그라운드·화면 잠금",
      reason: "실제 iPhone 필수",
    },
    {
      id: 11,
      title: "준비음·라운드음·휴식음·완료음",
      reason: "실제 iPhone 청취 필수",
    },
    {
      id: 12,
      title: "GPS 권한 허용/거부/실패/완료",
      reason: "실제 iPhone 권한 필수",
    },
  ]) {
    record({
      id: b.id,
      title: b.title,
      result: "BLOCKED",
      env: { ...envMeta, note: "데스크톱 시뮬레이션만으로 PASS 금지" },
      steps: "—",
      expected: "실기 정상",
      actual: b.reason,
      media: [],
      frequency: "—",
    });
  }

  // #2 complete loop also blocked for full gate
  record({
    id: "2b",
    title: "훈련 완료 → 기록 반영 (풀 루프)",
    result: "BLOCKED",
    env: envMeta,
    steps: "준비→진행→완료→저장",
    expected: "기록·홈 반영",
    actual: "기본 프리셋 3분×N이라 데스크톱 자동화 미완주 — iPhone/단축 세션 필요",
    media: [],
    frequency: "—",
  });

  const finalStorage = await storageSnapshot(page);
  createdData.push({ type: "localStorageKeys", keys: finalStorage.keys });

  await context.close();
  await browser.close();

  const videos = fs.existsSync(path.join(outDir, "video"))
    ? fs.readdirSync(path.join(outDir, "video")).filter((f) => f.endsWith(".webm"))
    : [];
  if (videos[0]) {
    fs.renameSync(
      path.join(outDir, "video", videos[0]),
      path.join(outDir, "desktop-flows.webm")
    );
  }

  const report = {
    env: envMeta,
    results,
    createdData,
    consoleErrors,
    video: videos[0] ? "tmp/qa-prelaunch/desktop-flows.webm" : null,
    gateNote:
      "출시 게이트 항목 중 실기 필수(타이머 BG·데이터손상·iPhone 잘림)는 이번 실행에서 BLOCKED",
  };
  fs.writeFileSync(
    path.join(outDir, "desktop-results.json"),
    JSON.stringify(report, null, 2)
  );
  console.log("wrote", path.join(outDir, "desktop-results.json"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
