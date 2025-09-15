"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useStore } from "@nanostores/react";
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
import { usePostalCode } from "@/lib/hooks/usePostalCode";
import { useShippingCalculator } from "@/lib/hooks/useShippingCalculator";

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

  // Reusable hooks for postal code and shipping
  const {
    postalData,
    isLoadingPostal,
    postalError,
    canCalculateShipping,
    handlePostalCodeChange,
  } = usePostalCode();

  const {
    shippingRates,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    setShippingError,
  } = useShippingCalculator();

  // Watch for changes in address and postal code fields
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedPostalCode = useWatch({ control: form.control, name: "postalCode" });

  // Debounce the watched values to avoid excessive API calls
  const debouncedAddress = useDebounce(watchedAddress, 500);
  const debouncedPostalCode = useDebounce(watchedPostalCode, 500);
  const debouncedQty = useDebounce(qty, 500);

  const handleCalculateShipping = async () => {
    if (!product || !canCalculateShipping) {
      setShippingError("Please enter a valid postal code first");
      return;
    }

    const shippingPayload = {
      destination: {
        contact_name: form.getValues("fullName") || "Penerima",
        contact_phone: form.getValues("phone") || "08123456789",
        address: form.getValues("address"),
        postal_code: form.getValues("postalCode"),
      },
      items: [
        {
          name: product.title,
          description: product.description || "Kopi Pilihan",
          value: product.price || 0,
          weight: 500, // Default weight 500g
          height: 10, // Default dimensions
          length: 10,
          width: 10,
          quantity: Math.max(1, debouncedQty),
        },
      ],
    };

    await calculateShipping(shippingPayload);
  };

  // Effect to trigger shipping calculation automatically on debounce
  useEffect(() => {
    const addressValidation = z.string().min(10).safeParse(debouncedAddress);
    const postalCodeValidation = z.string().length(5).safeParse(debouncedPostalCode);

    if (addressValidation.success && postalCodeValidation.success && canCalculateShipping) {
      handleCalculateShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAddress, debouncedPostalCode, debouncedQty, canCalculateShipping]);


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
      address: `${values.address}, ${values.postalCode}`,
      shipping: selectedShipping ? `${selectedShipping.courier_name} ${selectedShipping.courier_service_name} - ${numberToIdr({ nominal: selectedShipping.price })}` : 'Belum Dipilih',
      total: total,
    });

    const waUrl = buildWhatsAppUrl({
      storePhone: STORE_WHATSAPP,
      text: message,
    });

    window.open(waUrl, "_blank");
  }

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
                        value={field.value}
                        onChange={(e) => handlePostalCodeChange(e.target.value, form)}
                        className="pr-10"
                      />
                      {isLoadingPostal && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {postalError && !isLoadingPostal && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md -mt-2 mb-4">
                <p className="text-sm text-red-500">
                  <strong>Error:</strong> {postalError}
                </p>
              </div>
            )}

            {postalData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md -mt-2 mb-4">
                <p className="text-sm text-green-800">
                  <strong>📍 Lokasi Ditemukan:</strong>
                  <br />
                  {postalData.full_location}
                </p>
              </div>
            )}

            {/* --- Shipping Section --- */}
            {canCalculateShipping && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-semibold text-white">Opsi Pengiriman</h3>
                  <div className="transition-all duration-300 ease-in-out">
                    {isLoadingShipping && (
                      <div className="flex items-center gap-2 text-secondary py-4">
                        <LoaderCircle className="animate-spin" size={16} />
                        <span>Mencari kurir...</span>
                      </div>
                    )}
                    {shippingError && !isLoadingShipping && (
                      <div className="text-destructive py-4 space-y-2">
                        <p className="font-semibold">
                          Gagal memuat opsi pengiriman.
                        </p>
                        <p className="text-sm">Error: {shippingError}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCalculateShipping}
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    )}
                    {postalData &&
                      !isLoadingShipping &&
                      !shippingError &&
                      shippingRates.length > 0 && (
                        <RadioGroup
                          onValueChange={(value: string) => {
                            const rate =
                              shippingRates.find(
                                (r) =>
                                  `${r.courier_code}-${r.courier_service_code}` ===
                                  value
                              ) || null;
                            setSelectedShipping(rate);
                          }}
                          className="space-y-2"
                        >
                          {shippingRates.map((rate, index) => {
                            const uniqueKey = `${rate.courier_code}-${rate.courier_service_code}-${rate.price}-${index}`;
                            return (
                              <FormItem key={uniqueKey}>
                                <FormControl>
                                  <RadioGroupItem
                                    value={`${rate.courier_code}-${rate.courier_service_code}`}
                                    id={uniqueKey}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor={uniqueKey}
                                  className={`flex justify-between items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedShipping?.courier_service_code === rate.courier_service_code && selectedShipping?.courier_code === rate.courier_code ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-white/5'}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="uppercase">{rate.company} {rate.courier_service_name}</span>
                                    <span className="text-sm text-secondary">Estimasi {rate.duration}</span>
                                  </div>
                                  <span className="text-lg">{numberToIdr({ nominal: rate.price })}</span>
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </RadioGroup>
                    )}
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
                {isLoadingShipping ? "Mencari Kurir..." : "Pesan Sekarang"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </Fragment>
  );
}
