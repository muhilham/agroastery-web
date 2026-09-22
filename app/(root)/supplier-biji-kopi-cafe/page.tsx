import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProductGrid from "@/components/product-grid";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { getProducts, getMinPrice } from "@/lib/supabase/queries/products";
import { numberToIdr } from "@/lib/numberToIdr";
import { ADDRESS } from "@/constant/resource-and-link";
import { CONSULTATION_FEE_IDR } from "@/lib/consultations/constants";
import { OG_IMAGE } from "@/lib/seo/content-pages";
import { collectionPageJsonLd } from "@/lib/seo/content-jsonld";
import type { SupabaseProduct } from "@/types/product";

export const metadata: Metadata = {
  title: "Supplier Biji Kopi untuk Cafe — Agroastery",
  description:
    "Supplier biji kopi specialty untuk cafe di Jakarta dan sekitarnya. Disangrai sendiri di roastery Jakarta Selatan, blend kopi susu mulai Rp29.000/pack, konsultasi menu + harga wholesale. Pesan online atau booking sesi.",
  alternates: { canonical: "/supplier-biji-kopi-cafe" },
  openGraph: {
    title: "Supplier Biji Kopi untuk Cafe — Agroastery",
    description:
      "Biji kopi sangrai roastery sendiri untuk menu cafe: kopi susu ekonomis, espresso blend, sampai single origin. Cicip dulu di roastery, baru ambil stok.",
    url: "/supplier-biji-kopi-cafe",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Supplier biji kopi untuk cafe — roastery Agroastery Jakarta Selatan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supplier Biji Kopi untuk Cafe — Agroastery",
    description:
      "Disangrai sendiri di roastery Jakarta Selatan. Blend kopi susu, espresso blend, single origin. Konsultasi menu dan penawaran wholesale.",
    images: [OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";

/** Slug list for the featured cafe products (subset of the live catalog). */
const FEATURED_SLUGS = [
  "biji-kopi-blend-5050-kopi-susu-ekonomis",
  "biji-kopi-blend-7030-kopi-susu-ekonomis",
  "biji-kopi-blend-2080-kopi-susu-ekonomis",
  "house-blend-espresso-arabica-fine-robusta-es46",
  "biji-kopi-standard-gayo-full-arabica",
  "biji-kopi-full-arabica-kopi-susu-ekonomis-1-kg-1kg",
];

function pickFeatured(products: SupabaseProduct[]): SupabaseProduct[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (p): p is SupabaseProduct => Boolean(p)
  );
}

export default async function SupplierCafePage() {
  const allProducts = await getProducts();
  const featured = pickFeatured(allProducts);

  const susuPrices = featured
    .filter((p) => p.slug.includes("kopi-susu"))
    .map((p) => getMinPrice(p.product_variants))
    .filter((n) => n > 0);
  const cheapestSusu = susuPrices.length ? Math.min(...susuPrices) : null;

  const jsonLd = collectionPageJsonLd({
    name: "Supplier Biji Kopi untuk Cafe",
    description:
      "Program supplier biji kopi specialty Agroastery untuk cafe: blend kopi susu ekonomis, espresso blend, dan single origin dari roastery Jakarta Selatan.",
    url: "/supplier-biji-kopi-cafe",
    products: featured.map((p) => ({
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
          { name: "Supplier Biji Kopi Cafe", url: "/supplier-biji-kopi-cafe" },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd} />
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          {/* Hero — the offer in 3 seconds */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-extralight tracking-wider">
              Supplier Biji Kopi untuk Cafe, Langsung dari Roastery
            </h1>
            <p className="text-lg font-extralight leading-relaxed text-[#ccc4a9]">
              Agroastery menyangrai biji kopi specialty sendiri di roastery
              kami di Jakarta Selatan dan mengirimnya ke cafe-cafe di
              Jabodetabek dan seluruh Indonesia.{" "}
              {cheapestSusu ? (
                <>
                  Blend kopi susu ekonomis kami mulai{" "}
                  {numberToIdr({ nominal: cheapestSusu })} per pack — tanpa
                  perantara, tanpa waiting list distributor, tanpa minimum
                  order raksasa yang bikin gudang cafe kamu jadi gudang kopi.
                </>
              ) : (
                <>
                  Tanpa perantara, tanpa minimum order raksasa yang bikin gudang
                  cafe kamu jadi gudang kopi.
                </>
              )}
            </p>
            <div className="flex gap-4 flex-wrap pt-2">
              <Link
                href="/konsultasi"
                className="inline-flex items-center justify-center h-12 px-8 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
              >
                Booking Konsultasi &amp; Harga Wholesale
              </Link>
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center h-12 px-8 border border-[#f5ebc9]/40 rounded-full text-sm tracking-wider transition-all duration-700 hover:border-[#f5ebc9]"
              >
                Lihat Katalog
              </Link>
            </div>
          </header>

          {/* Why it matters */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Kenapa supplier menentukan untung (atau buntung) sebuah cafe
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Biji kopi adalah HPP terbesar kedua setelah susu di menu es kopi
              susu. Supplier yang salah bikin kamu menghadapi tiga masalah: rasa
              yang berubah-ubah antar pengiriman (karena mereka beli dari
              penyangrai lain, bukan sangrai sendiri), stok yang menua di
              gudang sebelum sampai ke bar kamu, dan harga yang naik tiap kali
              &ldquo;kebijakan distributor&rdquo; berubah. Kami menjalankan
              roastery sendiri, jadi ketiganya bisa dijawab: rasa konsisten
              karena recipe sangrai kami pegang sendiri, kopi berangkat dalam
              hitungan hari setelah disangrai — bukan bulan, dan harga tetap
              karena tidak ada lapisan perantara di antara roastery dan bar
              kamu.
            </p>
          </section>

          {/* Tiers */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Skema harga: ritel, karawan, dan wholesale
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Tidak ada formulir yang menyuruh kamu mengirim dulu data usaha.
              Harga bertingkat kami jalan lewat tiga jalur yang jelas:
            </p>
            <ul className="list-disc list-inside space-y-3 font-extralight leading-relaxed text-[#ccc4a9]">
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Ritel (harga katalog)
                </strong>{" "}
                — cocok untuk coba rasa dan cafe baru yang belum tahu konsumsi
                biji kopinya. Semua harga di{" "}
                <Link href="/katalog" className="underline underline-offset-4 text-[#f5ebc9]">
                  /katalog
                </Link>{" "}
                bisa langsung dibeli, dari pack 100 gram sampai 1 kg.
              </li>
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Pack 1 kg sebagai standar kerja
                </strong>{" "}
                — mayoritas cafe kami melayani dengan pack 1 kg. Kenapa? Karena
                harga per kilogram di pack 1 kg jauh lebih efisien daripada
                menggandakan pack kecil, dan 1 kg adalah takaran yang pas untuk
                kira-kira 55–65 gelas es kopi susu — cukup untuk beberapa hari
                operasi, tidak cukup untuk menua di rak.
              </li>
              <li>
                <strong className="font-normal text-[#f5ebc9]">
                  Wholesale (lewat sesi konsultasi)
                </strong>{" "}
                — pembelian rutin dengan harga khusus ditentukan setelah kami
                tahu profil pemakaian kamu: berapa gelas per hari, menu apa
                saja, dan blend mana yang jadi basis. Ini juga jalur untuk
                request blend dengan profil rasa yang cafe kamu minta — kami
                racik dari komponen arabica dan robusta yang ada di roastery,
                lalu kamu cicip di tempat sebelum deal.
              </li>
            </ul>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Tidak ada minimum order yang kaku untuk memulai. Ambil satu pack
              100 gram untuk dicicip di bar sendiri, atau langsung booking sesi
              kalau tim kamu mau memilih sambil belajar menyeduhnya.
            </p>
          </section>

          {/* MOQ / how ordering works */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Cara order dan ritme pengiriman
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Pesanan pertama cukup dari website seperti pelanggan biasa — pilih
              produk, checkout, bayar via QRIS, kurir dihitung otomatis sesuai
              alamat dan berat. Untuk cafe yang sudah masuk ritme wholesale,
              pemesanan ulang bisa lewat WhatsApp dan penjadwalan kirimnya kita
              samakan dengan siklus stok kamu, mingguan atau dua mingguan.
              Roastery kami di{" "}
              <span className="text-[#f5ebc9]">{ADDRESS}</span> — pengiriman
              Jabodetabek umumnya tiba di hari yang sama atau sehari setelah
              keberangkatan, luar Jawa lewat kurir nasional dengan estimasi
              yang muncul otomatis di checkout. Kopi untuk pelanggan wholesale
              disangrai di awal minggu dan berangkat segar, bukan diambil dari
              tumpukan stok lama.
            </p>
          </section>

          {/* Freshness logistics */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Segar itu urusan logistik, bukan klaim marketing
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Kopi sangrai paling enak dipakai antara hari ke-5 sampai ke-30
              setelah tanggal sangrai — sebelum itu gasnya belum habis,
              sesudah itu aromanya turun. Karena itu kami menyangrai mengikuti
              ritme pesanan dan menyediakan alat Roast Age di website ini:
              masukkan tanggal sangrai dari pack kamu, dan tool-nya memberi
              tahu di hari ke berapa kopi sekarang — jadi barista selalu tahu
              kapan rasa paling pas. Untuk cafe di dalam Jakarta, opsi ambil
              sendiri di roastery juga tersedia di checkout — tanpa ongkir,
              dan kamu bisa sekalian mampir melihat proses sangrainya.
            </p>
          </section>

          {/* Blend program */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Program blend: dari rasio standar sampai rasa khas cafe kamu
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Kami punya tiga rasio blend kopi susu yang sudah teruji di banyak
              bar — 20/80 untuk menu paling ekonomis, 50/50 untuk es kopi susu
              standar yang paling laku, dan 70/30 untuk cafe yang mau rasa
              kopinya lebih naik. Tapi rasio bukan agama: lewat sesi
              konsultasi, kami bisa menyetel profil blend mengikuti menu kamu —
              lebih chocolatey untuk kopi susu gula aren, lebih fruity untuk
              menu manual brew. Blend yang sudah disetujui bisa diproduksi
              ulang dengan rasa yang sama di setiap pengiriman, dan kamu bisa
              pesan komponen single origin-nya juga kalau mau meracik sendiri
              di bar.
            </p>
          </section>

          {/* The consultation CTA */}
          <section className="flex flex-col gap-3 p-6 border border-[#f5ebc9]/30 rounded-3xl">
            <h2 className="text-xl font-light tracking-wider">
              Langkah paling masuk akal: cicip dulu, 2 jam, {numberToIdr({ nominal: CONSULTATION_FEE_IDR })}
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Datang ke roastery dengan mesin espresso double boiler, grinder
              EK43, dan Mazzer Super Jolly. Diskusi karakter rasa yang cocok
              untuk pelanggan cafe kamu, cicip beberapa kandidat blend di
              resepmu sendiri, dan akhiri dengan penawaran harga wholesale.
              Sesi ini bukan sekadar jualan — banyak peserta datang dengan
              masalah &ldquo;kopi susuku terlalu pahit/tidak terasa kopinya&rdquo;
              dan pulang dengan resep yang sudah pas.{" "}
              <Link href="/konsultasi" className="underline underline-offset-4 text-[#f5ebc9]">
                Booking jadwal konsultasi di sini
              </Link>
              .
            </p>
          </section>

          {/* Featured products */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Produk yang paling sering dipakai cafe
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Mulai dari{" "}
              <Link href="/kopi-susu-ekonomis" className="underline underline-offset-4 text-[#f5ebc9]">
                kategori kopi susu ekonomis
              </Link>
              ,{" "}
              <Link href="/roasted-for-filter" className="underline underline-offset-4 text-[#f5ebc9]">
                kopi seduh manual
              </Link>
              , atau cek{" "}
              <Link href="/harga-biji-kopi-arabica" className="underline underline-offset-4 text-[#f5ebc9]">
                tabel harga arabica per kilogram
              </Link>{" "}
              sebelum nego.
            </p>
          </section>
        </div>

        <div className="mt-8 max-w-6xl mx-auto">
          <ProductGrid supabaseProducts={featured} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
