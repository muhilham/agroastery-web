"use client";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { useRouter } from "next/navigation";
import { selectProductBySlug } from "@/lib/stores/product";
import Image from "next/image";

interface I_ProductCardProps {
  productSlug: string;
  productImage: string;
  productTitle: string;
  productDescription: string;
  productPrice: number;
  onClick?: () => void;
}

export function ProductCard({
  productSlug,
  productDescription,
  productImage,
  productTitle,
  productPrice,
  onClick,
}: I_ProductCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) return onClick();
    selectProductBySlug(productSlug);
    router.push(`/product/${productSlug}`);
  };

  return (
    <Card
      className="relative flex flex-col justify-between cursor-pointer"
      role="button"
      onClick={handleClick}
    >
      <div>
        <div className="relative aspect-[16/9]  w-full overflow-hidden rounded-t-xl mb-4">
          <div className="w-full h-14 bg-gradient-to-t from-[#252525] absolute bottom-0"></div>
          <div className="w-full h-14 bg-gradient-to-b from-[#252525] absolute top-0"></div>
          <Image
            src={productImage}
            alt={productTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </div>
        <CardHeader>
          <CardTitle>{productTitle}</CardTitle>
          <CardDescription className="line-clamp-2 text-[#CCC4A9]">
            {productDescription}
          </CardDescription>
        </CardHeader>
      </div>
      <CardFooter>From {numberToIdr({ nominal: productPrice })}</CardFooter>
    </Card>
  );
}
