/**
 * EVENT v0 — state transitions, operator RPC, RLS (live Supabase).
 *
 * Requires:
 * 1) supabase/event_v0.sql (+ event_v0_pgcrypto_hotfix.sql if needed) applied
 * 2) supabase/event_v0_dev_fixture.sql applied (event-v0-dev)
 * 3) event_v0_set_operator_secret_hash('event-v0-dev', ...) configured
 * 4) Anonymous sign-ins enabled
 *
 * Env:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   EVENT_V0_DEV_OPERATOR_SECRET
 *   SUPABASE_SERVICE_ROLE_KEY (optional — pairing_history append audit)
 *
 * Run: node scripts/qa-event-v0.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const OPERATOR_SECRET = process.env.EVENT_V0_DEV_OPERATOR_SECRET;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** Fixed DEV event only — never a production slug. */
const EVENT_ID = "event-v0-dev";
const RUN_ID = Date.now();

if (!URL || !ANON) {
  console.error("FAIL: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing");
  process.exit(1);
}
if (!OPERATOR_SECRET) {
  console.error("FAIL: EVENT_V0_DEV_OPERATOR_SECRET missing");
  process.exit(1);
}

/** @type {{ id: string, pass: boolean, detail?: string }[]} */
const results = [];

function pass(id, detail = "") {
  results.push({ id, pass: true, detail });
  console.log(`PASS: ${id}${detail ? ` — ${detail}` : ""}`);
}

function fail(id, detail = "") {
  results.push({ id, pass: false, detail });
  console.log(`FAIL: ${id}${detail ? ` — ${detail}` : ""}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isDenied(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "42501" ||
    code === "P0002" ||
    code === "22023" ||
    code.includes("42501") ||
    msg.includes("not active") ||
    msg.includes("not found") ||
    msg.includes("must be different") ||
    msg.includes("already in an active pairing") ||
    msg.includes("no waiting") ||
    msg.includes("invalid operator secret") ||
    msg.includes("permission denied") ||
    msg.includes("row-level security")
  );
}

function unwrapRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

function memoryAuthClient() {
  /** @type {Record<string, string>} */
  const store = {};
  return createClient(URL, ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => {
          store[key] = value;
        },
        removeItem: (key) => {
          delete store[key];
        },
      },
    },
  });
}

async function signInAnon(client, label) {
  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    throw new Error(`${label}: signInAnonymously — ${error.message}`);
  }
  assert(data.user?.id, `${label}: missing user id`);
  return data.user.id;
}

function opArgs(extra = {}) {
  return {
    p_event_id: EVENT_ID,
    p_operator_secret: OPERATOR_SECRET,
    ...extra,
  };
}

async function maxOrderNumber(client) {
  const { data, error } = await client.rpc(
    "event_v0_operator_list_pairings",
    opArgs()
  );
  if (error) throw new Error(`list_pairings: ${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  return rows.reduce((max, row) => Math.max(max, Number(row.order_number) || 0), 0);
}

async function fetchHistory(admin, pairingId) {
  const { data, error } = await admin
    .from("pairing_history")
    .select("id, action, payload, created_at")
    .eq("pairing_id", pairingId)
    .eq("event_id", EVENT_ID)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`pairing_history read: ${error.message}`);
  return data || [];
}

async function requestByParticipant(admin, participantId) {
  const { data, error } = await admin
    .from("sparring_requests")
    .select("*")
    .eq("event_id", EVENT_ID)
    .eq("participant_id", participantId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`sparring_requests read: ${error.message}`);
  return data || [];
}

async function main() {
  console.log(`EVENT v0 QA — ${EVENT_ID} — run ${RUN_ID}`);

  const bare = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clientA = memoryAuthClient();
  const operator = memoryAuthClient();
  const admin = SERVICE_ROLE
    ? createClient(URL, SERVICE_ROLE, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const label = {
    a: `QA-A-${RUN_ID}`,
    b: `QA-B-${RUN_ID}`,
    c: `QA-C-${RUN_ID}`,
    d: `QA-D-${RUN_ID}`,
    e: `QA-E-${RUN_ID}`,
  };

  let participantA;
  let participantB;
  let participantC;
  let participantD;
  let requestA1;
  let requestA2;
  let pairing1;
  let pairing2;
  let orderBefore;
  let historySnap1 = [];

  // 1. public event
  try {
    const { data, error } = await bare.rpc("event_v0_get_public_event", {
      p_event_id: EVENT_ID,
    });
    assert(!error, error?.message);
    const row = unwrapRow(data);
    assert(row?.id === EVENT_ID, `expected ${EVENT_ID}`);
    pass("1 public event", row?.status || "");
  } catch (e) {
    fail("1 public event", e.message);
    throw e;
  }

  // 2. anonymous register A
  try {
    await signInAnon(clientA, "A");
    const { data, error } = await clientA.rpc("event_v0_register_participant", {
      p_event_id: EVENT_ID,
      p_display_name: label.a,
      p_gym_name: "QA Gym Alpha",
      p_weight_kg: 72,
      p_experience: "1년차",
    });
    assert(!error, error?.message);
    participantA = unwrapRow(data);
    assert(participantA?.id, "missing participant A");
    assert(participantA.display_name === label.a, "display_name mismatch");
    pass("2 participant A self registration", participantA.id);
  } catch (e) {
    fail("2 participant A self registration", e.message);
    throw e;
  }

  // 3. A sparring request
  try {
    const { data, error } = await clientA.rpc(
      "event_v0_create_sparring_request",
      { p_event_id: EVENT_ID }
    );
    assert(!error, error?.message);
    requestA1 = unwrapRow(data);
    assert(requestA1?.status === "waiting", `status=${requestA1?.status}`);

    const { data: mine, error: mineErr } = await clientA.rpc(
      "event_v0_get_my_sparring_requests",
      { p_event_id: EVENT_ID }
    );
    assert(!mineErr, mineErr?.message);
    const rows = Array.isArray(mine) ? mine : [];
    assert(rows.some((r) => r.id === requestA1.id && r.status === "waiting"), "waiting not visible");
    pass("3 A sparring request waiting", requestA1.id);
  } catch (e) {
    fail("3 A sparring request waiting", e.message);
    throw e;
  }

  // operator session (separate anonymous user — operator RPC only)
  await signInAnon(operator, "operator");

  // 4. operator add B, C, D + list
  try {
    for (const [key, name] of [
      ["b", label.b],
      ["c", label.c],
      ["d", label.d],
    ]) {
      const { data, error } = await operator.rpc(
        "event_v0_operator_add_participant",
        opArgs({
          p_display_name: name,
          p_gym_name: `QA Gym ${key.toUpperCase()}`,
          p_weight_kg: 70,
          p_experience: "2~3년",
        })
      );
      assert(!error, `${key}: ${error?.message}`);
      const row = unwrapRow(data);
      assert(row?.id, `${key} missing id`);
      if (key === "b") participantB = row;
      if (key === "c") participantC = row;
      if (key === "d") participantD = row;
    }

    const { data, error } = await operator.rpc(
      "event_v0_operator_list_participants",
      opArgs()
    );
    assert(!error, error?.message);
    const list = Array.isArray(data) ? data : [];
    const ids = new Set(list.map((r) => r.id));
    assert(ids.has(participantA.id), "A missing from list");
    assert(ids.has(participantB.id), "B missing from list");
    assert(ids.has(participantC.id), "C missing from list");
    assert(ids.has(participantD.id), "D missing from list");
    pass("4 operator add B/C/D + list", `participants=${list.length}`);
  } catch (e) {
    fail("4 operator add B/C/D + list", e.message);
    throw e;
  }

  // 5. operator sparring requests for B, C, D
  try {
    for (const pid of [participantB.id, participantC.id, participantD.id]) {
      const { error } = await operator.rpc(
        "event_v0_operator_create_sparring_request",
        opArgs({ p_participant_id: pid })
      );
      assert(!error, error?.message);
    }
    pass("5 operator sparring requests B/C/D");
  } catch (e) {
    fail("5 operator sparring requests B/C/D", e.message);
    throw e;
  }

  // 6. A + B pairing
  try {
    orderBefore = await maxOrderNumber(operator);
    const { data, error } = await operator.rpc(
      "event_v0_operator_create_pairing",
      opArgs({
        p_participant_a_id: participantA.id,
        p_participant_b_id: participantB.id,
      })
    );
    assert(!error, error?.message);
    pairing1 = unwrapRow(data);
    assert(pairing1?.status === "active", pairing1?.status);
    assert(pairing1.order_number === orderBefore + 1, `order=${pairing1.order_number} expected ${orderBefore + 1}`);

    if (admin) {
      const reqsA = await requestByParticipant(admin, participantA.id);
      const reqsB = await requestByParticipant(admin, participantB.id);
      assert(reqsA.some((r) => r.id === requestA1.id && r.status === "assigned"), "A request not assigned");
      assert(reqsB.some((r) => r.status === "assigned"), "B request not assigned");

      historySnap1 = await fetchHistory(admin, pairing1.id);
      assert(
        historySnap1.some((h) => h.action === "pairing_created"),
        "missing pairing_created"
      );
    }

    pass("6 A+B pairing created", `order=${pairing1.order_number}`);
  } catch (e) {
    fail("6 A+B pairing created", e.message);
    throw e;
  }

  // 7. complete pairing 1
  try {
    const { data, error } = await operator.rpc(
      "event_v0_operator_complete_pairing",
      opArgs({ p_pairing_id: pairing1.id })
    );
    assert(!error, error?.message);
    pairing1 = unwrapRow(data);
    assert(pairing1.status === "completed", pairing1.status);

    if (admin) {
      const reqsA = await requestByParticipant(admin, participantA.id);
      assert(reqsA.some((r) => r.id === requestA1.id && r.status === "completed"), "A request not completed");
      const hist = await fetchHistory(admin, pairing1.id);
      assert(hist.some((h) => h.action === "completed"), "missing completed history");
      assert(hist.length >= historySnap1.length, "history shrank");
    }

    pass("7 complete pairing 1");
  } catch (e) {
    fail("7 complete pairing 1", e.message);
    throw e;
  }

  // 8. A new waiting request (must not overwrite completed)
  try {
    const { data, error } = await clientA.rpc(
      "event_v0_create_sparring_request",
      { p_event_id: EVENT_ID }
    );
    assert(!error, error?.message);
    requestA2 = unwrapRow(data);
    assert(requestA2.id !== requestA1.id, "request id reused");
    assert(requestA2.status === "waiting", requestA2.status);

    if (admin) {
      const reqsA = await requestByParticipant(admin, participantA.id);
      const completed = reqsA.filter((r) => r.id === requestA1.id);
      const waiting = reqsA.filter((r) => r.id === requestA2.id);
      assert(completed.length === 1 && completed[0].status === "completed", "old request overwritten");
      assert(waiting.length === 1 && waiting[0].status === "waiting", "new request missing");
    }

    pass("8 A re-queue new request", requestA2.id);
  } catch (e) {
    fail("8 A re-queue new request", e.message);
    throw e;
  }

  // 9. A + C pairing — next order, no reuse of completed order
  try {
    const orderBefore2 = await maxOrderNumber(operator);
    const { data, error } = await operator.rpc(
      "event_v0_operator_create_pairing",
      opArgs({
        p_participant_a_id: participantA.id,
        p_participant_b_id: participantC.id,
      })
    );
    assert(!error, error?.message);
    pairing2 = unwrapRow(data);
    assert(pairing2.order_number === orderBefore2 + 1, `order=${pairing2.order_number}`);
    assert(pairing2.order_number !== pairing1.order_number, "reused completed order number");
    pass("9 A+C pairing order increment", `order=${pairing2.order_number} prev=${pairing1.order_number}`);
  } catch (e) {
    fail("9 A+C pairing order increment", e.message);
    throw e;
  }

  // 10. opponent change C → D
  try {
    const pairing2Id = pairing2.id;
    const order2 = pairing2.order_number;
    let cRequestBefore;
    if (admin) {
      cRequestBefore = (await requestByParticipant(admin, participantC.id)).find(
        (r) => r.status === "assigned"
      );
    }

    const { data, error } = await operator.rpc(
      "event_v0_operator_change_pairing_opponent",
      opArgs({
        p_pairing_id: pairing2.id,
        p_replaced_participant_id: participantC.id,
        p_new_participant_id: participantD.id,
      })
    );
    assert(!error, error?.message);
    pairing2 = unwrapRow(data);
    assert(pairing2.id === pairing2Id, "pairing id changed");
    assert(pairing2.order_number === order2, "order_number changed");
    assert(pairing2.participant_b_id === participantD.id || pairing2.participant_a_id === participantD.id, "D not in pairing");

    if (admin) {
      const reqsC = await requestByParticipant(admin, participantC.id);
      assert(
        reqsC.some((r) => r.id === cRequestBefore?.id && r.status === "waiting"),
        "C request not returned to waiting"
      );
      const reqsD = await requestByParticipant(admin, participantD.id);
      assert(reqsD.some((r) => r.status === "assigned"), "D request not assigned");

      const hist = await fetchHistory(admin, pairing2.id);
      assert(hist.filter((h) => h.action === "opponent_changed").length >= 1, "missing opponent_changed");
    }

    pass("10 opponent change C→D", `pairing=${pairing2.id} order=${pairing2.order_number}`);
  } catch (e) {
    fail("10 opponent change C→D", e.message);
    throw e;
  }

  // 11. change opponent on completed pairing 1 — must fail
  try {
    const { error } = await operator.rpc(
      "event_v0_operator_change_pairing_opponent",
      opArgs({
        p_pairing_id: pairing1.id,
        p_replaced_participant_id: participantA.id,
        p_new_participant_id: participantD.id,
      })
    );
    assert(isDenied(error), `expected failure, got: ${error?.message || "success"}`);
    pass("11 reject change on completed pairing");
  } catch (e) {
    fail("11 reject change on completed pairing", e.message);
  }

  // 12. cancel completed pairing 1 — must fail
  try {
    const { error } = await operator.rpc(
      "event_v0_operator_cancel_pairing",
      opArgs({ p_pairing_id: pairing1.id })
    );
    assert(isDenied(error), `expected failure, got: ${error?.message || "success"}`);
    pass("12 reject cancel on completed pairing");
  } catch (e) {
    fail("12 reject cancel on completed pairing", e.message);
  }

  // 13. A already in active pairing — second pairing must fail
  try {
    const { error: reqErr } = await operator.rpc(
      "event_v0_operator_create_sparring_request",
      opArgs({ p_participant_id: participantB.id })
    );
    assert(!reqErr, `B re-queue: ${reqErr?.message}`);

    const { error } = await operator.rpc(
      "event_v0_operator_create_pairing",
      opArgs({
        p_participant_a_id: participantA.id,
        p_participant_b_id: participantB.id,
      })
    );
    assert(isDenied(error), `expected failure, got: ${error?.message || "success"}`);
    pass("13 reject A duplicate active pairing");
  } catch (e) {
    fail("13 reject A duplicate active pairing", e.message);
  }

  // 14. same participant pairing — must fail (E not in any active pairing)
  try {
    const { data: addE, error: addEErr } = await operator.rpc(
      "event_v0_operator_add_participant",
      opArgs({
        p_display_name: label.e,
        p_gym_name: "QA Gym E",
        p_weight_kg: 68,
        p_experience: "1년차",
      })
    );
    assert(!addEErr, addEErr?.message);
    const participantE = unwrapRow(addE);
    assert(participantE?.id, "missing participant E");

    const { error: reqEErr } = await operator.rpc(
      "event_v0_operator_create_sparring_request",
      opArgs({ p_participant_id: participantE.id })
    );
    assert(!reqEErr, `E sparring request: ${reqEErr?.message}`);

    const { error } = await operator.rpc(
      "event_v0_operator_create_pairing",
      opArgs({
        p_participant_a_id: participantE.id,
        p_participant_b_id: participantE.id,
      })
    );
    assert(error, "expected failure, got success");
    const msg = String(error.message || "").toLowerCase();
    const code = String(error.code || "");
    assert(
      code === "22023" || msg.includes("participants must be different"),
      `wrong failure reason: code=${code} message=${error.message}`
    );
    pass("14 reject same participant pairing", `code=${code || "22023"}`);
  } catch (e) {
    fail("14 reject same participant pairing", e.message);
  }

  // 15. invalid participant / cross-event rejection
  try {
    const fakeId = "00000000-0000-4000-8000-000000000001";
    const { error } = await operator.rpc(
      "event_v0_operator_create_pairing",
      opArgs({
        p_participant_a_id: participantD.id,
        p_participant_b_id: fakeId,
      })
    );
    assert(isDenied(error), `expected failure, got: ${error?.message || "success"}`);
    pass("15 reject unknown participant id");
  } catch (e) {
    fail("15 reject unknown participant id", e.message);
  }

  // 16. participant RLS
  try {
    const { data: allRows, error: allErr } = await clientA
      .from("event_participants")
      .select("id, display_name")
      .eq("event_id", EVENT_ID);
    assert(!allErr, allErr?.message);
    const visible = Array.isArray(allRows) ? allRows : [];
    const visibleIds = new Set(visible.map((r) => r.id));
    assert(visibleIds.has(participantA.id), "A cannot see self");
    assert(!visibleIds.has(participantB.id), "A can see B (should not)");
    assert(!visibleIds.has(participantC.id), "A can see C (should not)");
    assert(visibleIds.has(participantD.id), "A cannot see active opponent D");

    const { data: peekB, error: peekBErr } = await clientA
      .from("event_participants")
      .select("*")
      .eq("id", participantB.id)
      .maybeSingle();
    assert(!peekB, `A read B directly: ${peekBErr?.message || JSON.stringify(peekB)}`);

    const { data: myPairings, error: pairErr } = await clientA.rpc(
      "event_v0_get_my_pairings",
      { p_event_id: EVENT_ID }
    );
    assert(!pairErr, pairErr?.message);
    const pairRows = Array.isArray(myPairings) ? myPairings : [];
    assert(pairRows.some((p) => p.pairing_id === pairing2.id), "active pairing not returned");
    assert(
      pairRows.some((p) => p.opponent_participant_id === participantD.id),
      "opponent D not in pairing view"
    );

    pass("16 participant RLS", `visible=${visible.length} ids`);
  } catch (e) {
    fail("16 participant RLS", e.message);
  }

  // 17. pairing_history append-only audit
  try {
    const { data: histDenied, error: histErr } = await clientA
      .from("pairing_history")
      .select("*")
      .eq("event_id", EVENT_ID);
    assert(
      histErr || !histDenied?.length,
      "participant must not read pairing_history"
    );

    if (!admin) {
      pass("17 pairing_history append (SKIP audit — set SUPABASE_SERVICE_ROLE_KEY for full check)");
    } else {
      const h1 = await fetchHistory(admin, pairing1.id);
      const h2 = await fetchHistory(admin, pairing2.id);

      const actions1 = h1.map((h) => h.action);
      const actions2 = h2.map((h) => h.action);
      assert(actions1.includes("pairing_created"), "p1 missing pairing_created");
      assert(actions1.includes("completed"), "p1 missing completed");
      assert(actions2.includes("pairing_created"), "p2 missing pairing_created");
      assert(actions2.filter((a) => a === "opponent_changed").length >= 1, "p2 missing opponent_changed");

      const ids1 = new Set(h1.map((h) => h.id));
      const ids2 = new Set(h2.map((h) => h.id));
      assert(ids1.size === h1.length, "duplicate history ids p1");
      assert(ids2.size === h2.length, "duplicate history ids p2");

      pass("17 pairing_history append", `p1=${actions1.join(",")} p2=${actions2.join(",")}`);
    }
  } catch (e) {
    fail("17 pairing_history append", e.message);
  }

  const failed = results.filter((r) => !r.pass);
  console.log("");
  console.log(
    JSON.stringify(
      {
        EVENT_ID,
        RUN_ID,
        labels: label,
        pairing1_id: pairing1?.id,
        pairing2_id: pairing2?.id,
        passed: results.filter((r) => r.pass).length,
        failed: failed.length,
        results,
      },
      null,
      2
    )
  );

  if (failed.length) {
    console.error(`\nEVENT v0 QA FAILED (${failed.length} checks)`);
    process.exit(1);
  }
  console.log("\nEVENT v0 QA OK");
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
