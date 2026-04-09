const JUBELIO_BASE = "https://api2.jubelio.com";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

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
  if (!data.token) throw new Error(`Jubelio login: no token in response`);

  cachedToken = data.token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min (token expires in 1h)
  return cachedToken!;
}

export type JubelioVariant = {
  item_id: number;
  item_code: string;
  item_name: string;
  variation_values: string | null;
  sell_price: number | string | null;
  available_qty: number | null;
};

export type JubelioProductGroup = {
  item_group_id: number;
  item_name: string;
  variations: string | null;
  item_category_id: number;
  thumbnail: string | null;
  variants: JubelioVariant[];
};

export type JubelioProductDetail = {
  item_group_id: number;
  item_group_name: string;
  description: string | null;
  package_weight: string | null; // grams, e.g. "150.0000"
  variations: string | null;     // e.g. "Grind" or null
};

export async function fetchAllJubelioProducts(): Promise<JubelioProductGroup[]> {
  const token = await getToken();
  const all: JubelioProductGroup[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const res = await fetch(
      `${JUBELIO_BASE}/inventory/items/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: token } }
    );
    if (!res.ok) throw new Error(`Jubelio items fetch failed: ${res.status}`);

    const data = await res.json();
    const items: JubelioProductGroup[] = data.data ?? [];
    all.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return all;
}

export async function fetchJubelioProductDetail(
  itemGroupId: number
): Promise<JubelioProductDetail> {
  const token = await getToken();
  const res = await fetch(`${JUBELIO_BASE}/inventory/items/group/${itemGroupId}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`Jubelio item detail failed for ${itemGroupId}: ${res.status}`);
  return res.json();
}
