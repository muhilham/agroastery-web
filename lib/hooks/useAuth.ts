"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $user, $authLoading } from "@/lib/stores/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuth() {
  const user = useStore($user);
  const loading = useStore($authLoading);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      $user.set(data.user ?? null);
      $authLoading.set(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      $user.set(session?.user ?? null);
      $authLoading.set(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    $user.set(null);
  }

  return { user, loading, signIn, signOut };
}
