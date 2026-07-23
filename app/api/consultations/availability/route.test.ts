import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockIn = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ select: mockSelect }),
  }),
}));

import { GET } from "./route";

describe("GET /api/consultations/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ in: mockIn });
    mockIn.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });
  });

  it("returns dates with slots, taken slots unavailable", async () => {
    mockLte.mockResolvedValue({
      data: [{ booking_date: "2026-07-28", time_slot: "11:00" }],
      error: null,
    });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(json.dates)).toBe(true);
    for (const d of json.dates) {
      expect(d.slots).toHaveLength(3);
    }
  });

  it("returns 500 on db error", async () => {
    mockLte.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
