import { z } from 'zod'

export type ShippingCalcItem = {
  name: string;
  description?: string;
  value: number;
  length: number;
  width: number;
  height: number;
  weight: number; // grams
  quantity: number;
};

export type ShippingCalcParams = {
  originPostalCode: string | number;
  destinationPostalCode?: string | number;
  quantity: number;
  price: number; // IDR per unit
  name: string;
  description?: string;
  length?: number;
  width?: number;
  height?: number;
  weightGrams: number; // from variant.shipWeightGrams
  couriers?: string; // comma separated
  // Optional geolocation for destination; if provided, use these over postal code
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  // Optional: when provided, sent directly instead of building from scalar fields above
  items?: ShippingCalcItem[];
};

export type ShippingItem = {
  name: string;
  description?: string;
  value: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
};

export type ShippingRateRequest = {
  origin_postal_code: number | string;
  destination_postal_code?: number | string;
  couriers: string;
  items: ShippingItem[];
  destination_latitude?: number | null;
  destination_longitude?: number | null;
};

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
      quantity: z.number().int().positive(),
    })
  ).min(1, "Minimal 1 item diperlukan"),
});

export type ShippingRequestPayload = z.infer<typeof ShippingRequestSchema>;

// ---- Biteship pricing item (subset we actually use) ----
export const BiteshipPricingSchema = z.object({
  company: z.string().optional(),              // e.g., 'jne'
  courier_name: z.string(),                    // 'JNE'
  courier_code: z.string(),                    // 'jne'
  courier_service_name: z.string(),            // 'City to City (CTC)'
  courier_service_code: z.string(),            // 'ctc'
  description: z.string().optional(),
  duration: z.string().optional(),             // '2 - 3 days'
  shipment_duration_range: z.string().optional(),
  shipment_duration_unit: z.string().optional(),
  service_type: z.string().optional(),         // 'standard', 'overnight', ...
  shipping_type: z.string().optional(),        // 'parcel', 'freight'
  price: z.number().int().nonnegative(),
  currency: z.string().default('IDR'),
  available_collection_method: z.array(z.string()).optional(),
  available_for_cash_on_delivery: z.boolean().optional(),
  available_for_proof_of_delivery: z.boolean().optional(),
  available_for_instant_waybill_id: z.boolean().optional(),
  available_for_insurance: z.boolean().optional(),
  tax_lines: z.array(z.any()).optional(),
  type: z.string().optional(),
});
export type BiteshipPricing = z.infer<typeof BiteshipPricingSchema>;

// ---- Full Biteship response (trimmed to relevant fields) ----
export const BiteshipRatesResponseSchema = z.object({
  success: z.boolean().optional(),
  object: z.string().optional(),
  message: z.string().optional(),
  code: z.number().optional(),
  origin: z.record(z.any()).optional(),
  destination: z.record(z.any()).optional(),
  pricing: z.array(BiteshipPricingSchema),
});
export type BiteshipRatesResponse = z.infer<typeof BiteshipRatesResponseSchema>;

// ---- UI-facing normalized type ----
export type NormalizedRate = {
  carrier: string;              // 'JNE'
  code: string;                 // 'jne-ctc'
  service: string;              // 'City to City (CTC)'
  eta?: string;                 // '2 - 3 days'
  price: number;                // IDR
  raw: BiteshipPricing;         // keep raw for debugging
};

// ---- Legacy types for backward compatibility ----
export const VerifiedLocationSchema = z.object({
  postal_code: z.string(),
  province: z.string(),
  city: z.string(),
  district: z.string(),
});

export type VerifiedLocation = z.infer<typeof VerifiedLocationSchema>;

// Legacy schema - deprecated, use BiteshipRatesResponseSchema instead
export const ShippingPricingSchema = BiteshipPricingSchema;
export type ShippingPricing = BiteshipPricing;

export const ShippingResponseSchemaV2 = z.object({
  pricing: z.array(ShippingPricingSchema),
  location: VerifiedLocationSchema.optional(),
});
