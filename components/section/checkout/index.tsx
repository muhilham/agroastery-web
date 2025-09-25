"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navigation from "@/components/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { PRODUCT_LIST } from "@/constant/product/product-list";
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
import { LoaderCircle, Minus, Plus } from "lucide-react";

import {
  createWhatsAppMessage,
  normalizePhoneID,
  buildWhatsAppUrl,
} from "@/lib/message-builder";
import { STORE_WHATSAPP } from "@/constant/store-phone-number";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useShippingCalculator } from "@/lib/hooks/useShippingCalculator";
import { LocationDisplay } from "@/components/location-display";

// Expanded schema to include postal code for shipping calculation
const formSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().min(5, "Kode pos tidak valid").max(5),
});
type TForm = z.infer<typeof formSchema>;

type Props = {
  slug: string;
  defaultSize: string;
  defaultGrind: string;
  defaultQty: number;
};

export default function CheckoutClient({ slug, defaultSize, defaultGrind, defaultQty }: Props) {
  const product = useMemo(() => PRODUCT_LIST.find((p) => p.slug === slug), [slug]);

  const [size] = useState<string>(defaultSize);
  const [grind] = useState<string>(defaultGrind);
  const [qty, setQty] = useState<number>(Math.max(0, defaultQty));

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", address: "", postalCode: "" },
    mode: "onChange", // Validate on change to trigger effects
  });

  const {
    shippingRates,
    location, // Get location data
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    resetShipping, // Get reset function
  } = useShippingCalculator();

  const watchedPostalCode = useWatch({ control: form.control, name: "postalCode" });

  const debouncedPostalCode = useDebounce(watchedPostalCode, 800);

  const handleCalculateShipping = async (postalCode: string) => {
    if (!product) return;

    // Find the selected variant to get proper weight and price
    const selectedVariant = product.variants.find(v => v.weight === effectiveSize);
    if (!selectedVariant) return;

    const weightGrams = selectedVariant.shipWeightGrams || 500; // Fallback to 500g

    const shippingParams = {
      originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
      destinationPostalCode: postalCode,
      couriers: "anteraja,jne,sicepat",
      name: product.title,
      description: product.shortDescription ?? product.title,
      price: unitPrice,
      quantity: Math.max(1, qty),
      weightGrams,
      length: 20,
      width: 15,
      height: 10,
    };

    await calculateShipping(shippingParams);
  };

  useEffect(() => {
    const postalCodeValidation = z.string().length(5).safeParse(debouncedPostalCode);

    if (postalCodeValidation.success) {
      handleCalculateShipping(debouncedPostalCode);
    } else {
      resetShipping(); // Clear rates if postal code is invalid
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPostalCode, qty]); // Re-run on qty change too

  if (!product) {
    return <main className="pt-20 px-6">Produk tidak ditemukan.</main>;
  }

  const effectiveSize = size || product.size?.[0] || "";
  const unitPrice =
    product.priceBySize?.[effectiveSize] ??
    product.priceBySize?.[product.size?.[0] || ""] ??
    product.price ??
    0;

  const subtotal = unitPrice * Math.max(0, qty);
  const total = subtotal + (selectedShipping?.price ?? 0);

  const dec = () => setQty((q) => Math.max(0, q - 1));
  const inc = () => setQty((q) => q + 1);

  const onSubmit = (values: TForm) => {
    const message = createWhatsAppMessage({
      productTitle: product.title,
      size: effectiveSize,
      grind: grind || product.grindSize?.[0] || "",
      qty,
      unitPrice,
      fullName: values.fullName,
      phone: normalizePhoneID(values.phone),
      // Use the verified location data if available
      address: location
        ? `${values.address}, ${location.district}, ${location.city}, ${location.province} ${location.postal_code}`
        : `${values.address}, ${values.postalCode}`,
      shipping: selectedShipping ? `${selectedShipping.carrier} ${selectedShipping.service} - ${numberToIdr({ nominal: selectedShipping.price })}` : 'Belum Dipilih',
      total: total,
    });

    const waUrl = buildWhatsAppUrl({
      storePhone: STORE_WHATSAPP,
      text: message,
    });

    window.open(waUrl, "_blank");
  };

  return (
    <Fragment>
      <Navigation />
      <main className="bg-background pt-20 tablet:px-10 desktop:px-20 px-4 min-h-screen">
        {/* Summary header */}
        <div className="flex w-full justify-between items-end mb-4">
          <div className="inline-flex gap-3 items-end">
            <div className="bg-[#242424] p-2 rounded-xl">
              <Image
                src={
                  product.images?.[0]?.image ?? "/assets/coffe/blend-gayo.png"
                }
                width={64}
                height={64}
                alt={product.title}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-secondary">
                {effectiveSize}, {grind || product.grindSize?.[0]}
              </div>
              <div className="text-base font-extrabold text-primary">
                {qty > 0 ? (
                  <>
                    {numberToIdr({ nominal: unitPrice })}{" "}
                    <span className="opacity-70">× {qty}</span>{" "}
                    <span className="ml-1">
                      = {numberToIdr({ nominal: subtotal })}
                    </span>
                  </>
                ) : (
                  numberToIdr({ nominal: unitPrice })
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-4">
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold disabled:opacity-40"
              onClick={dec}
              disabled={qty === 0}
              aria-label="Kurangi jumlah"
            >
              <Minus />
            </button>
            <div className="font-semibold text-secondary text-base min-w-8 text-center">
              {qty}
            </div>
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold"
              onClick={inc}
              aria-label="Tambah jumlah"
            >
              <Plus />
            </button>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pb-96 relative"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
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
                  <FormLabel>Nomor Penerima</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nomor handphone"
                      inputMode="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Jl. Kemang Barat No. 7, RT.9/RW.1, Bangka, Mampang Prapatan"
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
                        // No need for a complex onChange handler anymore
                      />
                      {isLoadingShipping && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <LoaderCircle className="animate-spin h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Replace old postal code display with the new LocationDisplay component */}
            <LocationDisplay
              location={location}
              isLoading={isLoadingShipping}
              error={shippingError}
            />

            {/* --- Shipping Section --- */}
            {/* Show shipping options only when there are rates and no errors */}
            {shippingRates.length > 0 && !shippingError && (
              <div className="space-y-2 pt-4">
                <h3 className="text-lg font-semibold text-white">Opsi Pengiriman</h3>
                <div className="transition-all duration-300 ease-in-out">
                  {/* Remove redundant loading/error states, handled by LocationDisplay */}
                  <RadioGroup
                    onValueChange={(value: string) => {
                      const rate =
                        shippingRates.find(
                          (r) => r.code === value
                        ) || null;
                      setSelectedShipping(rate);
                    }}
                    className="space-y-2"
                  >
                    {shippingRates.map((rate, index) => {
                      const uniqueKey = `${rate.code}-${rate.price}-${index}`;
                      return (
                        <FormItem key={uniqueKey}>
                          <FormControl>
                            <RadioGroupItem
                              value={rate.code}
                              id={uniqueKey}
                              className="sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={uniqueKey}
                            className={`flex justify-between items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedShipping?.code === rate.code ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-white/5'}`}
                          >
                            <div className="flex flex-col">
                              <span className="uppercase">{rate.carrier} {rate.service}</span>
                              <span className="text-sm text-secondary">Estimasi {rate.eta || 'N/A'}</span>
                            </div>
                            <span className="text-lg">{numberToIdr({ nominal: rate.price })}</span>
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div className="bottom-0 fixed w-full inset-x-0 py-4 px-6 bg-[#141414] tablet:px-10 desktop:px-20 border-t border-border/50" style={{ scrollBehavior: 'auto' }}>
              <div className="inline-flex w-full justify-between items-center mb-1">
                <span className="text-sm text-[#CCC4A9] font-normal">Subtotal</span>
                <span className="font-bold text-[#CCC4A9]">{numberToIdr({ nominal: subtotal })}</span>
              </div>
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-sm text-[#CCC4A9] font-normal">Pengiriman</span>
                <span className="font-bold text-[#CCC4A9]">
                  {selectedShipping
                    ? numberToIdr({ nominal: selectedShipping.price })
                    : "-"}
                </span>
              </div>
              <div className="w-full h-px bg-border/50 mb-3"></div>
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-lg text-[#CCC4A9] font-bold">Total</span>
                <span className="font-bold text-xl text-[#CCC4A9]">{numberToIdr({ nominal: total })}</span>
              </div>
              <Button type="submit" className="h-12" disabled={qty === 0 || isLoadingShipping || !selectedShipping}>
                {isLoadingShipping ? "Memverifikasi Lokasi..." : "Pesan Sekarang"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </Fragment>
  );
}
