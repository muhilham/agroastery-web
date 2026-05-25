import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/supabase/queries/products";
import { getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import { numberToIdr } from "@/lib/numberToIdr";
import type { SupabaseProduct } from "@/types/product";
import SupabaseProductDetail from "@/components/section/product-detail/SupabaseProductDetail";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const DEFAULT_OG_IMAGE = "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  const minPrice = getMinPrice(product.product_variants);
  const description = buildProductDescription(product, minPrice);
  const imageUrl = getProductImageUrl(product);
  const ogImage = imageUrl.startsWith("http") ? imageUrl : DEFAULT_OG_IMAGE;

  return {
    title: `${product.name} | Agroastery`,
    description,
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
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <SupabaseProductDetail product={product} />;
}
