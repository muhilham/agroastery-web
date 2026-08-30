import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFetch,
  mockInsert,
  mockFrom,
  mockCreateSupabaseAdminClient,
} = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockCreateSupabaseAdminClient = vi.fn(() => ({ from: mockFrom }));

  return { mockFetch, mockInsert, mockFrom, mockCreateSupabaseAdminClient };
});

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: mockCreateSupabaseAdminClient,
}));

import { sendOpsAlert } from "./opsAlert";

describe("sendOpsAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "tok";
    process.env.TELEGRAM_CHAT_ID = "chat";
    delete process.env.TELEGRAM_PRODUCTION_THREAD_ID;

    mockFetch.mockResolvedValue({ ok: true });
    mockInsert.mockResolvedValue({});
  });

  it("sends ops alert with issue and action", async () => {
    await sendOpsAlert({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      issue: "BITESHIP GAGAL",
      action: "Cek dashboard",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("chat");
    expect(body.text).toContain("Ops Alert");
    expect(body.text).toContain("AGR-001");
    expect(body.text).toContain("BITESHIP GAGAL");
    expect(body.text).toContain("Cek dashboard");
  });

  it("sends ops alert without action when omitted", async () => {
    await sendOpsAlert({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      issue: "BITESHIP BERHASIL",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).not.toContain("Tindakan:");
  });

  it("logs to notification_logs with channel ops", async () => {
    await sendOpsAlert({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      issue: "BITESHIP GAGAL",
    });

    expect(mockInsert).toHaveBeenCalledOnce();
    const logEntry = mockInsert.mock.calls[0][0];
    expect(logEntry.channel).toBe("ops");
    expect(logEntry.order_number).toBe("AGR-001");
    expect(logEntry.status).toBe("sent");
  });
});
