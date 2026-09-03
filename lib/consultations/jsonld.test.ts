import { describe, expect, it } from "vitest";
import { CONSULTATION_FEE_IDR } from "./constants";
import { consultationJsonLd } from "./jsonld";

type JsonLdNode = Record<string, unknown>;

function nodes(): JsonLdNode[] {
  return JSON.parse(consultationJsonLd().__html) as JsonLdNode[];
}

describe("consultationJsonLd", () => {
  it("describes the consultation Service with its price and availability", () => {
    const service = nodes().find((node) => node["@type"] === "Service");

    expect(service).toMatchObject({
      "@context": "https://schema.org",
      name: "Konsultasi Kopi untuk Cafe",
      provider: { "@type": "LocalBusiness", name: "Agroastery" },
      offers: { price: CONSULTATION_FEE_IDR, priceCurrency: "IDR" },
      hoursAvailable: {
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday"],
      },
    });
  });

  it("describes Agroastery as a complete LocalBusiness", () => {
    const business = nodes().find((node) => node["@type"] === "LocalBusiness");

    expect(business).toMatchObject({
      name: "Agroastery",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com",
      telephone: "+628****2726",
      geo: { "@type": "GeoCoordinates", latitude: -6.2637061, longitude: 106.8194468 },
      openingHours: "Mo-Su 10:00-20:00",
      address: {
        "@type": "PostalAddress",
        streetAddress: expect.any(String),
        addressLocality: "Kota Jakarta Selatan",
        addressRegion: "DKI Jakarta",
        postalCode: "12730",
        addressCountry: "ID",
      },
    });
  });
});
