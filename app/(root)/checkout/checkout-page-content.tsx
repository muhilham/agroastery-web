"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { numberToIdr } from "@/lib/numberToIdr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { trackBeginCheckout } from "@/lib/analytics/gtag";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAddresses } from "@/lib/hooks/useAddresses";
import type { Address } from "@/lib/hooks/useAddresses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { guestFormSchema, loggedInFormSchema, type TForm } from "./checkoutSchemas";
import OrderSummary from "@/components/checkout/OrderSummary";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import ShippingSelector from "@/components/checkout/ShippingSelector";
import { useCheckoutShipping, destinationFromAddress } from "@/lib/checkout/useCheckoutShipping";

export default function CheckoutPageContent() {
  const router = useRouter();
  const { cartItems, cartTotal, cartCount, clearCart, hydrated } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const profilePrefilledRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  // #148 S2: selected address/form yields no quotable destination
  const [noDestination, setNoDestination] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { addresses, isLoading: isLoadingAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);

  const trackedBeginCheckoutRef = useRef(false);
  useEffect(() => {
    if (!hydrated || cartCount === 0) return;
    if (trackedBeginCheckoutRef.current) return;
    trackedBeginCheckoutRef.current = true;
    trackBeginCheckout(cartItems);
  }, [hydrated, cartCount, cartItems]);

  const isGuest = !user && !authLoading;
  const form = useForm<TForm>({
    resolver: zodResolver(isGuest ? guestFormSchema : loggedInFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      lat: undefined,
      lng: undefined,
      notes: "",
      fulfillmentMethod: "delivery",
    },
    mode: "onChange",
  });

  const fulfillmentMethod = useWatch({ control: form.control, name: "fulfillmentMethod" });
  const pickupAvailable = Boolean(
    process.env.NEXT_PUBLIC_PICKUP_ADDRESS && process.env.NEXT_PUBLIC_PICKUP_HOURS
  );

  // "new address" (logged-in) or guest/unset mode => watch-driven quoting is
  // active (matches the pre-extraction `selectedAddressId !== "new" && !== null`
  // early-returns exactly). #148 S2: also while a saved address was revealed
  // as unquotable and the buyer is filling postal/map in-place.
  const quoteGateOpen = selectedAddressId === "new" || selectedAddressId === null || noDestination;
  const getQuoteFields = useCallback(() => {
    const [postalCode, lat, lng] = form.getValues(["postalCode", "lat", "lng"]);
    return { postalCode, lat, lng };
  }, [form]);
  const {
    shippingRates,
    location,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    resetShipping,
    watchedLat,
    watchedLng,
    quoteForAddress,
    refreshAfterDrift,
    requoteDestination,
  } = useCheckoutShipping({ control: form.control, cartItems, quoteGateOpen, getValues: getQuoteFields });

  const handleFulfillmentChange = useCallback(
    (method: "delivery" | "pickup") => {
      form.setValue("fulfillmentMethod", method, { shouldValidate: true });
      if (method === "pickup") {
        setSelectedShipping(null);
        resetShipping();
        return;
      }
      // #148 S1: returning to delivery — the watch effects never re-fired
      // (inputs unchanged), so rates would be gone with no explanation.
      // Re-quote the current destination; flag when it can't be resolved.
      const destinationKnown = requoteDestination();
      setNoDestination(!destinationKnown);
    },
    [form, setSelectedShipping, resetShipping, requoteDestination]
  );

  const applyAddressToForm = useCallback((addr: Address) => {
    form.setValue("fullName", addr.recipient_name, { shouldValidate: true });
    form.setValue("phone", addr.phone, { shouldValidate: true });
    form.setValue("address", addr.address_line, { shouldValidate: true });
    
    // Handle postal code: use saved value or extract from address string (e.g., "...Jakarta 12790, Indonesia")
    let postalCode = addr.postal_code ?? "";
    if (!postalCode && addr.address_line) {
      const match = addr.address_line.match(/\b(\d{5})\b/);
      if (match) postalCode = match[1];
    }
    form.setValue("postalCode", postalCode, { shouldValidate: true });
    
    // Set lat/lng with validation and trigger re-validation after all fields are set
    const lat = addr.latitude != null ? Number(addr.latitude) : undefined;
    const lng = addr.longitude != null ? Number(addr.longitude) : undefined;
    form.setValue("lat", lat, { shouldValidate: true });
    form.setValue("lng", lng, { shouldValidate: true });
    
    // Trigger form validation to ensure all fields are marked as valid
    form.trigger();
  }, [form]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user || isLoadingAddresses || authLoading) return;
    if (selectedAddressId !== null) return;
    if (addresses.length === 0) {
      setSelectedAddressId("new");
      return;
    }
    const defaultAddr = addresses.find((a) => a.is_default === true) ?? addresses[0];
    setSelectedAddressId(defaultAddr.id);
    applyAddressToForm(defaultAddr);
    setNoDestination(!quoteForAddress(defaultAddr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoadingAddresses, addresses]);

  useEffect(() => {
    if (!user || isLoadingAddresses || profilePrefilledRef.current) return;
    if (addresses.length > 0) return;

    profilePrefilledRef.current = true;

    const supabase = createSupabaseBrowserClient();
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;

        if (!form.getFieldState("fullName").isDirty) {
          form.setValue("fullName", data.full_name ?? "", { shouldValidate: true });
        }
        if (!form.getFieldState("phone").isDirty) {
          form.setValue("phone", data.phone ?? "", { shouldValidate: true });
        }
        if (!form.getFieldState("email").isDirty && user.email) {
          form.setValue("email", user.email, { shouldValidate: true });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoadingAddresses, addresses]);

  const handleAddressSelect = useCallback((id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      // #148 S3: name/phone belong to Data Penerima (the recipient), not the
      // address — marketplaces keep contact data when the address changes.
      form.setValue("address", "");
      form.setValue("postalCode", "");
      form.setValue("lat", undefined);
      form.setValue("lng", undefined);
      setShowMap(false);
      resetShipping();
      setNoDestination(false);
      return;
    }
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    applyAddressToForm(addr);
    setShowMap(false);
    // #148 S2: quote via the shared resolver (geo → saved postal → code
    // embedded in the address line). When nothing is quotable, surface the
    // postal/map fields instead of an inert summary card.
    const quoted = quoteForAddress(addr);
    setNoDestination(!quoted);
  }, [addresses, applyAddressToForm, form, resetShipping, quoteForAddress]);

  const shippingCost = selectedShipping?.price ?? 0;
  const total = cartTotal + shippingCost;

  const onSubmit = async (values: TForm) => {
    if (cartItems.length === 0) {
      return;
    }
    if (values.fulfillmentMethod === "delivery" && !selectedShipping) {
      setSubmitError("Pilih opsi pengiriman terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          customerName: values.fullName,
          customerEmail: values.email || undefined,
          customerPhone: values.phone,
          fulfillmentMethod: values.fulfillmentMethod,
          shippingAddress:
            values.fulfillmentMethod === "pickup"
              ? {
                  recipientName: values.fullName,
                  phone: values.phone,
                  addressLine: process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? "",
                  hours: process.env.NEXT_PUBLIC_PICKUP_HOURS ?? undefined,
                }
              : {
                  recipientName: values.fullName,
                  phone: values.phone,
                  addressLine: values.address,
                  postalCode: values.postalCode || undefined,
                  latitude: values.lat ?? undefined,
                  longitude: values.lng ?? undefined,
                },
          shippingCourier: values.fulfillmentMethod === "pickup" ? "pickup" : (selectedShipping?.raw?.courier_code ?? undefined),
          shippingService: values.fulfillmentMethod === "pickup" ? undefined : (selectedShipping?.raw?.courier_service_code ?? undefined),
          shippingCost: values.fulfillmentMethod === "pickup" ? 0 : shippingCost,
          shippingEtd: values.fulfillmentMethod === "pickup" ? undefined : (selectedShipping?.eta ?? undefined),
          notes: values.notes || undefined,
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Gagal memproses pesanan");
        // Rate drift/unavailable: refresh quotes so the buyer re-selects with
        // current prices instead of retrying the stale one.
        if (data.code === "SHIPPING_RATE_STALE" || data.code === "SHIPPING_RATE_UNAVAILABLE") {
          refreshAfterDrift();
        }
        setIsSubmitting(false);
        return;
      }

      // Redirect to QR payment page
      const { orderId } = data;
      router.push(`/checkout/payment/${orderId}`);
    } catch (err) {
      console.error("Checkout error:", err);
      setSubmitError("Terjadi kesalahan. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  // Loading state during cart hydration — also gate on mounted so SSR and first
  // client render both show the skeleton (prevents hydration mismatch)
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-svh flex flex-col bg-background">
        <Navigation />
        <main className="pt-20 px-4 tablet:px-10 desktop:px-20">
          <div className="h-6 w-24 bg-white/10 rounded-lg mb-6 mt-4 animate-pulse" />
          {/* Cart summary skeleton */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
                </div>
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Form skeleton */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (cartCount === 0) {
    return (
      <div className="min-h-svh flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center flex-col gap-6 py-24 text-center px-4">
          <ShoppingBag className="w-16 h-16 text-white/20" />
          <div>
            <p className="text-primary text-lg mb-2">Keranjang kamu kosong</p>
            <p className="text-secondary text-sm">Tambahkan produk untuk melanjutkan checkout</p>
          </div>
          <Link href="/katalog">
            <Button>Lihat Produk</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // #157 P1: the pay button sits in a fixed bottom bar — when RHF rejects a
  // submit, inline errors render far above it with no signal. Scroll to and
  // focus the first invalid field so the failure is impossible to miss.
  // Plain function: this sits after the component's conditional returns, so
  // a hook here would break rules-of-hooks.
  // aria-invalid can land on a FormItem wrapper div (fields whose
  // FormControl child is not the control itself, e.g. Kode Pos), and a div
  // swallows focus() — drill into the real control when that happens.
  // Deferred a tick: on a rejected submit of never-touched fields,
  // aria-invalid is not in the DOM yet when onInvalid fires synchronously
  // (round-2 review probe: sync MISS, next-tick FOUND).
  const focusFirstInvalid = () => {
    setTimeout(() => {
      const node = document.querySelector<HTMLElement>(
        '#checkout-form [aria-invalid="true"]'
      );
      if (!node) return;
      const el =
        node.matches("input,textarea,select") || node.isContentEditable
          ? node
          : node.querySelector<HTMLElement>("input,textarea,select") ?? node;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <Fragment>
      <Navigation />
      <main className="bg-background pt-20 tablet:px-10 desktop:px-20 px-4 min-h-screen" style={{ paddingBottom: "max(12rem, calc(env(safe-area-inset-bottom) + 12rem))" }}>
        <h1 className="text-xl font-semibold text-primary mb-6 tracking-widest uppercase mt-4">
          Checkout
        </h1>

        <OrderSummary cartItems={cartItems} cartCount={cartCount} />

        <Form {...form}>
          <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit, focusFirstInvalid)} className="space-y-4">
            <CheckoutForm
              formControl={form.control}
              isGuest={isGuest}
              user={user}
              isLoadingAddresses={isLoadingAddresses}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onAddressSelect={handleAddressSelect}
              showMap={showMap}
              onToggleMap={() => setShowMap(true)}
              watchedLat={watchedLat}
              watchedLng={watchedLng}
              isLoadingShipping={isLoadingShipping}
              fulfillmentMethod={fulfillmentMethod}
              onFulfillmentChange={handleFulfillmentChange}
              pickupAvailable={pickupAvailable}
              location={location}
              shippingError={shippingError}
              addressInputOpen={noDestination}
              hasPin={typeof watchedLat === "number" && typeof watchedLng === "number"}
              onMapChange={(lat, lng) => {
                form.setValue("lat", lat);
                form.setValue("lng", lng);
              }}
            />

            {/* Mount while rates exist OR a quote is in flight (#160): the
                selector's skeleton rows need to render during the FIRST
                geo/postal quote — with rates>0 as the only gate they were
                dead code, since an in-flight first quote has an empty list.
                The settled-no-rates case unmounts the shell and the amber
                recovery panel below takes over. */}
            {(shippingRates.length > 0 || isLoadingShipping) && !shippingError && (
              <ShippingSelector
                shippingRates={shippingRates}
                selectedShipping={selectedShipping}
                onSelect={setSelectedShipping}
                isLoading={isLoadingShipping}
              />
            )}

            {/* No-rates dead-end recovery: explain at the spot where the
                selector would be and offer the map escape hatch. Shown for
                failed/empty attempts AND when the chosen destination can't be
                resolved at all (#148 S1/S2). */}
            {fulfillmentMethod === "delivery" && !isLoadingShipping && shippingRates.length === 0 && !selectedShipping && (shippingError || noDestination) && (
              <div className="bg-[#1a1a1a] rounded-xl border border-amber-500/30 p-4">
                <h2 className="text-amber-400 font-semibold tracking-widest uppercase text-xs mb-2">Opsi Pengiriman</h2>
                <p className="text-sm text-secondary">
                  {shippingError ?? "Tujuan pengiriman belum punya kode pos atau titik peta, jadi ongkir belum bisa dihitung."}
                </p>
                {!showMap && (
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="mt-3 text-sm text-primary underline underline-offset-4"
                  >
                    Coba tandai lokasi di peta
                  </button>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan untuk pesanan..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {submitError}
              </div>
            )}
          </form>
        </Form>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Gradient fade */}
        <div className="h-8 bg-gradient-to-b from-transparent to-[#141414] pointer-events-none" />
        {/* Bar content */}
        <div
          className="bg-[#141414]/90 backdrop-blur-md border-t border-white/10 px-4 pt-3 tablet:px-10 desktop:px-20"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex justify-between text-sm text-secondary mb-1">
            <span>Subtotal</span>
            <span className="text-primary">{numberToIdr({ nominal: cartTotal })}</span>
          </div>
          <div className="flex justify-between text-sm text-secondary mb-2">
            <span>Pengiriman</span>
            <span className="text-primary">
              {fulfillmentMethod === "pickup"
                ? "Gratis (Ambil Sendiri)"
                : selectedShipping
                ? numberToIdr({ nominal: shippingCost })
                : "-"}
            </span>
          </div>
          <div className="flex justify-between font-bold text-primary mb-3">
            <span>Total</span>
            <span>{numberToIdr({ nominal: total })}</span>
          </div>
          <Button
            type="submit"
            // The pay button lives in the fixed bottom bar, OUTSIDE the form
            // element; the form="" association is what makes submit work.
            form="checkout-form"
            className="w-full h-12"
            disabled={isSubmitting || cartCount === 0 || (fulfillmentMethod === "delivery" && (isLoadingShipping || !selectedShipping))}
          >
            {isSubmitting ? (
              <><LoaderCircle className="animate-spin w-4 h-4 mr-2" /> Memproses...</>
            ) : (
              "Bayar Sekarang"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
