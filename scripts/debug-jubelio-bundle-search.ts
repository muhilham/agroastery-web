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

const API2_BASE = "https://api2.jubelio.com";
const API_BASE = "https://api.jubelio.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${API2_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.JUBELIO_EMAIL,
      password: process.env.JUBELIO_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Jubelio login failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function main() {
  const token = await getToken();

  console.log("Testing bundle search for PJ-BK-SM-CDSSTDGAY...\n");

  const res = await fetch(
    `${API_BASE}/inventory/item-bundles/?q=${encodeURIComponent("PJ-BK-SM-CDSSTDGAY")}&pageSize=50`,
    { headers: { Authorization: token } }
  );

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", JSON.stringify(data, null, 2).slice(0, 3000));

  if (data.data && data.data.length > 0) {
    for (const group of data.data) {
      console.log(`\nGroup: ${group.item_name} (id=${group.item_group_id})`);
      if (group.variants) {
        for (const v of group.variants) {
          console.log(`  variant: code="${v.item_code}", id=${v.item_id}, is_bundle=${v.is_bundle}`);
          if (v.item_code === "PJ-BK-SM-CDSSTDGAY") {
            console.log(`  >>>>> FOUND! item_id=${v.item_id}`);
          }
        }
      }
    }
  }
}

main().catch(console.error);
