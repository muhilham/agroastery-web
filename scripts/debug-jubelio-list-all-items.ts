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

const JUBELIO_BASE = "https://api2.jubelio.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${JUBELIO_BASE}/login`, {
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

  console.log("Fetching ALL Jubelio inventory items...\n");

  let page = 1;
  const pageSize = 100;
  const allVariants: Array<{ item_id: number; item_code: string; item_name: string; group_name: string }> = [];

  while (page <= 20) {
    const res = await fetch(
      `${JUBELIO_BASE}/inventory/items/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: token } }
    );

    if (!res.ok) {
      console.error(`Page ${page} failed: ${res.status}`);
      break;
    }

    const data = await res.json();
    const groups = data.data ?? [];

    if (groups.length === 0) break;

    for (const group of groups) {
      if (group.variants) {
        for (const v of group.variants) {
          allVariants.push({
            item_id: v.item_id,
            item_code: v.item_code || "(no code)",
            item_name: v.item_name || group.item_name,
            group_name: group.item_name,
          });
        }
      }
    }

    console.log(`Page ${page}: ${groups.length} groups`);
    page++;
  }

  console.log(`\n========== ALL JUBELIO ITEMS (${allVariants.length} variants) ==========\n`);

  // Sort by item_id for easier reading
  allVariants.sort((a, b) => a.item_id - b.item_id);

  for (const v of allVariants) {
    console.log(`${v.item_id}\t${v.item_code}\t${v.item_name}`);
  }

  console.log(`\n========== END (${allVariants.length} variants) ==========`);
}

main().catch(console.error);
