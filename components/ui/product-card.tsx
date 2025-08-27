"use client";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { selectProductBySlug } from "@/lib/stores/product";

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
        <Image src={productImage} alt={productTitle} width={500} height={500} />
        <CardHeader>
          <CardTitle>{productTitle}</CardTitle>
          <CardDescription>{productDescription}</CardDescription>
        </CardHeader>
      </div>
      <CardFooter>From {numberToIdr({ nominal: productPrice })}</CardFooter>
    </Card>
  );
}
