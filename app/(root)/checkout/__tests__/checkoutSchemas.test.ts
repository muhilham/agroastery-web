import { describe, it, expect } from "vitest";
import { guestFormSchema, loggedInFormSchema } from "../checkoutSchemas";

const validBase = {
  fullName: "Budi Santoso",
  phone: "081234567890",
  address: "Jl. Kemang Barat No. 7, Jakarta Selatan",
  postalCode: "12730",
};

describe("guestFormSchema", () => {
  it("fails when email is missing", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(false);
  });

  it("fails when email is missing with correct message", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.errors.filter(e => e.path.includes("email"));
      expect(emailErrors[0].message).toBe("Email wajib diisi");
    }
  });

  it("fails when email is invalid", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("passes when email is a valid address", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "budi@gmail.com" });
    expect(result.success).toBe(true);
  });
});

describe("loggedInFormSchema", () => {
  it("passes when email is omitted", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
  });

  it("passes when email is empty string", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(true);
  });

  it("passes when email is null", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase, email: null });
    expect(result.success).toBe(true);
  });
});
