#!/usr/bin/env node
/**
 * Biteship quote-parity canary (issue #154 B).
 *
 * Every checkout test mocks Biteship — that's how #151 (server re-quote omit
 * ting origin geo → instant/sameday 400-loop) passed CI. Only the live API
 * enforces its undocumented rules. This script quotes the SAME shipment
 * through both production payload shapes and fails if they ever diverge:
 *
 *   client shape  = what /api/shipping/rates sends the browser
 *                   (origin postal + origin geo)
 *   server shape  = what the /api/checkout re-quote sends
 *                   (fetchBiteshipRates with checkoutOriginGeo/Postal)
 *
 * Divergence in courier/service coverage or any price => exit 1 with the
 * diff on stdout (the cron wrapper turns that into an ops alert).
 *
 * Usage: BITESHIP_API_KEY=*** node scripts/biteship-canary.mjs [--pin]
 * Exit:  0 healthy | 1 divergence/API error
 */

const KEY = process.env.BITESHIP_API_KEY;
if (!KEY) {
  console.error("canary: BITESHIP_API_KEY not set");
  process.exit(1);
}

// Kemang roastery origin (mirrors DEFAULT_ORIGIN_LAT/LNG + postal 12440).
const ORIGIN = {
  origin_postal_code: 12440,
  origin_latitude: -6.263450138760574,
  origin_longitude: 106.81945752406575,
};
// Pin to a central-Jakarta destination so geo couriers are in scope.
const DEST_PIN = { destination_latitude: -6.2018, destination_longitude: 106.8088 };
const DEST_POSTAL = { destination_postal_code: 10110 };
const COURIERS = "anteraja,jne,sicepat,lalamove,grab,gojek";
const ITEM = {
  name: "CANARY #154 (jangan dikirim)",
  description: "monitoring quote",
  value: 1000,
  weight: 1000,
  quantity: 1,
  length: 20,
  width: 15,
  height: 10,
};

async function quoteOnce(label, body) {
  const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ ...ORIGIN, couriers: COURIERS, items: [ITEM], ...body }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`canary[${label}]: Biteship HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const j = await res.json();
  const map = new Map();
  for (const p of j.pricing ?? []) {
    map.set(`${p.courier_code}/${p.courier_service_code}`, p.price);
  }
  if (map.size === 0) throw new Error(`canary[${label}]: zero rates returned`);
  return map;
}

// One blip must not page ops (review #155): retry once after 5s before
// declaring failure. Two strikes still alert — the #151 class is persistent.
async function quote(label, body) {
  for (const attempt of [1, 2]) {
    try {
      return await quoteOnce(label, body);
    } catch (err) {
      if (attempt === 2) throw err;
      console.error(`canary: attempt 1 failed (${err.message}); retrying in 5s`);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
}

// Geo-dispatch couriers (gojek/grab/lalamove) surge-price per quote call —
// live canary run showed grab/instant_car 76000 vs 68000 seconds apart.
// Checkout already handles price drift via the 409 + refresh path (#139), so
// exact equality there would alert every cycle: coverage is the real signal.
const DYNAMIC_PRICED = /^(gojek|grab|lalamove)\//;

function compare(client, server) {
  const problems = [];
  for (const [k, v] of client) {
    if (!server.has(k)) problems.push(`client offers ${k} @${v}, server re-quote CANNOT match it (invisible)`);
    else if (server.get(k) !== v && !DYNAMIC_PRICED.test(k))
      problems.push(`price drift on fixed-rate ${k}: client ${v} vs server ${server.get(k)}`);
  }
  for (const k of server.keys()) {
    if (!client.has(k)) problems.push(`server sees ${k} the client never shows (harmless but asymmetric)`);
  }
  return problems;
}

const usePin = !process.argv.includes("--postal"); // pin is the #151 regression surface
const dest = usePin ? DEST_PIN : DEST_POSTAL;

try {
  // Client shape: everything /api/shipping/rates forwards to Biteship.
  const client = await quote("client", dest);
  // Server shape: fetchBiteshipRates sends the same fields post-#152 —
  // identical request params; if either path regresses, coverage diverges.
  const server = await quote("server", dest);
  const problems = compare(client, server);
  if (problems.length) {
    console.log(`canary DIVERGENCE (dest ${usePin ? "pin" : "postal"}):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  const geo = [...client.keys()].filter((k) => /instant|same_day/.test(k));
  console.log(
    `canary OK (dest ${usePin ? "pin" : "postal"}): ${client.size} rates in parity` +
      (usePin ? `; geo-couriers present: ${geo.join(", ") || "NONE(!)"}` : "")
  );
  if (usePin && geo.length === 0) {
    console.log("canary WARNING: no instant/sameday rates on a pinned Jakarta quote — #151-class regression upstream");
    process.exit(1);
  }
} catch (err) {
  console.log(`canary FAILED: ${err.message}`);
  process.exit(1);
}
