"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import MapPicker from "@/components/map/MapPicker";

// Extend the form schema to include postal code for shipping and coordinates
const formSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().length(5, "Kode pos harus 5 digit"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
type TForm = z.infer<typeof formSchema>;

type Props = {
  slug: string;
  size: string;
  grind: string;
  qty: number;
  onQtyChange: (next: number) => void;
};

const PurchaseDialog = ({ slug, size, grind, qty, onQtyChange }: Props) => {
  const [open, setOpen] = useState(false);

  const product = useMemo(() => PRODUCT_LIST.find((p) => p.slug === slug), [slug]);

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", address: "", postalCode: "", lat: undefined, lng: undefined },
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

  const handleCalculateShipping = async (postalCode: string) => {
    if (!product) return;

    // Find the selected variant to get proper weight and price
    const selectedVariant = product.variants.find(v => v.weight === size);
    if (!selectedVariant) return;

    const weightGrams = selectedVariant.shipWeightGrams || 500; // Fallback to 500g

    const shippingParams = {
      originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
      destinationPostalCode: postalCode,
      couriers: "anteraja,jne,sicepat",
      name: product.title,
      description: product.shortDescription ?? product.title,
      price: selectedVariant.price,
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
      resetShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPostalCode, qty]);

  if (!product) return null;

  const effectiveSize = size || product.size?.[0] || "";
  const unitPrice =
    product.priceBySize?.[effectiveSize] ??
    product.priceBySize?.[product.size?.[0] || ""] ??
    product.price ??
    0;

  const subtotal = unitPrice * Math.max(0, qty);
  const total = subtotal + (selectedShipping?.price ?? 0);

  const onSubmit = (values: TForm) => {
    const message = createWhatsAppMessage({
      productTitle: product.title,
      size: effectiveSize,
      grind: grind || product.grindSize?.[0] || "",
      qty,
      unitPrice,
      fullName: values.fullName,
      phone: normalizePhoneID(values.phone),
      address: location
        ? `${values.address}, ${location.district}, ${location.city}, ${location.province} ${location.postal_code}`
        : `${values.address}, ${values.postalCode}`,
      shipping: selectedShipping
        ? `${selectedShipping.carrier} ${selectedShipping.service} - ${numberToIdr({
            nominal: selectedShipping.price,
          })}`
        : "Belum Dipilih",
      total: total,
    });

    const waUrl = buildWhatsAppUrl({
      storePhone: STORE_WHATSAPP,
      text: message,
    });

    window.open(waUrl, "_blank");
    setOpen(false);
  };

  const dec = () => onQtyChange(Math.max(0, qty - 1));
  const inc = () => onQtyChange(qty + 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hidden desktop:inline-flex">Beli Langsung</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-left">Detail penerima</DialogTitle>
          <DialogDescription className="text-left text-sm text-gray-400">
            Isi detail penerima dan alamat pengiriman untuk melanjutkan pemesanan.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex w-full justify-between items-end">
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
        </div>

        {/* Scrollable form area */}
        <Form {...form}>
          <form className="flex-1 overflow-y-auto contain-layout-style-paint">
            <div className="px-6 space-y-4 pb-6">
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
                        placeholder="Jl. Jenderal Sudirman No.Kav. 52-53..."
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

              <LocationDisplay
                location={location}
                isLoading={isLoadingShipping}
                error={shippingError}
              />

              {/* Map Picker for Desktop */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Pilih Lokasi Pengiriman (Opsional)
                </label>
                <MapPicker
                  value={{
                    lat: form.getValues('lat') || null,
                    lng: form.getValues('lng') || null,
                  }}
                  onChange={(coords) => {

                    console.log(coords)
                    form.setValue('lat', coords.lat);
                    form.setValue('lng', coords.lng);
                  }}
                  height={280}
                  className="w-full"
                />
              </div>

              {/* --- Shipping Section --- */}
              {shippingRates.length > 0 && !shippingError && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-semibold text-white">Opsi Pengiriman</h3>
                  <div className="transition-all duration-300 ease-in-out">
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
            </div>
          </form>

          {/* Sticky Footer with updated summary */}
          <div className="flex-shrink-0 w-full bg-[#141414] px-6 py-4 border-t border-white/10">
            <div className="space-y-1 mb-3">
              <div className="inline-flex w-full justify-between items-center">
                <span className="text-sm text-[#CCC4A9] font-normal">
                  Subtotal
                </span>
                <span className="font-medium text-[#CCC4A9]">
                  {numberToIdr({ nominal: subtotal })}
                </span>
              </div>
              <div className="inline-flex w-full justify-between items-center">
                <span className="text-sm text-[#CCC4A9] font-normal">
                  Pengiriman
                </span>
                <span className="font-medium text-[#CCC4A9]">
                  {selectedShipping
                    ? numberToIdr({ nominal: selectedShipping.price })
                    : "-"}
                </span>
              </div>
              <div className="w-full h-px bg-border/20 my-2"></div>
              <div className="inline-flex w-full justify-between items-center">
                <span className="text-lg text-[#CCC4A9] font-bold">Total</span>
                <span className="font-bold text-xl text-[#CCC4A9]">
                  {numberToIdr({ nominal: total })}
                </span>
              </div>
            </div>
            <Button
              type="button"
              className="h-12"
              disabled={qty === 0 || isLoadingShipping || !selectedShipping}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isLoadingShipping ? "Memverifikasi Lokasi..." : "Pesan Sekarang"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
