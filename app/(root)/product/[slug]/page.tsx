import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProductBySlug } from "@/lib/supabase/queries/products";
import { getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import { numberToIdr } from "@/lib/numberToIdr";
import type { SupabaseProduct } from "@/types/product";
import SupabaseProductDetail from "@/components/section/product-detail/SupabaseProductDetail";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { buildMetaProductTags, resolveInitialSelection, resolveShownVariant } from "@/lib/shopping/metaProduct";

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

function buildProductDescription(product: SupabaseProduct, price: number): string {
  const priceStr = numberToIdr({ nominal: price });

  if (product.short_description) {
    const truncated = truncateText(product.short_description, 150);
    return `${truncated} — ${priceStr}`;
  }

  if (product.description) {
    const plain = stripHtml(product.description);
    if (plain.trim()) {
      const truncated = truncateText(plain.trim(), 150);
      return `${truncated} — ${priceStr}`;
    }
  }

  return `Beli ${product.name} di Agroastery — ${priceStr}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata | null> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return null;
  }

  const minPrice = getMinPrice(product.product_variants);
  const description = buildProductDescription(product, minPrice);
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

function faqJsonLd(product: SupabaseProduct, siteUrl: string): Record<string, unknown> {
  const productUrl = `${siteUrl}/product/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Berapa gram per porsi ${product.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Kami menyediakan berbagai ukuran gramase untuk ${product.name}. Silakan pilih varian yang tersedia sesuai kebutuhan cafe atau konsumsi pribadi Anda.`,
        },
      },
      {
        "@type": "Question",
        name: `Apakah ${product.name} bisa digiling?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Ya, ${product.name} dapat digiling sesuai metode seduh pilihan Anda. Pilih opsi gilingan saat checkout — espresso, V60, French Press, atau lainnya.`,
        },
      },
      {
        "@type": "Question",
        name: `Berapa lama resting period ${product.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Resting period bervariasi tergantung profil roast. Umumnya kopi kami optimal setelah 7-14 hari post-roast. Detail spesifik tercantum pada kemasan produk.`,
        },
      },
      {
        "@type": "Question",
        name: `${product.name} cocok untuk espresso atau susu?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${product.name} memiliki karakter yang dapat dinikmati sebagai espresso maupun basis minuman susu. Cek catatan rasa pada deskripsi produk untuk rekomendasi terbaik.`,
        },
      },
    ],
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";
  const jsonLd = productJsonLd(product, siteUrl);
  const jsonStr = escapeJsonLd(JSON.stringify(jsonLd));
  const faqLd = faqJsonLd(product, siteUrl);
  const faqStr = escapeJsonLd(JSON.stringify(faqLd));

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
        dangerouslySetInnerHTML={{ __html: faqStr }}
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
      />
    </>
  );
}