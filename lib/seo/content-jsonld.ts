/**
 * JSON-LD builders for the issue #178 SEO content pages.
 *
 * Pure data functions returning { __html } payloads (same pattern as
 * lib/consultations/jsonld.ts) so unit tests assert structure without
 * rendering a page tree. Breadcrumb JSON-LD stays on <BreadcrumbJsonLd />
 * from components/ — do not duplicate it here.
 */
import type { ArabicaPriceRow } from "./arabica-pricing";
import { SITE_URL } from "./content-pages";

/** CollectionPage with a product sub-graph built from the live catalog grid. */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  products: Array<{
    slug: string;
    name: string;
    shortDescription?: string | null;
    description?: string | null;
    price: number;
  }>;
}): { __html: string } {
  const graph = opts.products
    .filter((product) => product.price > 0)
    .map((product) => ({
      "@type": "Product" as const,
      name: product.name,
      url: `${SITE_URL}/product/${product.slug}`,
      description:
        stripHtml(product.shortDescription ?? product.description) ||
        product.name,
      offers: {
        "@type": "Offer" as const,
        price: product.price,
        priceCurrency: "IDR",
        url: `${SITE_URL}/product/${product.slug}`,
      },
    }));

  const json = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.url}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: graph.length,
      itemListElement: graph.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item,
      })),
    },
  };
  return { __html: escapeJsonLd(JSON.stringify(json)) };
}

/**
 * ItemList of Products for the Arabica price table. Each row contributes one
 * Product with its single cheapest purchasable pack as the Offer price —
 * the extrapolated per-kg rate (bestPerKg) is an *effective* figure and must
 * NOT be used as a structured-data price (Google silences mismatched-price
 * offers when the landing page shows a different purchasable price).
 */
export function arabicaPriceListJsonLd(
  rows: ArabicaPriceRow[],
  url: string
): { __html: string } {
  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Daftar Harga Biji Kopi Arabica per Kilogram",
    url: `${SITE_URL}${url}`,
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: row.name,
        url: `${SITE_URL}/product/${row.slug}`,
        offers: {
          "@type": "Offer",
          price: row.bestPack.price,
          priceCurrency: "IDR",
          url: `${SITE_URL}/product/${row.slug}`,
        },
      },
    })),
  };
  return { __html: escapeJsonLd(JSON.stringify(json)) };
}

/** FAQPage built from the SAME visible FAQ list the page renders (Google parity rule). */
export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>
): { __html: string } {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return { __html: escapeJsonLd(JSON.stringify(json)) };
}

function escapeJsonLd(value: string): string {
  return value
    .replace(/<\/script>/gi, "<\\/script>")
    .replace(/<!--/g, "<\\!--");
}

function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
