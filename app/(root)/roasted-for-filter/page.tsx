import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProductGrid from "@/components/product-grid";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { getProducts, getMinPrice } from "@/lib/supabase/queries/products";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  OG_IMAGE,
  productsInCategory,
  ROASTED_FOR_FILTER_CATEGORY,
} from "@/lib/seo/content-pages";
import { collectionPageJsonLd } from "@/lib/seo/content-jsonld";

export const metadata: Metadata = {
  title: "Roasted for Filter — Biji Kopi Seduh Manual — Agroastery",
  description:
    "Kopi sangrai khusus seduh manual (V60, tubruk, French press): single origin Gayo, Kintamani, Ethiopia, hingga microlot. Beli online langsung dari roastery Jakarta Selatan atau booking konsultasi.",
  alternates: { canonical: "/roasted-for-filter" },
  openGraph: {
    title: "Roasted for Filter — Biji Kopi Seduh Manual — Agroastery",
    description:
      "Single origin dan microlot dengan sangrai light-to-medium, dirancang untuk V60, tubruk, dan French press.",
    url: "/roasted-for-filter",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Biji kopi roasted for filter Agroastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roasted for Filter — Biji Kopi Seduh Manual — Agroastery",
    description:
      "Single origin dan microlot untuk seduh manual, langsung dari roastery Jakarta Selatan.",
    images: [OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";

export default async function RoastedForFilterPage() {
  const allProducts = await getProducts();
  const products = productsInCategory(
    allProducts,
    ROASTED_FOR_FILTER_CATEGORY
  );
  const cheapest = products.length
    ? Math.min(
        ...products
          .map((p) => getMinPrice(p.product_variants))
          .filter((n) => n > 0)
      )
    : null;

  const jsonLd = collectionPageJsonLd({
    name: "Roasted for Filter — Biji Kopi Seduh Manual",
    description:
      "Kumpulan biji kopi sangrai Agroastery yang dirancang untuk metode seduh manual.",
    url: "/roasted-for-filter",
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      shortDescription: p.short_description,
      description: p.description,
      price: getMinPrice(p.product_variants),
    })),
  });

  return (
    <div className="min-h-svh bg-background text-[#f5ebc9] flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", url: "/" },
          { name: "Katalog", url: "/katalog" },
          { name: "Roasted for Filter", url: "/roasted-for-filter" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd}
      />
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-extralight tracking-wider">
              Roasted for Filter — Biji Kopi untuk Seduh Manual
            </h1>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              &ldquo;Filter coffee&rdquo; adalah kopi yang diseduh tanpa
              tekanan mesin espresso — pakai V60, tubruk, French press, atau
              Vietnam drip. Kopi jenis ini makin banyak dicari pelanggan cafe
              yang ingin alternatif selain susu.{" "}
              {cheapest ? (
                <>
                  Kategori ini berisi kopi yang kami sangrai ringan sampai
                  medium khusus untuk metode itu, mulai{" "}
                  {numberToIdr({ nominal: cheapest })} per pack.
                </>
              ) : (
                <>
                  Kami sangrai setiap kopinya ringan sampai medium, khusus
                  untuk metode itu.
                </>
              )}
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Kenapa beda sangrai untuk filter?
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Sangrai terang (light roast) menyimpan rasa asli biji: buah,
              bunga, keasaman yang segar. Sangrai gelap menghapus rasa itu dan
              menggantinya dengan pahit yang enak ketemu susu. Espresso dan kopi
              susu butuh yang gelap; seduh manual justru kehilangan rasa di
              sangrai gelap. Karena itu kami menyangrai bagian katalog ini
              lebih terang, supaya karakter aslinya — misalnya blueberry pada
              Ethiopia atau jeruk pada Kintamani — keluar di gelas.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Cocok untuk cafe dan kedai rumahan
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Sebagian besar produk di sini adalah single origin (kopi dari satu
              perkebunan/daerah, bukan campuran) dan microlot dengan skor
              spesialti. Pas untuk menu manual brew di cafe, untuk barista yang
              mau ngopi sendiri di rumah, atau sebagai sampel sebelum menentukan
              house blend. Bingung mulai dari mana?{" "}
              <Link
                href="/konsultasi"
                className="underline underline-offset-4 text-[#f5ebc9]"
              >
                Booking konsultasi
              </Link>{" "}
              di roastery kami — sesi 2 jam, termasuk cicip beberapa single
              origin dan rekomendasi profil seduh.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Semua kopi roasted for filter
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Untuk espresso blend dan kopi susu, lihat{" "}
              <Link
                href="/kopi-susu-ekonomis"
                className="underline underline-offset-4 text-[#f5ebc9]"
              >
                kategori kopi susu ekonomis
              </Link>{" "}
              atau{" "}
              <Link
                href="/katalog"
                className="underline underline-offset-4 text-[#f5ebc9]"
              >
                katalog lengkap
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12">
          <ProductGrid supabaseProducts={products} />
        </div>

        <p className="mt-10 max-w-4xl mx-auto text-sm font-extralight text-[#ccc4a9]">
          Punya cafe dan mau bikin menu manual brew? Kami juga mensuplai biji
          kopi ke banyak cafe di Jakarta — baca{" "}
          <Link
            href="/supplier-biji-kopi-cafe"
            className="underline underline-offset-4 text-[#f5ebc9]"
          >
            program supplier biji kopi untuk cafe
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
