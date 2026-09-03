import { describe, expect, it, vi } from "vitest";

// These modules only need their static metadata here. Avoid constructing a
// real Supabase client while importing their server-component default exports.
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import * as paymentPage from "./bayar/[bookingId]/page";
import * as managePage from "./manage/[token]/page";
import * as successPage from "./sukses/page";
import { expectSeo } from "@/lib/testing/seo";

describe("private /konsultasi route metadata", () => {
  it.each([
    ["payment", paymentPage, "Pembayaran Konsultasi"],
    ["manage", managePage, "Kelola Booking Konsultasi"],
    ["success", successPage, "Booking Konsultasi Terkonfirmasi"],
  ])("keeps %s noindex", (_route, page, title) => {
    expectSeo(page, { title, noindex: true });
    expect(page.metadata?.robots).toMatchObject({ index: false, follow: false });
  });
});
