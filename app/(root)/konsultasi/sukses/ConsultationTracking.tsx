"use client";

import { useEffect } from "react";
import { trackBookConsultation } from "@/lib/analytics/gtag";

const DEDUPE_KEY_PREFIX = "ga4_consultation_tracked_";

type Props = {
  bookingId: string;
  value: number;
};

export default function ConsultationTracking({ bookingId, value }: Props) {
  useEffect(() => {
    // book_consultation is a custom event — GA4's transaction_id dedupe
    // (used for `purchase`) does not apply here, so a refresh or back-nav
    // would double-count without this session-scoped guard.
    const dedupeKey = `${DEDUPE_KEY_PREFIX}${bookingId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");
    trackBookConsultation({ value });
  }, [bookingId, value]);

  return null;
}
