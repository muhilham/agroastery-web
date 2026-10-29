import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProductBySlug, getAggregateSoldCount } from "@/lib/supabase/queries/products";
import { getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import type { SupabaseProduct } from "@/types/product";
import SupabaseProductDetail from "@/components/section/product-detail/SupabaseProductDetail";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { buildMetaProductTags, resolveInitialSelection, resolveShownVariant } from "@/lib/shopping/metaProduct";
import { productFaqs, purchasablePackPrices, priceAnchor, idr } from "@/lib/shopping/productFaq";
import { faqJsonLd } from "@/lib/seo/content-jsonld";

const getCachedProductBySlug = cache(getProductBySlug);

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

const DEFAULT_OG_IMAGE = "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

function stripHtml(html: string): string {
  const text = html.replace(/<[^>]*>/g, "");
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;" : '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };
  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (match) => entityMap[match] ?? match);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
}

function buildProductDescription(product: SupabaseProduct): string {
  // Issue #235: the old copy bled a stray min-variant price ("...budget... —
  // Rp 29.370" was the 100g pack) into every meta description, undercutting
  // the per-kg anchor users actually search for. Lead with the use-case
  // sentence and anchor on the purchasable kg pack rate (never min variant).
  const anchor = priceAnchor(purchasablePackPrices(product));
  // Price label must match the pack the number comes from — a 500g pack
  // price never gets "/kg" appended.
  const priceStr = anchor
    ? anchor.kind === "kg"
      ? `${idr(anchor.price)}/kg`
      : `${idr(anchor.price)} per pack`
    : null;

  const lead =
    product.short_description?.trim() ||
    stripHtml(product.description ?? "").trim() ||
    "";

  if (!lead) {
    return priceStr
      ? `Beli ${product.name} di Agroastery — ${priceStr}, kirim seluruh Indonesia`
      : `Beli ${product.name} di Agroastery — kirim seluruh Indonesia`;
  }

  if (priceStr) {
    const suffix = ` — ${priceStr}, kirim seluruh Indonesia`;
    // truncateText appends "..." — reserve its 3 chars so the final string
    // stays within the 160-char acceptance budget (issue #235).
    const budget = 160 - suffix.length - 3;
    return `${truncateText(lead, budget)}${suffix}`;
  }
  return truncateText(lead, 155);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata | null> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return null;
  }

  const description = buildProductDescription(product);
  const imageUrl = getProductImageUrl(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const ogImage = imageUrl.startsWith("http") ? imageUrl : siteUrl ? `${siteUrl}${imageUrl}` : DEFAULT_OG_IMAGE;

  return {
    title: `${product.name} | Agroastery`,
    description,
    alternates: {
      canonical: `${siteUrl}/product/${slug}`,
    },
    openGraph: {
      title: `${product.name} | Agroastery`,
      description,
      images: [
        {
          url: ogImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Agroastery`,
      description,
      images: [{ url: ogImage, alt: product.name }],
    },
  };
}

function productJsonLd(product: SupabaseProduct, siteUrl: string): Record<string, unknown> {
  const minPrice = getMinPrice(product.product_variants);
  const imageUrl = getProductImageUrl(product);
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const inStock = activeVariants.some((v) => v.stock_quantity > 0);
  const description = stripHtml(product.description ?? "").slice(0, 200);
  const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${siteUrl}${imageUrl}`;
  const highPrice = activeVariants.length > 0
    ? Math.max(...activeVariants.map((v) => v.price))
    : minPrice;
  // Meta catalog matching uses gtin/mpn/sku; our SKUs are the merchant item ids.
  const skus = activeVariants.map((v) => v.sku).filter((s): s is string => Boolean(s));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description || product.short_description || product.name,
    image: [fullImageUrl],
    url: `${siteUrl}/product/${product.slug}`,
    sku: skus.length === 1 ? skus[0] : (product.id ?? undefined),
    mpn: skus[0] ?? product.id,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IDR",
      lowPrice: minPrice,
      highPrice,
      offerCount: activeVariants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${product.slug}`,
    },
    brand: {
      "@type": "Brand",
      name: "Agroastery",
    },
  };
}

function escapeJsonLd(str: string): string {
  return str.replace(/<\/script>/gi, "<\\/script>").replace(/<!--/g, "<\\!--");
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { variant } = await searchParams;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // All-channel lifetime sold count from product_sold_counts (agr-ops sync);
  // null when the table doesn't exist yet → component falls back to
  // products.total_sold_count (web + recent marketplace deltas).
  const aggregateSoldCount = await getAggregateSoldCount(product.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";
  const jsonLd = productJsonLd(product, siteUrl);
  const jsonStr = escapeJsonLd(JSON.stringify(jsonLd));
  // One FAQ list feeds BOTH the visible block (SupabaseProductDetail) and the
  // FAQPage JSON-LD — Google's parity rule: markup must match shown content
  // (issue #235; same pattern as lib/seo/content-jsonld.ts on content pages).
  const faqs = productFaqs(product);
  const faqHtml = faqJsonLd(faqs).__html;

  // Open Graph product namespace: what MetaExternalAgent scrapes to match a
  // catalog item against this page. Tag the variant the shopper actually
  // lands on (?variant= deep link, else the form's default selection) so
  // price/SKU/stock the crawler sees matches the rendered page.
  const tagVariant = resolveShownVariant(product, variant);
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const metaTags = buildMetaProductTags({
    productId: product.id,
    sku: tagVariant?.sku ?? null,
    price: tagVariant
      ? (tagVariant.discounted_price ?? tagVariant.price)
      : getMinPrice(activeVariants),
    inStock: Boolean(tagVariant && tagVariant.stock_quantity > 0),
  });

  return (
    <>
      {/* React hoists these into <head> alongside the resolved metadata. */}
      {metaTags.map((t) => (
        <meta key={t.property} property={t.property} content={t.content} />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonStr }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqHtml }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", url: "/" },
          { name: "Katalog", url: "/katalog" },
          { name: product.name, url: `/product/${slug}` },
        ]}
        siteUrl={siteUrl}
      />
      <SupabaseProductDetail
        product={product}
        initialSelection={resolveInitialSelection(product, variant)}
        aggregateSoldCount={aggregateSoldCount}
        faqs={faqs}
      />
    </>
  );
}