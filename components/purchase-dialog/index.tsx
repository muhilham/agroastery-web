"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Define the structure for a shipping rate
export type TShippingRate = {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  duration: string;
  price: number;
  type: string;
};

// Extend the form schema to include postal code for shipping
const formSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().length(5, "Kode pos harus 5 digit"),
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

  // State for shipping calculation
  const [shippingRates, setShippingRates] = useState<TShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<TShippingRate | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const product = useMemo(() => PRODUCT_LIST.find((p) => p.slug === slug), [slug]);

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", address: "", postalCode: "" },
    mode: "onChange",
  });

  // Watch form fields for changes
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedPostalCode = useWatch({ control: form.control, name: "postalCode" });

  // Debounce the watched values to avoid excessive API calls
  const debouncedAddress = useDebounce(watchedAddress, 500);
  const debouncedPostalCode = useDebounce(watchedPostalCode, 500);
  const debouncedQty = useDebounce(qty, 500);

  // Function to fetch shipping rates
  const calculateShipping = async () => {
    if (!product) return;

    const addressValidation = z.string().min(10).safeParse(debouncedAddress);
    const postalCodeValidation = z.string().length(5).safeParse(debouncedPostalCode);

    if (!addressValidation.success || !postalCodeValidation.success) {
      setShippingRates([]);
      setSelectedShipping(null);
      return;
    }

    setIsLoadingShipping(true);
    setShippingError(null);
    setSelectedShipping(null);

    const shippingPayload = {
      destination_address: addressValidation.data,
      destination_postal_code: postalCodeValidation.data,
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

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingPayload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Gagal mengambil tarif pengiriman.");
      }

      const sortedRates = result.pricing.sort((a: TShippingRate, b: TShippingRate) => a.price - b.price);
      setShippingRates(sortedRates);
    } catch (error) {
      if (error instanceof Error) {
        setShippingError(error.message);
      } else {
        setShippingError("An unknown error occurred.");
      }
      setShippingRates([]);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Effect to trigger shipping calculation
  useEffect(() => {
    calculateShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAddress, debouncedPostalCode, debouncedQty, product]);

  if (!product) return null;

  const effectiveSize = size || product.size?.[0] || "";
  const unitPrice =
    product.priceBySize?.[effectiveSize] ??
    product.priceBySize?.[product.size?.[0] || ""] ??
    product.price ??
    0;

  const subtotal = unitPrice * Math.max(0, qty);
  const total = subtotal + (selectedShipping?.price ?? 0);

  const dec = () => onQtyChange(Math.max(0, qty - 1));
  const inc = () => onQtyChange(qty + 1);

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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hidden desktop:inline-flex">Beli Langsung</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-left">Detail penerima</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="px-6 pb-4">
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

        {/* Scrollable form with sticky footer */}
        <Form {...form}>
          <form className="max-h-[70vh] overflow-y-auto">
            <div className="px-6 space-y-4 pb-48">
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
                      <Input
                        placeholder="12190"
                        inputMode="numeric"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Shipping Section --- */}
              <div className="space-y-2 pt-4">
                <h3 className="text-lg font-semibold">Opsi Pengiriman</h3>
                {isLoadingShipping && (
                  <div className="flex items-center gap-2 text-secondary py-4">
                    <LoaderCircle className="animate-spin" size={16} />
                    <span>Mencari kurir...</span>
                  </div>
                )}
                {shippingError && !isLoadingShipping && (
                  <div className="text-destructive py-4 space-y-2">
                    <p className="font-semibold">Gagal memuat opsi pengiriman.</p>
                    <p className="text-sm">Error: {shippingError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateShipping}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                )}
                {!isLoadingShipping && !shippingError && shippingRates.length > 0 && (
                  <RadioGroup
                    onValueChange={(value: string) => {
                      const rate = shippingRates.find(
                        (r) => `${r.courier_code}-${r.courier_service_code}` === value
                      ) || null;
                      setSelectedShipping(rate);
                    }}
                    className="space-y-2"
                  >
                    {shippingRates.map((rate) => {
                      const uniqueKey = `${rate.courier_code}-${rate.courier_service_code}`;
                      return (
                        <FormItem key={uniqueKey}>
                          <FormControl>
                            <RadioGroupItem value={uniqueKey} id={uniqueKey} className="sr-only" />
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

            {/* Sticky Footer with updated summary */}
            <div className="sticky bottom-0 w-full bg-[#141414] px-6 py-4 border-t border-white/10">
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
                  <span className="text-lg text-[#CCC4A9] font-bold">
                    Total
                  </span>
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
                {isLoadingShipping ? "Menghitung Ongkir..." : "Pesan Sekarang"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
