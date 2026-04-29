import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/supabase/queries/products";
import SupabaseProductDetail from "@/components/section/product-detail/SupabaseProductDetail";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <SupabaseProductDetail product={product} />;
}
