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

import { fetchJubelioItemBySku } from "@/lib/jubelio/client";

const SKU = "PJ-BK-SM-CDSSTDGAY";

async function main() {
  console.log(`Testing updated fetchJubelioItemBySku for SKU: ${SKU}\n`);
  const result = await fetchJubelioItemBySku(SKU);
  if (result) {
    console.log("✅ Found:", result);
  } else {
    console.log("❌ Not found");
  }
}

main().catch(console.error);
