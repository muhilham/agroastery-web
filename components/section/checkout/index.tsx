"use client";
import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Navigation from "@/components/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Minus, Plus } from "lucide-react";
import {
  createWhatsAppMessage,
  normalizePhoneID,
  buildWhatsAppUrl,
} from "@/lib/message-builder";
import { STORE_WHATSAPP } from "@/constant/store-phone-number";

const formSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(6, "Alamat terlalu singkat").max(300),
});
type TForm = z.infer<typeof formSchema>;

type Props = {
  slug: string;
  defaultSize: string;
  defaultGrind: string;
  defaultQty: number;
};

export default function CheckoutClient({
  slug,
  defaultSize,
  defaultGrind,
  defaultQty,
}: Props) {
  const product = useMemo(
    () => PRODUCT_LIST.find((p) => p.slug === slug),
    [slug],
  );

  const [size] = useState<string>(defaultSize);
  const [grind] = useState<string>(defaultGrind);
  const [qty, setQty] = useState<number>(Math.max(0, defaultQty));

  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", address: "" },
  });

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
      address: values.address,
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
            className="space-y-4 pb-28 relative"
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
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat lengkap.."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bottom bar */}
            <div className="bottom-0 fixed w-full inset-x-0 py-4 px-6 bg-[#141414] tablet:px-10 desktop:px-20">
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-sm text-[#CCC4A9] font-normal">
                  Subtotal
                </span>
                <span className="font-bold text-[#CCC4A9]">
                  {numberToIdr({ nominal: subtotal })}
                </span>
              </div>
              <Button type="submit" className="h-12" disabled={qty === 0}>
                Pesan Sekarang
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </Fragment>
  );
}
