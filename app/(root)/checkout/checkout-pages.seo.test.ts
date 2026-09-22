/**
 * /checkout/* + /cart SEO regression tests (issue #177).
 *
 * /checkout/success?order=... was indexed by Google; every checkout route
 * (and /cart, re-verified from the earlier audit) must render
 * `noindex, follow`.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import * as checkoutPage from "./page";
import * as paymentPage from "./payment/[orderId]/page";
import * as successPage from "./success/page";
import * as cartPage from "../cart/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

describe("checkout + cart metadata — object level", () => {
  it.each([
    ["/checkout", checkoutPage],
    ["/checkout/payment/[orderId]", paymentPage],
    ["/checkout/success", successPage],
    ["/cart (re-verify)", cartPage],
  ])("keeps %s noindex, follow", (_route, page) => {
    expectSeo(page, { noindex: true });
    expect(page.metadata?.robots).toMatchObject({ index: false, follow: true });
  });
});

describe("checkout metadata — rendered tags", () => {
  it.each([
    ["/checkout", [], "/checkout", checkoutPage],
    [
      "/checkout/payment/{id}",
      ["checkout", "payment", "[orderId]"],
      "/checkout/payment/abc",
      paymentPage,
    ],
    [
      "/checkout/success",
      ["checkout", "success"],
      "/checkout/success?order=abc",
      successPage,
    ],
  ])("renders robots noindex, follow on %s", async (_label, segments, pathname, page) => {
    const { document } = await renderMetaTags(rootLayout, page, {
      segments,
      pathname,
    });
    const robots = document
      .querySelector('meta[name="robots"]')
      ?.getAttribute("content");
    expect(robots).toMatch(/noindex/i);
    expect(robots).toMatch(/follow/i);
  });
});
