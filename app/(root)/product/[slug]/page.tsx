import ProductDetailPage from "@/components/section/product-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
