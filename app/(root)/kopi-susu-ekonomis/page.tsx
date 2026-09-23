import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProductGrid from "@/components/product-grid";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { getProducts, getMinPrice } from "@/lib/supabase/queries/products";
import { numberToIdr } from "@/lib/numberToIdr";
import { OG_IMAGE, productsInCategory, KOPI_SUSU_CATEGORY } from "@/lib/seo/content-pages";
import { collectionPageJsonLd } from "@/lib/seo/content-jsonld";
import type { SupabaseProduct } from "@/types/product";

export const metadata: Metadata = {
  title: "Biji Kopi Susu Ekonomis untuk Cafe — Agroastery",
  description:
    "Blend kopi susu ekonomis 20/80, 50/50, dan 70/30 langsung dari roastery Jakarta Selatan, mulai Rp29.000 per pack. Susu kuat, kopi tetap terasa, HPP minuman aman. Pesan online atau booking konsultasi rasa.",
  alternates: { canonical: "/kopi-susu-ekonomis" },
  openGraph: {
    title: "Biji Kopi Susu Ekonomis untuk Cafe — Agroastery",
    description:
      "Campuran arabica dan robusta khusus es kopi susu — rasa seimbang, harga masuk hitungan untuk menu cafe. Disangrai di roastery Jakarta Selatan.",
    url: "/kopi-susu-ekonomis",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Biji kopi blend susu ekonomis Agroastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biji Kopi Susu Ekonomis untuk Cafe — Agroastery",
    description:
      "Blend 20/80, 50/50, dan 70/30 khusus es kopi susu, langsung dari roastery Jakarta Selatan.",
    images: [OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";

export default async function KopiSusuEkonomisPage() {
  const allProducts = await getProducts();
  const products = productsInCategory(allProducts, KOPI_SUSU_CATEGORY);
  const cheapest = products.length
    ? Math.min(...products.map((p) => getMinPrice(p.product_variants)).filter((n) => n > 0))
    : null;

  const jsonLd = collectionPageJsonLd({
    name: "Biji Kopi Susu Ekonomis untuk Cafe",
    description:
      "Kumpulan blend kopi susu ekonomis Agroastery — campuran arabica dan robusta untuk menu es kopi susu cafe.",
    url: "/kopi-susu-ekonomis",
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
          { name: "Kopi Susu Ekonomis", url: "/kopi-susu-ekonomis" },
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
              Biji Kopi Susu Ekonomis untuk Cafe
            </h1>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Es kopi susu adalah menu yang paling sering dipesan di sebagian
              besar cafe Indonesia. Masalahnya sederhana: pelanggan minta rasa
              kopi yang enak, tapi harga jual minuman cuma belasan sampai dua
              puluhan ribu.{" "}
              {cheapest ? (
                <>
                  Kopi susu ekonomis kami menjawab itu — mulai{" "}
                  {numberToIdr({ nominal: cheapest })} per pack, disangrai
                  langsung di roastery Agroastery, Jakarta Selatan.
                </>
              ) : (
                <>Langsung dari roastery Agroastery, Jakarta Selatan.</>
              )}
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Apa itu blend kopi susu ekonomis?
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              &ldquo;Blend&rdquo; berarti campuran beberapa jenis biji kopi
              yang diracik jadi satu profil rasa. Untuk menu es kopi susu,
              campurannya adalah arabica (kopi dengan aroma dan rasa buah yang
              lembut) dan robusta (kopi dengan rasa kuat dan pahit yang
              &ldquo;tembus&rdquo; saat dicampur susu dan gula). Kopi susu
              ekonomis = blend yang sengaja dibuat supaya rasanya tetap kuat di
              gelas, tapi harga bijinya masuk hitungan HPP (harga pokok
              produksi) menu kamu.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Rasio 20/80, 50/50, dan 70/30 — pilih yang mana?
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Angka di nama blend menunjukkan takaran arabica terhadap robusta.
              Makin besar angka arabica, makin halus aromanya; makin besar
              robusta, makin kuat dan makin murah.
            </p>
            <ul className="list-disc list-inside space-y-2 font-extralight leading-relaxed text-[#ccc4a9]">
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Blend 20/80
                </strong>{" "}
                — paling ekonomis. Karakter robusta dominan, cocok untuk menu
                kopi susu jumbo dengan gula aren atau Sirup, di mana kopi
                hanya perlu &ldquo;ada&rdquo;, bukan jadi bintang.
              </li>
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Blend 50/50
                </strong>{" "}
                — penyeimbang. Body tebal dari robusta, aroma manis dari
                arabica. Favorit untuk es kopi susu standar, paling banyak
                dipesan.
              </li>
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Blend 70/30
                </strong>{" "}
                — upgrade untuk cafe yang mau menonjol di antara kopi susu
                sebelah. Rasa kopi lebih kompleks, tetap kuat di atas susu.
              </li>
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Full Robusta &amp; Full Arabica
                </strong>{" "}
                — untuk kamu yang mau satu origin saja, atau ingin meracik
                rasio campuran sendiri di ruang bar.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Semua produk kopi susu ekonomis
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Tersedia dalam ukuran kecil untuk dicoba dulu sampai pack 1 kg untuk
              stok bulanan. Butuh saran rasio yang pas untuk menu kamu?{" "}
              <Link href="/konsultasi" className="underline underline-offset-4 text-[#f5ebc9]">
                Booking konsultasi kopi
              </Link>{" "}
              2 jam di roastery — kamu bisa cicip tiap blend di mesin espresso
              dan dapat penawaran harga wholesale untuk pembelian rutin.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <ProductGrid supabaseProducts={products} />
        </div>

        <p className="mt-10 text-sm font-extralight text-[#ccc4a9]">
          Baru mulai nyari supplier? Baca dulu halaman{" "}
          <Link
            href="/supplier-biji-kopi-cafe"
            className="underline underline-offset-4 text-[#f5ebc9]"
          >
            supplier biji kopi untuk cafe
          </Link>{" "}
          kami, atau lihat semua varian di{" "}
          <Link href="/katalog" className="underline underline-offset-4 text-[#f5ebc9]">
            katalog
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
