"use client";

import { useEffect } from "react";
import { trackPurchase, type PurchaseItem } from "@/lib/analytics/gtag";

type Props = {
  transactionId: string;
  value: number;
  shipping: number;
  items: PurchaseItem[];
};

export default function PurchaseTracking({ transactionId, value, shipping, items }: Props) {
  useEffect(() => {
    trackPurchase({ transactionId, value, shipping, items });
    // Deliberately fires once per mount keyed only on transactionId — GA4
    // dedupes duplicate purchase events sharing the same transaction_id
    // natively, so no local guard is needed even on refresh/back-nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return null;
}
