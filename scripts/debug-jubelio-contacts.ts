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

  console.log("Fetching Jubelio contacts...\n");

  const res = await fetch(
    `${JUBELIO_BASE}/contacts/?page=1&pageSize=100`,
    { headers: { Authorization: token } }
  );

  if (!res.ok) {
    console.error(`Failed: ${res.status}`);
    const text = await res.text();
    console.error(text);
    return;
  }

  const data = await res.json();
  const contacts = data.data ?? [];

  console.log(`Found ${contacts.length} contacts`);

  // Look for generic / default customer
  contacts.forEach((c: Record<string, unknown>) => {
    const name = String(c.contact_name ?? c.name ?? "").toLowerCase();
    if (name.includes("pelanggan") || name.includes("umum") || name.includes("customer") || name.includes("general")) {
      console.log(`\n>>> Generic customer found:`);
      console.log(JSON.stringify(c, null, 2));
    }
  });

  // Also print first 5 for reference
  console.log("\n--- First 5 contacts ---");
  contacts.slice(0, 5).forEach((c: Record<string, unknown>, i: number) => {
    console.log(`[${i}] contact_id=${c.contact_id}, name="${c.contact_name ?? c.name}"`);
  });
}

main().catch(console.error);
