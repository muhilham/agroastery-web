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
import { LoaderCircle, Minus, Plus, RefreshCcw } from "lucide-react";
import {
  $shipping,
  clearShippingState,
  fetchShippingRates,
  setSelectedRate,
  TShippingRate,
} from "@/lib/stores/shipping";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  // Subscribe to the shipping store
  const { rates, selectedRate, isLoading, error } = useStore($shipping);

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", address: "", postalCode: "" },
    mode: "onChange", // Validate on change to trigger effects
  });

  // Watch for changes in address and postal code fields
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedPostalCode = useWatch({ control: form.control, name: "postalCode" });

  // Effect to fetch shipping rates when address is valid
  useEffect(() => {
    if (!product) return;

    const addressValidation = z.string().min(10).safeParse(watchedAddress);
    const postalCodeValidation = z.string().length(5).safeParse(watchedPostalCode);

    // If both fields are valid, fetch rates
    if (addressValidation.success && postalCodeValidation.success) {
      const payload = {
        destination_address: addressValidation.data,
        destination_postal_code: postalCodeValidation.data,
        items: [
          {
            name: product.title,
            description: product.description || "Kopi Arabika",
            value: product.price ?? 0,
            weight: 250, // Assuming a default weight of 250g
            height: 15,
            length: 10,
            width: 5,
            quantity: qty,
          },
        ],
      };
      fetchShippingRates(payload);
    }
  // Debounce this effect to avoid firing on every keystroke
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAddress, watchedPostalCode, product, qty]);

  // Cleanup state on component unmount
  useEffect(() => {
    return () => {
      clearShippingState();
    };
  }, []);

  if (!product) {
    return <main className="pt-20 px-6">Produk tidak ditemukan.</main>;
  }

  const effectiveSize = size || product.size?.[0] || "";
  const unitPrice =
    product.priceBySize?.[effectiveSize] ??
    product.priceBySize?.[product.size?.[0] || ""] ??
    product.price ??
    0;

  const subtotal = unitPrice * qty;
  const total = subtotal + (selectedRate?.price ?? 0);

  const dec = () => setQty((q) => Math.max(0, q - 1));
  const inc = () => setQty((q) => q + 1);

  const onSubmit = (values: TForm) => {
    if (!selectedRate) {
      alert("Silakan pilih metode pengiriman.");
      return;
    }

    const finalOrderPayload = {
      customer: values,
      product: {
        slug: product.slug,
        title: product.title,
        size: effectiveSize,
        grind: grind || product.grindSize?.[0] || "",
        qty,
        unitPrice,
      },
      shipping: selectedRate,
      totalPrice: total,
    };

    console.log("--- FINAL ORDER PAYLOAD ---", finalOrderPayload);
    alert("Pesanan siap diproses! Lihat detailnya di console.");

    // Next Step: Send this payload to an '/api/orders/create' endpoint
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
            className="space-y-4 pb-48 relative"
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
                    <Input placeholder="Contoh: 12730" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Shipping Section --- */}
            <div className="space-y-2 pt-4">
              <h3 className="text-lg font-semibold">Opsi Pengiriman</h3>
              {isLoading && (
                <div className="flex items-center gap-2 text-secondary py-4">
                  <LoaderCircle className="animate-spin" size={16} />
                  <span>Mencari kurir...</span>
                </div>
              )}
              {error && !isLoading && (
                <div className="text-destructive py-4">
                  <p className="font-semibold">Gagal memuat opsi pengiriman.</p>
                  <p className="text-sm">Error: {error}</p>
                </div>
              )}
              {!isLoading && !error && rates.length > 0 && (
                <RadioGroup
                  onValueChange={(value) => {
                    const rate = rates.find((r) => r.courier_service_code === value) || null;
                    setSelectedRate(rate);
                  }}
                  className="space-y-2"
                >
                  {rates.map((rate) => (
                    <FormItem key={rate.courier_service_code}>
                      <FormControl>
                        <RadioGroupItem
                          value={rate.courier_service_code}
                          id={rate.courier_service_code}
                          className="sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={rate.courier_service_code}
                        className={`flex justify-between items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedRate?.courier_service_code === rate.courier_service_code
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold uppercase">{rate.company} {rate.courier_service_name}</span>
                          <span className="text-sm text-secondary">Estimasi {rate.duration}</span>
                        </div>
                        <span className="font-bold text-lg">{numberToIdr({ nominal: rate.price })}</span>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              )}
            </div>

            {/* Bottom bar */}
            <div className="bottom-0 fixed w-full inset-x-0 py-4 px-6 bg-[#141414] tablet:px-10 desktop:px-20 border-t border-border/50">
              <div className="inline-flex w-full justify-between items-center mb-1">
                <span className="text-sm text-[#CCC4A9] font-normal">Subtotal</span>
                <span className="font-bold text-[#CCC4A9]">{numberToIdr({ nominal: subtotal })}</span>
              </div>
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-sm text-[#CCC4A9] font-normal">Pengiriman</span>
                <span className="font-bold text-[#CCC4A9]">
                  {selectedRate ? numberToIdr({ nominal: selectedRate.price }) : "-"}
                </span>
              </div>
              <div className="w-full h-px bg-border/50 mb-3"></div>
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-lg text-[#CCC4A9] font-bold">Total</span>
                <span className="font-bold text-xl text-[#CCC4A9]">{numberToIdr({ nominal: total })}</span>
              </div>
              <Button type="submit" className="h-12" disabled={qty === 0 || isLoading || !selectedRate}>
                {isLoading ? "Mencari Kurir..." : "Pesan Sekarang"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </Fragment>
  );
}
