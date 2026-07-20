import { z } from "zod";

export const CheckoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});

export const ShippingAddressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  addressLine: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hours: z.string().optional(),
});

export const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1).max(50),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(1),
  shippingAddress: ShippingAddressSchema,
  shippingCourier: z.string().optional(),
  shippingService: z.string().optional(),
  shippingCost: z.number().int().nonnegative().default(0),
  shippingEtd: z.string().optional(),
  fulfillmentMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
});
