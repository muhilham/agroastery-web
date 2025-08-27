import ProductDetailPage from "@/components/section/product-detail";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const runtime = "edge";

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}