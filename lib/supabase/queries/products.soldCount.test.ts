import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal fake of the supabase chain used by getAggregateSoldCount.
const mocks = {
  data: null as unknown,
  error: null as unknown,
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          then: async (resolve: (v: unknown) => unknown) =>
            resolve({ data: mocks.data, error: mocks.error }),
        }),
      }),
    }),
  }),
}));

import { getAggregateSoldCount } from "./products";

describe("getAggregateSoldCount", () => {
  beforeEach(() => {
    mocks.data = null;
    mocks.error = null;
  });

  it("sums sold_count across channels", async () => {
    mocks.data = [
      { sold_count: 21736 },
      { sold_count: 84 },
      { sold_count: null },
    ];
    await expect(getAggregateSoldCount("prod-1")).resolves.toBe(21820);
  });

  it("returns null when the table has no rows", async () => {
    mocks.data = [];
    await expect(getAggregateSoldCount("prod-1")).resolves.toBeNull();
  });

  it("returns null on query error (pre-migration table missing)", async () => {
    mocks.error = { message: 'relation "product_sold_counts" does not exist' };
    await expect(getAggregateSoldCount("prod-1")).resolves.toBeNull();
  });
});