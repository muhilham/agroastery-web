import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Use configured app URL instead of request.url origin —
  // in containerized environments (Railway, etc.) request.url may resolve
  // to the internal bind address (e.g. 0.0.0.0:8080) rather than the public domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";

  // Validate next is a safe relative path — prevent open redirect
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Link all guest orders that share this user's email — idempotent
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const admin = createSupabaseAdminClient();
          await admin
            .from("ecom_orders")
            .update({ user_id: user.id })
            .eq("customer_email", user.email)
            .is("user_id", null);
        }
      } catch (linkErr) {
        // Non-critical — log and continue. Orders will be linked on next login.
        console.error("[auth/callback] Failed to link guest orders:", linkErr);
      }

      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
}
