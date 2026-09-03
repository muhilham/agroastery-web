"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Address } from "@/lib/supabase/queries/addresses";

export type { Address };

export function useAddresses() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Defer to a microtask: synchronous setState in an effect body triggers cascading renders.
      queueMicrotask(() => setAddresses([]));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => setIsLoading(true));

    fetch("/api/account/addresses")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ data: Address[] }>;
      })
      .then(({ data }) => {
        if (!cancelled) setAddresses(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { addresses, isLoading };
}
