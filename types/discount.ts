export type DiscountType = "percentage" | "nominal";

export type Discount = {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  is_active: boolean;
};

export type GlobalDiscount = Discount;

export type ProductDiscount = Discount & {
  product_id: string;
};

export type DiscountResult = {
  discountedPrice: number;
  hasDiscount: boolean;
};
