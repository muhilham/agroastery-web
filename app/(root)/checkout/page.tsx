"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { LoaderCircle, ShoppingBag } from "lucide-react";
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
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAddresses } from "@/lib/hooks/useAddresses";
import type { Address } from "@/lib/hooks/useAddresses";

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


const formSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().min(5, "Kode pos tidak valid").max(5),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});
type TForm = z.infer<typeof formSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, cartCount, clearCart, totalWeight, hydrated } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { addresses, isLoading: isLoadingAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      lat: undefined,
      lng: undefined,
      notes: "",
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
    form.setValue("postalCode", addr.postal_code ?? "", { shouldValidate: true });
    form.setValue("lat", addr.latitude ?? undefined);
    form.setValue("lng", addr.longitude ?? undefined);
  }, [form]);

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
    if (selectedAddressId !== "new") return;
    const latValid = typeof watchedLat === "number" && Number.isFinite(watchedLat);
    const lngValid = typeof watchedLng === "number" && Number.isFinite(watchedLng);
    if (latValid && lngValid) return;

    const postalValid = z.string().length(5).safeParse(debouncedPostalCode);
    if (postalValid.success) {
      handleCalculateShippingByPostal(debouncedPostalCode);
    } else {
      resetShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPostalCode, watchedLat, watchedLng, selectedAddressId]);

  useEffect(() => {
    if (selectedAddressId !== "new") return;
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
    if (cartItems.length === 0) return;
    if (!selectedShipping) {
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
          shippingAddress: {
            recipientName: values.fullName,
            phone: values.phone,
            addressLine: values.address,
            postalCode: values.postalCode || undefined,
            latitude: values.lat ?? undefined,
            longitude: values.lng ?? undefined,
          },
          shippingCourier: selectedShipping?.raw?.courier_code ?? undefined,
          shippingService: selectedShipping?.raw?.courier_service_code ?? undefined,
          shippingCost,
          shippingEtd: selectedShipping?.eta ?? undefined,
          notes: values.notes || undefined,
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

  // Loading state during cart hydration
  if (!hydrated) {
    return (
      <div className="min-h-svh flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <LoaderCircle className="animate-spin w-8 h-8 text-primary" />
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
                <span className="text-primary text-sm font-semibold shrink-0">
                  {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                </span>
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
            <h2 className="text-primary font-medium">Data Penerima</h2>

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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="email@contoh.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h2 className="text-primary font-medium pt-2">Alamat Pengiriman</h2>

            {/* Saved address selector — authenticated users with saved addresses */}
            {user && !isLoadingAddresses && addresses.length > 0 && (
              <div className="space-y-1">
                <label htmlFor="saved-address-select" className="text-sm font-medium text-white">Pilih Alamat</label>
                <select
                  id="saved-address-select"
                  value={selectedAddressId ?? ""}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  className="flex h-12 w-full rounded-xl bg-[#242424] border border-white/10 px-3 py-1 text-sm text-[#CCC4A9]/80 shadow-sm transition-colors focus:outline-none appearance-none"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label ? `${addr.label} — ${addr.recipient_name}` : addr.recipient_name}
                      {addr.is_default ? " (Utama)" : ""}
                    </option>
                  ))}
                  <option value="new">+ Alamat baru</option>
                </select>
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
                        lat: form.getValues("lat") || null,
                        lng: form.getValues("lng") || null,
                      }}
                      onChange={(coords) => {
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
                      className="w-full h-[60px] rounded-lg border border-white/10 bg-white/5 text-secondary text-sm hover:bg-white/10 active:bg-white/15 transition-colors"
                    >
                      Buka Peta untuk Pilih Lokasi
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Read-only address summary card */}
            {selectedAddressId !== null && selectedAddressId !== "new" && (() => {
              const addr = addresses.find((a) => a.id === selectedAddressId);
              if (!addr) return null;
              return (
                <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
                  <p className="text-[#CCC4A9] text-sm font-medium">{addr.address_line}</p>
                  {addr.postal_code && (
                    <p className="text-[#CCC4A9]/60 text-xs">Kode Pos: {addr.postal_code}</p>
                  )}
                </div>
              );
            })()}

            <LocationDisplay
              location={location}
              isLoading={isLoadingShipping}
              error={shippingError}
            />

            {/* Shipping options */}
            {shippingRates.length > 0 && !shippingError && (
              <div className="space-y-2 pt-2">
                <h2 className="text-primary font-medium">Opsi Pengiriman</h2>
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
                          className={`flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border-2 cursor-pointer transition-colors min-h-[3.5rem] ${
                            selectedShipping?.code === rate.code
                              ? "border-primary bg-primary/10"
                              : "border-transparent bg-white/5 active:bg-white/10"
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="uppercase text-sm font-medium truncate">{rate.carrier} {rate.service}</span>
                            <span className="text-xs text-secondary">Estimasi {rate.eta || "N/A"}</span>
                          </div>
                          <span className="text-sm font-semibold shrink-0">{numberToIdr({ nominal: rate.price })}</span>
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-border/50 px-4 pt-3 tablet:px-10 desktop:px-20 z-30"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="flex justify-between text-sm text-secondary mb-1">
          <span>Subtotal</span>
          <span className="text-primary">{numberToIdr({ nominal: cartTotal })}</span>
        </div>
        <div className="flex justify-between text-sm text-secondary mb-2">
          <span>Pengiriman</span>
          <span className="text-primary">
            {selectedShipping ? numberToIdr({ nominal: shippingCost }) : "-"}
          </span>
        </div>
        <div className="flex justify-between font-bold text-primary mb-3">
          <span>Total</span>
          <span>{numberToIdr({ nominal: total })}</span>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="w-full h-12"
          disabled={isSubmitting || isLoadingShipping || !selectedShipping || cartCount === 0}
        >
          {isSubmitting ? (
            <><LoaderCircle className="animate-spin w-4 h-4 mr-2" /> Memproses...</>
          ) : (
            "Bayar Sekarang"
          )}
        </Button>
      </div>
    </Fragment>
  );
}
