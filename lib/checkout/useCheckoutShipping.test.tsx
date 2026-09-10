import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useCheckoutShipping } from "./useCheckoutShipping";

import { CHECKOUT_COURIERS_POSTAL, CHECKOUT_COURIERS_GEO } from "./shippingQuote";
import type { TForm } from "@/app/(root)/checkout/checkoutSchemas";
import type { CartItem } from "@/lib/stores/cart";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// debounce is 800ms; outlast it with margin, inside act() so the settle's
// setState (loading flags, rates) is flushed before assertions
const settleDebounce = () => act(async () => { await sleep(950); });

const cartItem = (over: Partial<CartItem> = {}): CartItem => ({
  variantId: "v1",
  productSlug: "s",
  productName: "Kopi Gayo",
  variantDescription: "250g",
  unitPrice: 100000,
  originalPrice: 100000,
  quantity: 1,
  shipWeightGrams: 250,
  image: "/x.png",
  ...over,
});

const rateJson = (price = 12000) => ({
  ok: true,
  json: async () => ({
    success: true,
    pricing: [
      {
        courier_name: "JNE",
        courier_code: "jne",
        courier_service_name: "REG",
        courier_service_code: "reg",
        price,
        duration: "2 - 3 days",
        currency: "IDR",
      },
    ],
  }),
});

function harness(opts: {
  defaultValues?: Partial<TForm>;
  cartItems?: CartItem[];
  quoteGateOpen?: boolean;
}) {
  // stable reference: a fresh array per render would churn quoteItems and
  // re-trigger the quote effect forever
  const cart = opts.cartItems ?? [cartItem()];
  const { result } = renderHook(() => {
    const form = useForm<TForm>({
      defaultValues: {
        fullName: "",
        phone: "",
        fulfillmentMethod: "delivery",
        ...opts.defaultValues,
      } as TForm,
    });
    const api = useCheckoutShipping({
      control: form.control,
      cartItems: cart,
      quoteGateOpen: opts.quoteGateOpen ?? true,
      getValues: () => {
        const [postalCode, lat, lng] = form.getValues(["postalCode", "lat", "lng"]);
        return { postalCode, lat, lng };
      },
    });
    return { form, ...api };
  });
  return result;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("useCheckoutShipping — postal quoting", () => {
  it("waits out the debounce, then quotes with CHECKOUT_COURIERS_POSTAL and per-line items", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const result = harness({
      defaultValues: { postalCode: "40115" },
      cartItems: [cartItem(), cartItem({ variantId: "v2", quantity: 2, shipWeightGrams: 500 })],
    });

    // useDebounce lazy-initializes, so the mount value quotes after one
    // debounce window; further re-renders must NOT stack calls (coalescing)
    await settleDebounce();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await sleep(300);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.origin_postal_code).toBe(Number(process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440"));
    expect(body.destination_postal_code).toBe(40115);
    expect(body.couriers).toBe(CHECKOUT_COURIERS_POSTAL);
    // issue #138 shape: 2 lines, qty collapsed to 1, totalized weight
    expect(body.items).toHaveLength(2);
    expect(body.items.map((i: { quantity: number }) => i.quantity)).toEqual([1, 1]);
    expect(body.items.map((i: { weight: number }) => i.weight)).toEqual([250, 1000]);

    await waitFor(() => expect(result.current.shippingRates).toHaveLength(1));
    expect(result.current.shippingRates[0].price).toBe(12000);
  });

  it("ignores sub-5-digit postal codes and keeps rates empty", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const result = harness({ defaultValues: { postalCode: "4011" } });

    await settleDebounce();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.shippingRates).toEqual([]);
  });

  it("does not quote while the address gate is closed", async () => {
    harness({ defaultValues: { postalCode: "40115" }, quoteGateOpen: false });
    await settleDebounce();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("empty cart never quotes", async () => {
    harness({ defaultValues: { postalCode: "40115" }, cartItems: [] });
    await settleDebounce();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("useCheckoutShipping — geo quoting", () => {
  it("prefers geo when a map pin is present, using CHECKOUT_COURIERS_GEO", async () => {
    mockFetch.mockResolvedValue(rateJson());
    harness({ defaultValues: { postalCode: "40115", lat: -6.9, lng: 107.6 } });

    await settleDebounce();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.destination_latitude).toBe(-6.9);
    expect(body.destination_longitude).toBe(107.6);
    expect(body.destination_postal_code).toBeUndefined();
    expect(body.couriers).toBe(CHECKOUT_COURIERS_GEO);
  });
});

describe("useCheckoutShipping — cart-change re-quote", () => {
  it("re-quotes when cart contents change while destination stays", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const { rerender } = renderHook(
      ({ cart }: { cart: CartItem[] }) => {
        const form = useForm<TForm>({
          defaultValues: { fullName: "", phone: "", fulfillmentMethod: "delivery", postalCode: "40115" } as TForm,
        });
        return useCheckoutShipping({
          control: form.control,
          cartItems: cart,
          quoteGateOpen: true,
          getValues: () => {
            const [postalCode, lat, lng] = form.getValues(["postalCode", "lat", "lng"]);
            return { postalCode, lat, lng };
          },
        });
      },
      { initialProps: { cart: [cartItem()] } }
    );

    await settleDebounce();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // buyer adds a second line: quoteItems identity changes → re-quote
    rerender({ cart: [cartItem(), cartItem({ variantId: "v2", quantity: 2 })] });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2), { timeout: 3000 });
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.items).toHaveLength(2);
  });
});

describe("useCheckoutShipping — drift refresh (409 path)", () => {
  it("clears the stale selection and re-quotes geo when pinned", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const geo = harness({ defaultValues: { postalCode: "40115", lat: -6.9, lng: 107.6 } });

    await settleDebounce();
    await waitFor(() => expect(geo.current.shippingRates).toHaveLength(1));
    await act(async () => {
      geo.current.setSelectedShipping(geo.current.shippingRates[0]);
    });

    const before = mockFetch.mock.calls.length;
    act(() => {
      geo.current.refreshAfterDrift();
    });
    expect(geo.current.selectedShipping).toBeNull();
    await waitFor(() => expect(mockFetch.mock.calls.length).toBe(before + 1));
    const last = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
    expect(last.destination_latitude).toBe(-6.9);
  });

  it("postal fallback branch re-quotes the submitted code", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const postal = harness({ defaultValues: { postalCode: "40115" } });
    await settleDebounce();
    await waitFor(() => expect(postal.current.shippingRates).toHaveLength(1));

    const before = mockFetch.mock.calls.length;
    act(() => {
      postal.current.refreshAfterDrift();
    });
    await waitFor(() => expect(mockFetch.mock.calls.length).toBe(before + 1));
    const last = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
    expect(last.destination_postal_code).toBe(40115);
  });
});

describe("useCheckoutShipping — quoteForAddress", () => {
  const addr = (over: Record<string, unknown>) => ({
    id: "a1",
    recipient_name: "Budi",
    phone: "+6281234567890",
    address_line: "Jl. X No 1",
    postal_code: "40115",
    latitude: null,
    longitude: null,
    is_default: true,
    created_at: "",
    ...over,
  });

  it("geo-first, postal-next for saved addresses", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const result = harness({ quoteGateOpen: false });

    await act(async () => {
      result.current.quoteForAddress(addr({ latitude: -6.91, longitude: 107.6 }) as never);
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    let body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.destination_latitude).toBe(-6.91);

    mockFetch.mockClear();
    await act(async () => {
      result.current.quoteForAddress(addr({ postal_code: "40116" }) as never);
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.destination_postal_code).toBe(40116);
  });

  it("does nothing for an address with neither geo nor postal", async () => {
    mockFetch.mockResolvedValue(rateJson());
    const result = harness({ quoteGateOpen: false });
    await act(async () => {
      result.current.quoteForAddress(addr({ postal_code: null }) as never);
    });
    await settleDebounce();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
