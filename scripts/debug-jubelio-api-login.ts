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

async function tryLogin(base: string, path: string) {
  const url = `${base}${path}`;
  console.log(`\n>>> POST ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.JUBELIO_EMAIL,
        password: process.env.JUBELIO_PASSWORD,
      }),
    });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Body (first 300): ${text.slice(0, 300)}`);
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        if (data.token) {
          console.log(`   ✅ LOGIN SUCCESS - token: ${data.token.slice(0, 20)}...`);
          return data.token;
        }
      } catch {}
    }
    return null;
  } catch (err) {
    console.log(`   Error: ${err}`);
    return null;
  }
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
  console.log("Trying different login URLs...\n");

  // Try multiple login endpoints
  let token = await tryLogin("https://api.jubelio.com", "/login");
  if (!token) token = await tryLogin("https://api.jubelio.com", "/api/login");
  if (!token) token = await tryLogin("https://api.jubelio.com", "/v2/login");
  if (!token) token = await tryLogin("https://api.jubelio.com", "/api2/login");
  
  if (!token) {
    console.log("\n❌ Could not login to api.jubelio.com. Trying with api2 token...");
    // Maybe api.jubelio.com accepts api2 tokens?
    const api2Token = await tryLogin("https://api2.jubelio.com", "/login");
    if (api2Token) {
      console.log("\nUsing api2 token on api.jubelio.com endpoints...");
      await tryEndpoint(api2Token, "https://api.jubelio.com", "/inventory/item-bundles/?page=1&pageSize=50");
    }
    return;
  }

  console.log("\n✅ Logged in to api.jubelio.com, probing bundle endpoint...");

  const data = await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/?page=1&pageSize=50");
  
  if (data && data.data) {
    console.log(`\n>>> Found ${data.data.length} bundles`);
  }

  // Also try search
  await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/?q=PJ-BK-SM-CDSSTDGAY&pageSize=50");
  await tryEndpoint(token, "https://api.jubelio.com", "/inventory/item-bundles/1480");
}

main().catch(console.error);
