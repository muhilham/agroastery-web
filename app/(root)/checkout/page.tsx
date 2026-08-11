"use client";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { numberToIdr } from "@/lib/numberToIdr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoaderCircle, MapPin, ShoppingBag } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useShippingCalculator } from "@/lib/hooks/useShippingCalculator";
import { LocationDisplay } from "@/components/location-display";
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  loading: () => (
    <div className="h-[240px] rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false,
});
import { useCart } from "@/lib/hooks/useCart";
import { trackBeginCheckout } from "@/lib/analytics/gtag";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAddresses } from "@/lib/hooks/useAddresses";
import type { Address } from "@/lib/hooks/useAddresses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { guestFormSchema, loggedInFormSchema, type TForm } from "./checkoutSchemas";

function CheckoutImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      sizes="48px"
      onError={() => setImgSrc("/assets/placeholder.png")}
    />
  );
}

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

        {/* Cart summary */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6">
          <h2 className="text-primary font-medium mb-3">Pesanan ({cartCount} item)</h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.variantId} className="flex gap-3 items-center">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#2a2a2a] shrink-0">
                  <CheckoutImage src={item.image} alt={item.productName} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-secondary text-xs">{item.variantDescription} × {item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-primary text-sm font-semibold">
                    {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                  </span>
                  {item.originalPrice > item.unitPrice && (
                    <div className="text-xs text-gray-400 line-through">
                      {numberToIdr({ nominal: item.originalPrice * item.quantity })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Link href="/cart" className="text-xs text-white/40 hover:text-white/60 mt-3 block">
            Edit keranjang
          </Link>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {pickupAvailable && (
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">
                  Metode Pengambilan
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("delivery")}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      fulfillmentMethod === "delivery"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 text-secondary"
                    }`}
                  >
                    Kirim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("pickup")}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      fulfillmentMethod === "pickup"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 text-secondary"
                    }`}
                  >
                    Ambil Sendiri
                  </button>
                </div>
                {fulfillmentMethod === "pickup" && (
                  <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
                    <p className="text-[#CCC4A9] text-sm font-medium">
                      {process.env.NEXT_PUBLIC_PICKUP_ADDRESS}
                    </p>
                    <p className="text-[#CCC4A9]/60 text-xs">
                      {process.env.NEXT_PUBLIC_PICKUP_HOURS}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Alamat Pengiriman */}
            {fulfillmentMethod === "delivery" && (
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Alamat Pengiriman</h2>
              </div>

              {/* Saved address selector — authenticated users with saved addresses */}
              {user && !isLoadingAddresses && addresses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Pilih Alamat</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr.id)}
                        className={`flex-shrink-0 w-44 rounded-xl border-2 p-3 text-left transition-colors ${
                          selectedAddressId === addr.id
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-[#242424] active:bg-[#2a2a2a]"
                        }`}
                      >
                        {(addr.label || addr.is_default) && (
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 mb-1 truncate">
                            {addr.label ?? ""}
                            {addr.is_default ? (addr.label ? " · Utama" : "Utama") : ""}
                          </p>
                        )}
                        <p className="text-xs font-medium text-[#CCC4A9] line-clamp-1">{addr.recipient_name}</p>
                        <p className="text-[11px] text-[#CCC4A9]/50 line-clamp-2 mt-0.5 leading-tight">{addr.address_line}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddressSelect("new")}
                      className={`flex-shrink-0 w-36 rounded-xl border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1 transition-colors ${
                        selectedAddressId === "new"
                          ? "border-primary/50 bg-primary/5"
                          : "border-white/[0.15] bg-transparent active:bg-white/5"
                      }`}
                    >
                      <span className="text-primary text-xl leading-none font-light">+</span>
                      <span className="text-xs text-[#CCC4A9]/50">Alamat baru</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading addresses indicator */}
              {user && isLoadingAddresses && (
                <div className="flex items-center gap-2 text-sm text-[#CCC4A9]/60">
                  <LoaderCircle className="animate-spin w-4 h-4" />
                  <span>Memuat alamat tersimpan...</span>
                </div>
              )}

              {(selectedAddressId === "new" || (selectedAddressId === null && !user)) && (
                <>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Lengkap</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Jl. Kemang Barat No. 7, RT.9/RW.1, Bangka, Mampang Prapatan"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Pos</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="12190"
                              maxLength={5}
                              inputMode="numeric"
                              {...field}
                            />
                            {isLoadingShipping && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <LoaderCircle className="animate-spin h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Pilih Lokasi (Opsional)
                    </label>
                    {showMap ? (
                      <MapPicker
                        value={{
                          lat: watchedLat || null,
                          lng: watchedLng || null,
                        }}
                        onChange={(coords) => {
                          console.log("[Checkout] MapPicker onChange:", coords);
                          form.setValue("lat", coords.lat);
                          form.setValue("lng", coords.lng);
                        }}
                        height={240}
                        className="w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="w-full h-[60px] rounded-xl border border-white/10 bg-[#1e1e1e] hover:bg-[#242424] active:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2.5 group"
                      >
                        <MapPin className="w-4 h-4 text-primary/50 group-hover:text-primary/80 transition-colors" />
                        <span className="text-sm text-[#CCC4A9]/60 group-hover:text-[#CCC4A9]/80 transition-colors">
                          Pilih Lokasi di Peta
                        </span>
                        <span className="text-[10px] text-[#CCC4A9]/25">(Opsional)</span>
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Map display for saved addresses with lat/lng */}
              {selectedAddressId !== null && selectedAddressId !== "new" && (() => {
                const addr = addresses.find((a) => a.id === selectedAddressId);
                if (!addr) return null;
                const hasCoordinates = addr.latitude != null && addr.longitude != null;
                return (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
                      <p className="text-[#CCC4A9] text-sm font-medium">{addr.address_line}</p>
                      {addr.postal_code && (
                        <p className="text-[#CCC4A9]/60 text-xs">Kode Pos: {addr.postal_code}</p>
                      )}
                    </div>
                    {hasCoordinates && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Lokasi Pin</label>
                        <MapPicker
                          value={{
                            lat: addr.latitude,
                            lng: addr.longitude,
                          }}
                          onChange={() => {}} // No-op since readOnly
                          height={180}
                          showSearch={false}
                          readOnly={true}
                          zoom={16}
                        />
                        <p className="text-xs text-[#CCC4A9]/40">
                          Lokasi telah ditentukan dari alamat tersimpan
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <LocationDisplay
                location={location}
                isLoading={isLoadingShipping}
                error={shippingError}
              />
            </div>
            )}

            {/* Step 2: Data Penerima */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Data Penerima</h2>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap penerima" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" inputMode="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isGuest && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="budi@gmail.com" type="email" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <p className="text-xs text-secondary mt-1">
                        We&apos;ll send your order confirmation here
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Shipping options */}
            {shippingRates.length > 0 && !shippingError && (
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
                </div>
                <RadioGroup
                  onValueChange={(value) => {
                    const rate = shippingRates.find((r) => r.code === value) ?? null;
                    setSelectedShipping(rate);
                  }}
                  className="space-y-2"
                >
                  {shippingRates.map((rate, index) => {
                    const key = `${rate.code}-${rate.price}-${index}`;
                    return (
                      <FormItem key={key}>
                        <FormControl>
                          <RadioGroupItem value={rate.code} id={key} className="sr-only" />
                        </FormControl>
                        <FormLabel
                          htmlFor={key}
                          className={`flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border cursor-pointer transition-all min-h-[3.5rem] relative overflow-hidden ${
                            selectedShipping?.code === rate.code
                              ? "border-primary/40 bg-primary/10"
                              : "border-white/10 bg-[#1e1e1e] active:bg-white/5"
                          }`}
                        >
                          {selectedShipping?.code === rate.code && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                          )}
                          <div className="flex flex-col min-w-0 gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 rounded px-1.5 py-0.5 text-[#CCC4A9]/70 shrink-0">
                                {rate.carrier}
                              </span>
                              <span className="text-sm font-medium text-primary truncate">{rate.service}</span>
                            </div>
                            <span className="text-xs text-secondary">Tiba {rate.eta || "N/A"}</span>
                          </div>
                          <span className="text-sm font-semibold shrink-0 text-primary">{numberToIdr({ nominal: rate.price })}</span>
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
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
