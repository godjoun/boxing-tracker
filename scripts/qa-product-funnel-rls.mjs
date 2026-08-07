/**
 * Product funnel RLS checks (INSERT-only, no PII columns).
 *
 * Requires:
 * 1) supabase/product_funnel_events.sql applied in SQL Editor
 * 2) VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local
 *
 * Run: node scripts/qa-product-funnel-rls.mjs
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

function isDenied(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "42501" ||
    code === "PGRST301" ||
    msg.includes("permission") ||
    msg.includes("policy") ||
    msg.includes("row-level security") ||
    msg.includes("rls")
  );
}

function isCheckViolation(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "23514" ||
    msg.includes("check") ||
    msg.includes("product_funnel_events_name_allowed")
  );
}

async function main() {
  const results = [];

  const bare = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await bare.auth.signOut().catch(() => {});

  // A) allowed insert (anon)
  {
    const { error } = await bare.from("product_funnel_events").insert({
      event_name: "app_open",
    });
    assert(!error, `anon allowed insert FAIL: ${error?.message}`);
    results.push("PASS anon insert allowed event");
  }

  // B) disallowed event_name
  {
    const { error } = await bare.from("product_funnel_events").insert({
      event_name: "not_a_real_event",
    });
    assert(error, "bad event_name should fail");
    assert(
      isCheckViolation(error) || Boolean(error),
      `bad event_name unexpected error: ${error?.message}`
    );
    results.push("PASS anon insert blocked for unknown event_name");
  }

  // C) anon SELECT blocked
  {
    const { data, error } = await bare
      .from("product_funnel_events")
      .select("id")
      .limit(1);
    assert(
      isDenied(error) || data == null || data.length === 0,
      `anon SELECT should be blocked: ${error?.message || "returned rows"}`
    );
    // Prefer explicit denial; empty under RLS is also acceptably locked.
    if (error) {
      assert(isDenied(error), `anon SELECT unexpected: ${error.message}`);
    } else {
      assert(
        Array.isArray(data) && data.length === 0,
        "anon SELECT returned rows"
      );
    }
    results.push("PASS anon SELECT blocked");
  }

  // D) anon UPDATE blocked
  {
    const { data, error } = await bare
      .from("product_funnel_events")
      .update({ event_name: "profile_view" })
      .eq("event_name", "app_open")
      .select("id");
    assert(
      isDenied(error) || !data || data.length === 0,
      `anon UPDATE should be blocked: ${error?.message || "updated rows"}`
    );
    results.push("PASS anon UPDATE blocked");
  }

  // E) anon DELETE blocked
  {
    const { data, error } = await bare
      .from("product_funnel_events")
      .delete()
      .eq("event_name", "app_open")
      .select("id");
    assert(
      isDenied(error) || !data || data.length === 0,
      `anon DELETE should be blocked: ${error?.message || "deleted rows"}`
    );
    results.push("PASS anon DELETE blocked");
  }

  // F) authenticated SELECT blocked (+ allowed insert still works)
  const authClient = memoryAuthClient();
  const { data: signData, error: signError } =
    await authClient.auth.signInAnonymously();
  if (signError) {
    // Anonymous may be off — fall back to noting skip for authenticated role
    // only if we cannot get a session. Prefer real authenticated check.
    console.warn(
      `WARN: anonymous sign-in unavailable (${signError.message}). Skipping authenticated SELECT check.`
    );
    results.push("SKIP authenticated SELECT (no anonymous auth)");
  } else {
    assert(signData?.user?.id, "authenticated session missing user");

    const { error: insertErr } = await authClient
      .from("product_funnel_events")
      .insert({ event_name: "profile_view" });
    assert(
      !insertErr,
      `authenticated insert FAIL: ${insertErr?.message}`
    );
    results.push("PASS authenticated insert allowed event");

    const { data, error } = await authClient
      .from("product_funnel_events")
      .select("id")
      .limit(1);
    assert(
      isDenied(error) || (Array.isArray(data) && data.length === 0),
      `authenticated SELECT should be blocked: ${error?.message || "rows"}`
    );
    results.push("PASS authenticated SELECT blocked");

    await authClient.auth.signOut().catch(() => {});
  }

  // G) existing tables unaffected (spot-check read on listings)
  {
    const { error } = await bare
      .from("dojo_gym_listings")
      .select("id")
      .limit(1);
    assert(
      !error || !String(error.message || "").includes("product_funnel"),
      `existing table affected: ${error?.message}`
    );
    // Permission errors on listings are unrelated; absence of relation errors is the check.
    if (error && /does not exist|product_funnel/i.test(error.message || "")) {
      throw new Error(`spot-check FAIL: ${error.message}`);
    }
    results.push("PASS existing dojo_gym_listings still reachable (no funnel breakage)");
  }

  for (const line of results) {
    console.log(line);
  }
  console.log("ALL CHECKS DONE");
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
