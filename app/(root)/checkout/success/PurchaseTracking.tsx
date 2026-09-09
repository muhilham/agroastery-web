"use client";

import { useEffect, useRef } from "react";
import { trackPurchase, type PurchaseItem } from "@/lib/analytics/gtag";

const DEDUPE_KEY_PREFIX = "ga4_purchase_tracked_";

type Props = {
  transactionId: string;
  value: number;
  shipping: number;
  items: PurchaseItem[];
};

export default function PurchaseTracking({ transactionId, value, shipping, items }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    // Fire exactly once per order. The ref guard covers React re-mounts
    // (StrictMode double-invoke), sessionStorage covers refresh/back-nav to
    // the same order in the same tab. GA4 additionally dedupes duplicate
    // purchase events sharing the same transaction_id as a server-side
    // backstop.
    const dedupeKey = `${DEDUPE_KEY_PREFIX}${transactionId}`;
    if (firedRef.current || sessionStorage.getItem(dedupeKey)) return;
    firedRef.current = true;
    sessionStorage.setItem(dedupeKey, "1");
    trackPurchase({ transactionId, value, shipping, items });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return null;
}
