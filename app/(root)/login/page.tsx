"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-[#111111] px-4 py-8">
      <div className="w-full max-w-md p-6 tablet:p-8 rounded-2xl bg-[#1a1a1a] border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-xl tablet:text-2xl font-semibold text-white mb-2">Masuk ke Agroastery</h1>
          <p className="text-white/60 text-sm">
            Masuk untuk melihat riwayat pesanan dan menyimpan alamat pengiriman
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            Login gagal. Silakan coba lagi.
          </div>
        )}

        <Button
          onClick={signInWithGoogle}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 active:bg-white/80 font-medium text-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Lanjutkan dengan Google
        </Button>

        <p className="mt-6 text-center text-xs text-white/40 leading-relaxed">
          Dengan masuk, kamu menyetujui syarat dan ketentuan Agroastery
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <LoginForm />
    </Suspense>
  );
}
