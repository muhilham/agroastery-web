type BreadcrumbItem = {
  name: string;
  url: string;
};

function escapeJsonLd(str: string): string {
  return str.replace(/<\/script>/gi, "<\\/script>").replace(/<!--/g, "<\\!--");
}

export function BreadcrumbJsonLd({
  items,
  siteUrl,
}: {
  items: BreadcrumbItem[];
  siteUrl?: string;
}) {
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${base}${item.url}`,
    })),
  };

  const jsonStr = escapeJsonLd(JSON.stringify(jsonLd));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonStr }}
    />
  );
}