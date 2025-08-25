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

interface I_PorductCardProps {
  productImage: string;
  productTitle: string;
  productDescription: string;
  productPrice: number;
  onClick?: () => void;
}
export function ProductCard({
  productDescription,
  productImage,
  productTitle,
  productPrice,
}: I_PorductCardProps) {
  const router = useRouter();
  return (
    <Card
      className="relative flex flex-col justify-between cursor-pointer"
      role="button"
      onClick={() => router.push("/product")}
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
