"use client";

import { useEffect, useRef } from "react";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function OnboardingStartTracker() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackBlendEvent("onboarding_started");
  }, []);

  return null;
}
