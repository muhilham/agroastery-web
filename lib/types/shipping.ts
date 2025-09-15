import { z } from 'zod'

export const ShippingRequestSchema = z.object({
  destination: z.object({
    contact_name: z.string().min(2, "Nama terlalu pendek"),
    contact_phone: z.string().min(6, "Nomor telepon tidak valid"),
    address: z.string().min(10, "Alamat terlalu pendek"),
    postal_code: z.string().length(5, "Kode pos harus 5 digit"),
  }),
  items: z.array(
    z.object({
      name: z.string(),
      value: z.number().positive(),
      weight: z.number().positive(),
      height: z.number().positive(),
      length: z.number().positive(),
      width: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Minimal 1 item diperlukan"),
});

export type ShippingRequestPayload = z.infer<typeof ShippingRequestSchema>;

export const ShippingPricingSchema = z.object({
  available_collection_method: z.array(z.string()),
  available_for_cash_on_delivery: z.boolean(),
  available_for_proof_of_delivery: z.boolean(),
  available_for_instant_waybill_id: z.boolean(),
  available_for_insurance: z.boolean(),
  company: z.string(),
  courier_name: z.string(),
  courier_code: z.string(),
  courier_service_name: z.string(),
  courier_service_code: z.string(),
  currency: z.string(),
  description: z.string(),
  duration: z.string(),
  shipment_duration_range: z.string(),
  shipment_duration_unit: z.string(),
  service_type: z.string(),
  shipping_type: z.string(),
  price: z.number(),
  tax_lines: z.array(z.any()), // Assuming tax_lines can be any type for now
  type: z.string(),
})

export const ShippingResponseSchema = z.object({
  pricing: z.array(ShippingPricingSchema),
})

export type ShippingPricing = z.infer<typeof ShippingPricingSchema>
