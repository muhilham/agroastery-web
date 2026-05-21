import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

async function getToken(base: string): Promise<string> {
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.JUBELIO_EMAIL,
      password: process.env.JUBELIO_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Jubelio login failed at ${base}: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function tryEndpoint(token: string, base: string, path: string) {
  const url = `${base}${path}`;
  console.log(`\n>>> GET ${url}`);
  try {
    const res = await fetch(url, { headers: { Authorization: token } });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`   Response (first 2000 chars):`);
        console.log(JSON.stringify(data, null, 2).slice(0, 2000));
        return data;
      } catch {
        console.log(`   Body: ${text.slice(0, 500)}`);
      }
    } else {
      console.log(`   Body: ${text.slice(0, 500)}`);
    }
    return null;
  } catch (err) {
    console.log(`   Error: ${err}`);
    return null;
  }
}

async function main() {
  console.log("Testing api.jubelio.com inventory/item-bundles...\n");

  const token = await getToken("https://api.jubelio.com");

  // Try the endpoint the user suggested
  const data = await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/?page=1&pageSize=50");

  if (data && data.data && data.data.length > 0) {
    console.log(`\n\n>>> SUCCESS! Found ${data.totalCount ?? data.data.length} bundles`);
    console.log("\nFirst bundle keys:", Object.keys(data.data[0]));
    console.log("\nAll bundles:");
    data.data.forEach((b: Record<string, unknown>) => {
      console.log(`  - ${b.item_name ?? b.name} (id=${b.item_group_id ?? b.item_id}, code=${b.item_code ?? "N/A"})`);
      if (b.variants) {
        (b.variants as Array<Record<string, unknown>>).forEach((v) => {
          console.log(`      variant: code=${v.item_code}, id=${v.item_id}`);
        });
      }
      if (b.compositions) {
        console.log(`      compositions: ${JSON.stringify(b.compositions).slice(0, 200)}`);
      }
    });
  } else {
    console.log("\n>>> No bundles found or endpoint not working");
  }

  // Also try with search
  console.log("\n\n--- Trying with SKU search ---");
  await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/?q=PJ-BK-SM-CDSSTDGAY&pageSize=50");

  // Try detail endpoint
  console.log("\n\n--- Trying detail endpoint ---");
  await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/1480");
}

main().catch(console.error);
