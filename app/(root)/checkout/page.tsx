"use client";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { z } from "zod";
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
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useShippingCalculator } from "@/lib/hooks/useShippingCalculator";
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

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, cartCount, clearCart, totalWeight, hydrated } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const profilePrefilledRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
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

  const {
    shippingRates,
    location,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    resetShipping,
  } = useShippingCalculator();

  const fulfillmentMethod = useWatch({ control: form.control, name: "fulfillmentMethod" });
  const pickupAvailable = Boolean(
    process.env.NEXT_PUBLIC_PICKUP_ADDRESS && process.env.NEXT_PUBLIC_PICKUP_HOURS
  );

  const handleFulfillmentChange = useCallback(
    (method: "delivery" | "pickup") => {
      form.setValue("fulfillmentMethod", method, { shouldValidate: true });
      if (method === "pickup") {
        setSelectedShipping(null);
        resetShipping();
      }
    },
    [form, setSelectedShipping, resetShipping]
  );

  const watchedPostalCode = useWatch({ control: form.control, name: "postalCode" });
  const debouncedPostalCode = useDebounce(watchedPostalCode, 800);
  const watchedLat = useWatch({ control: form.control, name: "lat" });
  const watchedLng = useWatch({ control: form.control, name: "lng" });

  const shippingWeight = useMemo(() => Math.max(totalWeight, 100), [totalWeight]);

  const handleCalculateShippingByPostal = useCallback(async (postalCode: string) => {
    if (cartItems.length === 0) return;
    try {
      // TODO: Pass cart items[] directly for accurate per-item weight pricing
      // (useShippingCalculator now supports items[] via ShippingCalcParams.items)
      await calculateShipping({
        originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
        destinationPostalCode: postalCode,
        couriers: "anteraja,jne,sicepat",
        name: cartItems[0]?.productName ?? "Kopi Agroastery",
        description: "Pesanan Agroastery",
        price: cartTotal,
        quantity: cartCount,
        weightGrams: shippingWeight,
        length: 20,
        width: 20,
        height: 20,
      });
    } catch {
      // error already surfaced via shippingError state
    }
  }, [cartItems, cartTotal, cartCount, shippingWeight, calculateShipping]);

  const handleCalculateShippingByGeo = useCallback(async (lat: number, lng: number) => {
    if (cartItems.length === 0) return;
    try {
      await calculateShipping({
        originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
        destinationLatitude: lat,
        destinationLongitude: lng,
        couriers: "anteraja,jne,sicepat,lalamove,grab,gojek",
        name: cartItems[0]?.productName ?? "Kopi Agroastery",
        description: "Pesanan Agroastery",
        price: cartTotal,
        quantity: cartCount,
        weightGrams: shippingWeight,
        length: 20,
        width: 20,
        height: 20,
      });
    } catch {
      // error already surfaced via shippingError state
    }
  }, [cartItems, cartTotal, cartCount, shippingWeight, calculateShipping]);

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
    if (defaultAddr.latitude != null && defaultAddr.longitude != null) {
      handleCalculateShippingByGeo(defaultAddr.latitude, defaultAddr.longitude);
    } else if (defaultAddr.postal_code) {
      handleCalculateShippingByPostal(defaultAddr.postal_code);
    }
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

  useEffect(() => {
    // Fire for "new" address mode (logged-in) OR guest mode (null + no user)
    if (selectedAddressId !== "new" && selectedAddressId !== null) return;
    const latValid = typeof watchedLat === "number" && Number.isFinite(watchedLat);
    const lngValid = typeof watchedLng === "number" && Number.isFinite(watchedLng);
    if (latValid && lngValid) return;

    const postalValid = z.string().length(5).safeParse(debouncedPostalCode);
    if (postalValid.success) {
      handleCalculateShippingByPostal(postalValid.data);
    } else {
      resetShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPostalCode, watchedLat, watchedLng, selectedAddressId]);

  useEffect(() => {
    // Fire for "new" address mode (logged-in) OR guest mode (null + no user)
    if (selectedAddressId !== "new" && selectedAddressId !== null) return;
    const latValid = typeof watchedLat === "number" && Number.isFinite(watchedLat);
    const lngValid = typeof watchedLng === "number" && Number.isFinite(watchedLng);
    if (latValid && lngValid) {
      handleCalculateShippingByGeo(watchedLat as number, watchedLng as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLat, watchedLng, selectedAddressId]);

  const handleAddressSelect = useCallback((id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      form.setValue("fullName", "");
      form.setValue("phone", "");
      form.setValue("address", "");
      form.setValue("postalCode", "");
      form.setValue("lat", undefined);
      form.setValue("lng", undefined);
      setShowMap(false);
      resetShipping();
      return;
    }
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    applyAddressToForm(addr);
    setShowMap(false);
    if (addr.latitude != null && addr.longitude != null) {
      handleCalculateShippingByGeo(addr.latitude, addr.longitude);
    } else if (addr.postal_code) {
      handleCalculateShippingByPostal(addr.postal_code);
    } else {
      resetShipping();
    }
  }, [addresses, applyAddressToForm, form, resetShipping, handleCalculateShippingByGeo, handleCalculateShippingByPostal]);

  const shippingCost = selectedShipping?.price ?? 0;
  const total = cartTotal + shippingCost;

  const onSubmit = async (values: TForm) => {
    if (cartItems.length === 0) {
      console.log("[Checkout] Cart is empty, returning");
      return;
    }
    if (values.fulfillmentMethod === "delivery" && !selectedShipping) {
      console.log("[Checkout] No shipping selected");
      setSubmitError("Pilih opsi pengiriman terlebih dahulu");
      return;
    }
    console.log("[Checkout] Starting submission...");
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

  // Debug: log form errors when they change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        console.log("[Checkout] Form errors:", form.formState.errors);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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

  return (
    <Fragment>
      <Navigation />
      <main className="bg-background pt-20 tablet:px-10 desktop:px-20 px-4 min-h-screen" style={{ paddingBottom: "max(12rem, calc(env(safe-area-inset-bottom) + 12rem))" }}>
        <h1 className="text-xl font-semibold text-primary mb-6 tracking-widest uppercase mt-4">
          Checkout
        </h1>

        <OrderSummary cartItems={cartItems} cartCount={cartCount} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              onMapChange={(lat, lng) => {
                console.log("[Checkout] MapPicker onChange:", { lat, lng });
                form.setValue("lat", lat);
                form.setValue("lng", lng);
              }}
            />

            {shippingRates.length > 0 && !shippingError && (
              <ShippingSelector
                shippingRates={shippingRates}
                selectedShipping={selectedShipping}
                onSelect={setSelectedShipping}
              />
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
            onClick={() => {
              console.log("[Checkout] Button clicked!");
              console.log("[Checkout] Form values:", form.getValues());
              console.log("[Checkout] Form errors:", form.formState.errors);
              console.log("[Checkout] isValid:", form.formState.isValid);
              console.log("[Checkout] isSubmitting:", isSubmitting);
              console.log("[Checkout] isLoadingShipping:", isLoadingShipping);
              console.log("[Checkout] selectedShipping:", selectedShipping);
              console.log("[Checkout] cartCount:", cartCount);
              
              // Check if button should be disabled
              const isDisabled = isSubmitting || cartCount === 0 || (fulfillmentMethod === "delivery" && (isLoadingShipping || !selectedShipping));
              console.log("[Checkout] Button disabled?", isDisabled);
              
              if (!isDisabled) {
                console.log("[Checkout] Calling form.handleSubmit...");
                form.handleSubmit(onSubmit)();
              } else {
                console.log("[Checkout] Button is disabled, not submitting");
              }
            }}
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
