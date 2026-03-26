const XENDIT_BASE_URL = "https://api.xendit.co";

type XenditInvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  category?: string;
};

type CreateInvoiceParams = {
  externalId: string;
  amount: number;
  payerEmail?: string;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  items?: XenditInvoiceItem[];
  invoiceDuration?: number; // seconds, default 86400 (24h)
};

type XenditInvoice = {
  id: string;
  external_id: string;
  invoice_url: string;
  status: string;
  amount: number;
  expiry_date: string;
};

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  const apiKey = process.env.XENDIT_SECRET_KEY;

  if (!apiKey || process.env.XENDIT_MOCK === "true") {
    console.warn("[Xendit] Running in MOCK mode — no real invoice created");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      id: `mock_${params.externalId}`,
      external_id: params.externalId,
      invoice_url: `${appUrl}/checkout/success?order=${params.externalId}&mock=true`,
      status: "PENDING",
      amount: params.amount,
      expiry_date: new Date(Date.now() + 86400_000).toISOString(),
    };
  }

  const credentials = Buffer.from(`${apiKey}:`).toString("base64");

  const body: Record<string, unknown> = {
    external_id: params.externalId,
    amount: params.amount,
    invoice_duration: params.invoiceDuration ?? 86400,
    currency: "IDR",
  };

  if (params.description) body.description = params.description;
  if (params.payerEmail) body.payer_email = params.payerEmail;
  if (params.successRedirectUrl) body.success_redirect_url = params.successRedirectUrl;
  if (params.failureRedirectUrl) body.failure_redirect_url = params.failureRedirectUrl;
  if (params.items && params.items.length > 0) body.items = params.items;

  if (params.customerName || params.customerPhone) {
    body.customer = {
      given_names: params.customerName ?? undefined,
      mobile_number: params.customerPhone ?? undefined,
    };
  }

  const res = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xendit API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<XenditInvoice>;
}
