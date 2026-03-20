import { redirect } from "next/navigation";

// This single-product checkout is now replaced by the unified cart-based checkout.
// Redirect users to the cart page so they can proceed via the new flow.
export default async function Page() {
  redirect("/cart");
}
