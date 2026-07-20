import { z } from "zod";

const baseSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().max(300).optional(),
  postalCode: z.string().max(5).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
  fulfillmentMethod: z.enum(["delivery", "pickup"]).default("delivery"),
});

function refineFulfillment(data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) {
  if (data.fulfillmentMethod !== "delivery") return;
  if (!data.address || data.address.trim().length < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Alamat terlalu singkat" });
  }
  if (!data.postalCode || data.postalCode.length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["postalCode"], message: "Kode pos tidak valid" });
  }
}

export const guestFormSchema = baseSchema
  .extend({ email: z.string().min(1, "Email wajib diisi").email("Email tidak valid") })
  .superRefine(refineFulfillment);

export const loggedInFormSchema = baseSchema
  .extend({ email: z.string().email().or(z.literal("")).nullable().optional() })
  .superRefine(refineFulfillment);

// TForm is derived from the permissive schema so it works for both guest and
// logged-in users (email?: string | null | undefined). The guest resolver enforces
// email is required at runtime via Zod — not via the TypeScript type.
// Use z.input to get the pre-default type so react-hook-form's resolver types align.
export type TForm = z.input<typeof loggedInFormSchema>;
