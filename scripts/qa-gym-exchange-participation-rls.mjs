/**
 * Phase 1 — gym exchange participation RLS / ownership checks.
 *
 * Requires:
 * 1) Supabase Anonymous sign-ins enabled
 * 2) supabase/dojo_gym_exchange_participations.sql applied
 * 3) VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local
 *
 * Run: node scripts/qa-gym-exchange-participation-rls.mjs
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
const EVENT_ID = `rls-test-${Date.now()}`;

if (!URL || !ANON) {
  console.error("FAIL: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing");
  process.exit(1);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function signInAnon(client, label) {
  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    throw new Error(
      `${label}: signInAnonymously failed — ${error.message}. Enable Anonymous sign-ins in Supabase Auth providers.`
    );
  }
  const uid = data.user?.id;
  assert(uid, `${label}: no user id`);
  return uid;
}

async function main() {
  const results = [];

  // --- Unauthenticated client (anon role, no JWT user) ---
  const bare = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await bare.auth.signOut().catch(() => {});

  {
    const { error } = await bare.rpc("join_gym_exchange_participation", {
      p_event_id: EVENT_ID,
      p_nickname: "무인증",
      p_gym_name: "테스트짐",
    });
    assert(error, "unauth join should fail");
    results.push({ case: "unauth join", pass: true, detail: error.message });
  }

  {
    const { error } = await bare
      .from("dojo_gym_exchange_participations")
      .insert({
        event_id: EVENT_ID,
        user_id: "00000000-0000-4000-8000-000000000000",
        nickname: "무인증",
        gym_name: "테스트짐",
      });
    assert(error, "unauth insert should fail");
    results.push({ case: "unauth insert", pass: true, detail: error.message });
  }

  // --- User A ---
  const clientA = memoryAuthClient();
  const uidA = await signInAnon(clientA, "A");

  const { data: joinA, error: joinAErr } = await clientA.rpc(
    "join_gym_exchange_participation",
    {
      p_event_id: EVENT_ID,
      p_nickname: "Alpha",
      p_gym_name: "Gym A",
    }
  );
  assert(!joinAErr, `A join failed: ${joinAErr?.message}`);
  const rowA = Array.isArray(joinA) ? joinA[0] : joinA;
  assert(rowA?.user_id === uidA, "A join user_id must be auth.uid()");
  assert(rowA?.sparring_rounds === 0, "A rounds default 0");
  results.push({ case: "A join", pass: true, id: rowA.id });

  const { data: updA, error: updAErr } = await clientA.rpc(
    "update_my_gym_exchange_sparring_rounds",
    { p_event_id: EVENT_ID, p_rounds: 3 }
  );
  assert(!updAErr, `A update failed: ${updAErr?.message}`);
  const rowA2 = Array.isArray(updA) ? updA[0] : updA;
  assert(rowA2?.sparring_rounds === 3, "A rounds=3");
  results.push({ case: "A update own rounds", pass: true });

  // duplicate join → same row
  const { data: joinA2, error: dupErr } = await clientA.rpc(
    "join_gym_exchange_participation",
    {
      p_event_id: EVENT_ID,
      p_nickname: "Alpha2",
      p_gym_name: "Gym A2",
    }
  );
  assert(!dupErr, `A re-join failed: ${dupErr?.message}`);
  const rowDup = Array.isArray(joinA2) ? joinA2[0] : joinA2;
  assert(rowDup?.id === rowA.id, "duplicate join must return same row id");
  assert(rowDup?.nickname === "Alpha", "re-join should keep original nickname");
  results.push({ case: "A duplicate join returns existing", pass: true });

  // negative rounds
  const { error: negErr } = await clientA.rpc(
    "update_my_gym_exchange_sparring_rounds",
    { p_event_id: EVENT_ID, p_rounds: -1 }
  );
  assert(negErr, "negative rounds should fail");
  results.push({ case: "A negative rounds", pass: true, detail: negErr.message });

  // spoof insert with other user_id
  const { data: spoofIns, error: spoofInsErr } = await clientA
    .from("dojo_gym_exchange_participations")
    .insert({
      event_id: `${EVENT_ID}-spoof`,
      user_id: "00000000-0000-4000-8000-000000000099",
      nickname: "Spoof",
      gym_name: "Nope",
    })
    .select("*");
  assert(spoofInsErr || !spoofIns?.length, "spoof user_id insert must fail");
  results.push({
    case: "A insert foreign user_id",
    pass: true,
    detail: spoofInsErr?.message || "empty",
  });

  // --- User B ---
  const clientB = memoryAuthClient();
  const uidB = await signInAnon(clientB, "B");
  assert(uidB !== uidA, "A and B must differ");

  const { data: joinB, error: joinBErr } = await clientB.rpc(
    "join_gym_exchange_participation",
    {
      p_event_id: EVENT_ID,
      p_nickname: "Beta",
      p_gym_name: "Gym B",
    }
  );
  assert(!joinBErr, `B join failed: ${joinBErr?.message}`);
  const rowB = Array.isArray(joinB) ? joinB[0] : joinB;
  assert(rowB?.user_id === uidB, "B user_id");
  results.push({ case: "B join", pass: true, id: rowB.id });

  // B tries to update A's row by id
  const { data: attackUpd, error: attackErr } = await clientB
    .from("dojo_gym_exchange_participations")
    .update({ sparring_rounds: 99 })
    .eq("id", rowA.id)
    .select("*");
  const attacked = Array.isArray(attackUpd) ? attackUpd : attackUpd ? [attackUpd] : [];
  assert(
    (attackErr || attacked.length === 0) &&
      !(attacked[0]?.sparring_rounds === 99),
    "B must not update A's row"
  );
  results.push({
    case: "B update A by id",
    pass: true,
    detail: attackErr?.message || `rows=${attacked.length}`,
  });

  // B tries update_my on A's event but own row only — updates B's row if any; verify A unchanged
  const { data: aCheck, error: aCheckErr } = await clientA
    .from("dojo_gym_exchange_participations")
    .select("sparring_rounds")
    .eq("id", rowA.id)
    .maybeSingle();
  assert(!aCheckErr, aCheckErr?.message);
  assert(aCheck?.sparring_rounds === 3, "A rounds must remain 3 after B attack");
  results.push({ case: "A rounds intact after B attack", pass: true });

  // B cannot select A's row
  const { data: peek, error: peekErr } = await clientB
    .from("dojo_gym_exchange_participations")
    .select("*")
    .eq("id", rowA.id)
    .maybeSingle();
  assert(!peek, `B must not read A's row (got ${JSON.stringify(peek)} / ${peekErr?.message})`);
  results.push({ case: "B cannot select A row", pass: true });

  console.log(JSON.stringify({ EVENT_ID, uidA, uidB, results }, null, 2));
  console.log("gym exchange participation RLS OK");
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
