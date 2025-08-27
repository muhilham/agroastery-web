import CheckoutPage from "@/components/section/checkout";

type PageProps = {
  params: { slug: string };
  searchParams: { size?: string; grind?: string; qty?: string };
};

export default function Page({ params, searchParams }: PageProps) {
  const qty = Number.parseInt(searchParams.qty ?? "0", 10);
  return (
    <CheckoutPage
      slug={params.slug}
      defaultSize={searchParams.size ?? ""}
      defaultGrind={searchParams.grind ?? ""}
      defaultQty={Number.isFinite(qty) ? Math.max(0, qty) : 0}
    />
  );
}
