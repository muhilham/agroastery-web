import ProductDetailPage from "@/components/section/product-detail";

export default function Page({ params }: { params: { slug: string } }) {
  return <ProductDetailPage slug={params.slug} />;
}
