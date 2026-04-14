/** Pivot Payment API client with module-level token caching. */

const PIVOT_API_URL = process.env.PIVOT_API_URL ?? "https://api.pivot-payment.com";
const PIVOT_MERCHANT_ID = process.env.PIVOT_MERCHANT_ID ?? "";
const PIVOT_MERCHANT_SECRET = process.env.PIVOT_MERCHANT_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";

// ─── Token cache ─────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getPivotToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - now > 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(`${PIVOT_API_URL}/v1/access-token`, {
    method: "POST",
    headers: {
      "X-MERCHANT-ID": PIVOT_MERCHANT_ID,
      "X-MERCHANT-SECRET": PIVOT_MERCHANT_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grantType: "client_credentials" }),
  });
  if (!res.ok) {
    throw new Error(`Pivot token fetch failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(`Pivot token error: ${json.message}`);
  }
  const expiresInMs = parseInt(json.data.expiresIn, 10) * 1000; // 900s → ms
  tokenCache = { token: json.data.accessToken, expiresAt: now + expiresInMs };
  return tokenCache.token;
}

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

/** Strip country prefix so Pivot's phoneNumber.number field gets bare digits. */
export function formatPhoneForPivot(phone: string): { countryCode: string; number: string } {
  let number = phone.trim();
  if (number.startsWith("+62")) number = number.slice(3);
  else if (number.startsWith("62") && number.length > 10) number = number.slice(2);
  else if (number.startsWith("0")) number = number.slice(1);
  return { countryCode: "+62", number };
}

/**
 * Build a Pivot-compatible X-REQUEST-ID: alphanumeric, 16–36 chars.
 * An optional suffix (e.g. a timestamp string) makes refresh calls unique.
 */
export function buildRequestId(orderId: string, suffix = ""): string {
  const base = orderId.replace(/-/g, ""); // 32 alphanumeric chars from UUID
  return (base + suffix).replace(/[^a-zA-Z0-9]/g, "").slice(0, 36);
}

// ─── API calls ────────────────────────────────────────────────────────────────

export interface CreateQrisSessionParams {
  orderId: string;
  orderNumber: string;
  total: number; // IDR, integer
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
}

export interface QrisSessionResult {
  paymentSessionId: string;
  qrUrl: string;
  qrString: string; // raw EMVCO QRIS string for client-side QR rendering
  qrExpiresAt: string; // ISO 8601
}

export async function createQrisPaymentSession(
  params: CreateQrisSessionParams,
  requestIdSuffix = ""
): Promise<QrisSessionResult> {
  const token = await getPivotToken();
  const { orderId, orderNumber, total, customerName, customerEmail, customerPhone } = params;
  const phone = formatPhoneForPivot(customerPhone);

  const expiryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now

  const body = {
    clientReferenceId: orderId.replace(/-/g, "").slice(0, 36),
    amount: { value: total, currency: "IDR" },
    paymentType: "SINGLE",
    paymentMethod: { type: "QR" },
    paymentMethodOptions: { qr: { expiryAt } },
    mode: "API",
    redirectUrl: {
      successReturnUrl: `${APP_URL}/checkout/success?order=${orderId}`,
      failureReturnUrl: `${APP_URL}/checkout?error=payment_failed`,
      expirationReturnUrl: `${APP_URL}/checkout/payment/${orderId}`,
    },
    customer: {
      givenName: customerName,
      ...(customerEmail ? { email: customerEmail } : {}),
      phoneNumber: phone,
    },
    autoConfirm: true,
    statementDescriptor: orderNumber,
  };

  const res = await fetch(`${PIVOT_API_URL}/v2/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-REQUEST-ID": buildRequestId(orderId, requestIdSuffix),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pivot create session failed ${res.status}: ${err}`);
  }
  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(`Pivot session error: ${json.message}`);
  }

  const data = json.data;
  const qr = data.chargeDetails?.[0]?.qr;
  if (!qr?.qrUrl) {
    throw new Error("Pivot response missing QR URL");
  }

  // Raw QRIS EMVCO string — try common field names from Pivot/Bank Neo API
  const qrString: string = qr.qrString ?? qr.qrContent ?? qr.content ?? "";
  if (!qrString) {
    console.warn("Pivot response missing raw QR string — available qr fields:", Object.keys(qr));
  }

  return {
    paymentSessionId: data.id,
    qrUrl: qr.qrUrl,
    qrString,
    qrExpiresAt: qr.expiryAt,
  };
}
