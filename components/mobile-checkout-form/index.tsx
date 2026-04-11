"use client";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { numberToIdr } from "@/lib/numberToIdr";
import { SHOPEE, TOKOPEDIA } from "@/constant/resource-and-link";

type OrderDetailProps = {
  slug: string;
  selectedSize: string;
  selectedGrind: string;
  qty: number;
  imageSrc?: string;
  variantText?: string;
  unitPrice?: number;
  priceBySize?: Record<string, number>;
  sizeOptions?: string[];
  grindOptions?: string[];
  productSlug?: string;
};

const DEFAULT_SIZES = ["100g", "200g", "1kg"];
const DEFAULT_GRINDS = ["Beans", "Grind Fine", "Grind Medium"];

const OrderDetail = ({
  slug,
  selectedSize,
  selectedGrind,
  qty,
  imageSrc = "/assets/coffe/blend-gayo.png",
  unitPrice,
  priceBySize,
  sizeOptions = DEFAULT_SIZES,
  grindOptions = DEFAULT_GRINDS,
  productSlug,
}: OrderDetailProps) => {
  const router = useRouter();

  const [size, setSize] = useState<string>(() =>
    selectedSize || sizeOptions[0] || "",
  );
  const [grind, setGrind] = useState<string>(() =>
    selectedGrind || grindOptions[0] || "",
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(selectedSize || sizeOptions[0] || "");
  }, [selectedSize, sizeOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrind(selectedGrind || grindOptions[0] || "");
  }, [selectedGrind, grindOptions]);

  const currentUnitPrice = useMemo(() => {
    if (priceBySize && size) {
      const v = priceBySize[size];
      if (typeof v === "number") return v;
    }
    return typeof unitPrice === "number" ? unitPrice : 0;
  }, [priceBySize, size, unitPrice]);

  const priceText = numberToIdr({ nominal: currentUnitPrice });
  const subtotal = currentUnitPrice * Math.max(0, qty);

  const goCheckout = () => {
    const params = new URLSearchParams({
      slug,
      size: size || "",
      grind: grind || "",
      qty: String(Math.max(0, qty || 0)),
    });
    router.push(`/product/${productSlug}/checkout?${params.toString()}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Beli Langsung</Button>
      </SheetTrigger>

      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Varian produk</SheetTitle>
          <SheetDescription>
            Pilih ukuran dan level gilingan yang Anda inginkan sebelum melanjutkan.
          </SheetDescription>
        </SheetHeader>

        <div className="inline-flex gap-3 my-3 items-end mb-4">
          <div className="bg-[#242424] p-2 rounded-xl">
            <Image src={imageSrc} width={64} height={64} alt="produk" />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-secondary">
              {`${size || "Pilih ukuran"}, ${grind || "Pilih grind"}`}
            </div>

            <div className="text-base font-extrabold text-primary">
              {qty > 0 ? (
                <>
                  {priceText} <span className="opacity-70">× {qty}</span>{" "}
                  <span className="ml-1">
                    = {numberToIdr({ nominal: subtotal })}
                  </span>
                </>
              ) : (
                priceText
              )}
            </div>
          </div>
        </div>

        {/* Size selector */}
        <div className="text-base font-bold text-primary">Pilih ukuran :</div>
        <div className="inline-flex gap-2 items-center mt-2">
          {sizeOptions.map((opt) => {
            const active = size === opt;
            return (
              <Badge
                key={opt}
                variant={active ? "active" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => setSize(opt)}
                aria-pressed={active}
                role="button"
              >
                {opt}
              </Badge>
            );
          })}
        </div>

        {/* Grind selector */}
        <div className="text-base font-bold text-primary mt-4">
          Pilih grind level :
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-2 pb-24">
          {grindOptions.map((opt) => {
            const active = grind === opt;
            return (
              <Badge
                key={opt}
                variant={active ? "active" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => setGrind(opt)}
                aria-pressed={active}
                role="button"
              >
                {opt}
              </Badge>
            );
          })}
        </div>

        <div className="p-3 bg-[#141414] absolute bottom-0 w-full inset-x-0">
          <Button variant="outline" onClick={goCheckout}>
            Beli Langsung
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

type FloatingCheckoutButtonProps = {
  slug: string;
  selectedSize: string;
  selectedGrind: string;
  qty: number;
  imageSrc?: string;
  variantText?: string;
  unitPrice?: number;
  priceBySize?: Record<string, number>;
  productSlug: string;
  sizeOptions?: string[];
  grindOptions?: string[];
};

export const FloatingCheckoutButton = ({
  slug,
  selectedSize,
  selectedGrind,
  qty,
  imageSrc,
  variantText,
  unitPrice,
  priceBySize,
  sizeOptions,
  grindOptions,
  productSlug,
}: FloatingCheckoutButtonProps) => {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 w-full left-0 desktop:hidden bg-black inline-flex gap-5 z-40 px-6 items-center py-4" style={{ scrollBehavior: 'auto' }}>
      <div className="inline-flex items-center gap-2">
        <Button
          size="icon"
          className="w-14 h-10 px-4"
          onClick={() => router.push(TOKOPEDIA)}
        >
          <Image
            src="/assets/tokopedia.svg"
            width={24}
            height={24}
            alt="tokopedia"
            style={{ height: 'auto' }} // Maintain aspect ratio
          />
        </Button>
        <Button
          size="icon"
          className="w-14 h-10 px-4"
          onClick={() => router.push(SHOPEE)}
        >
          <Image
            src="/assets/shoppe.svg"
            width={24}
            height={24}
            alt="tokopedia"
            style={{ height: 'auto' }} // Maintain aspect ratio
          />
        </Button>
      </div>

      <OrderDetail
        slug={slug}
        selectedSize={selectedSize}
        selectedGrind={selectedGrind}
        qty={qty}
        imageSrc={imageSrc}
        variantText={variantText}
        unitPrice={unitPrice}
        priceBySize={priceBySize}
        sizeOptions={sizeOptions}
        grindOptions={grindOptions}
        productSlug={productSlug}
      />
    </div>
  );
};
