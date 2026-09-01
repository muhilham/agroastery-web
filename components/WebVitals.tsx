"use client";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", metric.name, {
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value,
        ),
        metric_label: metric.label,
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        navigation_type: metric.navigationType,
      });
    }
  });
  return null;
}