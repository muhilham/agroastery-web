import CheckoutPage from "@/components/section/checkout";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ size?: string; grind?: string; qty?: string }>;
};

export const runtime = "edge";

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const rawQty = Number.parseInt(sp?.qty ?? "0", 10);
  const qty = Number.isFinite(rawQty) ? Math.max(0, rawQty) : 0;

  return (
    <CheckoutPage
      slug={slug}
      defaultSize={sp?.size ?? ""}
      defaultGrind={sp?.grind ?? ""}
      defaultQty={qty}
    />
  );
}
