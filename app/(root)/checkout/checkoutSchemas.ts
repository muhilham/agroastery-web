import { z } from "zod";

const baseSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().min(5, "Kode pos tidak valid").max(5),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export const guestFormSchema = baseSchema.extend({
  email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
});

export const loggedInFormSchema = baseSchema.extend({
  email: z.string().email().or(z.literal("")).nullable().optional(),
});

// TForm is derived from the permissive schema so it works for both guest and
// logged-in users (email?: string | null | undefined). The guest resolver enforces
// email is required at runtime via Zod — not via the TypeScript type.
export type TForm = z.infer<typeof loggedInFormSchema>;
