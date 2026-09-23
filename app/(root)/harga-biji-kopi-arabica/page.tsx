import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { getProducts } from "@/lib/supabase/queries/products";
import { numberToIdr } from "@/lib/numberToIdr";
import { OG_IMAGE } from "@/lib/seo/content-pages";
import {
  buildArabicaPriceRows,
  priceRange,
  arabicaFaqs,
  type ArabicaPriceRow,
} from "@/lib/seo/arabica-pricing";
import { STATIC_ARABICA_ROWS } from "@/lib/seo/arabica-content";
import { faqJsonLd, arabicaPriceListJsonLd } from "@/lib/seo/content-jsonld";

const PATH = "/harga-biji-kopi-arabica";

export const metadata: Metadata = {
  title: "Harga Biji Kopi Arabica per Kg — Agroastery",
  description:
    "Tabel harga biji kopi arabica per kilogram, dihitung langsung dari harga katalog hari ini: Gayo, Kintamani, Solok, Brazil, sampai full arabica untuk kopi susu. Cek angka sebelum nego supplier. Booking konsultasi wholesale.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Harga Biji Kopi Arabica per Kg — Agroastery",
    description:
      "Tabel harga arabica per pack dan per kilogram, live dari katalog roastery Jakarta Selatan.",
    url: PATH,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Tabel harga biji kopi arabica per kilogram Agroastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harga Biji Kopi Arabica per Kg — Agroastery",
    description:
      "Tabel harga arabica per pack dan per kilogram, live dari katalog roastery Jakarta Selatan.",
    images: [OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";

function PriceTable({ rows }: { rows: ArabicaPriceRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#f5ebc9]/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f5ebc9]/20 text-left">
            <th className="p-4 font-light tracking-wider text-[#f5ebc9]">
              Kopi Arabica
            </th>
            <th className="p-4 font-light tracking-wider text-[#f5ebc9] whitespace-nowrap">
              100 g
            </th>
            <th className="p-4 font-light tracking-wider text-[#f5ebc9] whitespace-nowrap">
              200 g
            </th>
            <th className="p-4 font-light tracking-wider text-[#f5ebc9] whitespace-nowrap">
              500 g
            </th>
            <th className="p-4 font-light tracking-wider text-[#f5ebc9] whitespace-nowrap">
              1 kg
            </th>
            <th className="p-4 font-light tracking-wider text-[#f5ebc9] whitespace-nowrap">
              Termurah /kg
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const priceFor = (grams: number) =>
              row.packs.find((pack) => pack.grams === grams)?.price;
            return (
              <tr
                key={row.slug}
                className="border-b border-[#f5ebc9]/10 last:border-b-0 align-top"
              >
                <td className="p-4 font-extralight text-[#ccc4a9]">
                  <Link
                    href={`/product/${row.slug}`}
                    className="underline underline-offset-4 hover:text-[#f5ebc9]"
                  >
                    {row.name}
                  </Link>
                </td>
                {[100, 200, 500, 1000].map((grams) => {
                  const price = priceFor(grams);
                  return (
                    <td
                      key={grams}
                      className="p-4 font-extralight whitespace-nowrap text-[#f5ebc9]"
                    >
                      {price ? numberToIdr({ nominal: price }) : "—"}
                    </td>
                  );
                })}
                <td className="p-4 font-light whitespace-nowrap text-[#f5ebc9]">
                  {numberToIdr({ nominal: row.bestPerKg })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function HargaArabicaPage() {
  // Live catalog first; a verified static snapshot (see arabica-content.ts)
  // keeps the page useful if Supabase hiccups — visibly labelled, never silent.
  let rows: ArabicaPriceRow[] = [];
  let live = true;
  try {
    const products = await getProducts();
    rows = buildArabicaPriceRows(products);
    if (rows.length === 0) {
      rows = STATIC_ARABICA_ROWS;
      live = false;
    }
  } catch {
    rows = STATIC_ARABICA_ROWS;
    live = false;
  }

  const range = priceRange(rows);
  const faqs = arabicaFaqs(rows);
  const cheapest = rows[0];

  return (
    <div className="min-h-svh bg-background text-[#f5ebc9] flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", url: "/" },
          { name: "Katalog", url: "/katalog" },
          { name: "Harga Biji Kopi Arabica", url: PATH },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={faqJsonLd(faqs)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={arabicaPriceListJsonLd(rows, PATH)}
      />
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-extralight tracking-wider">
              Harga Biji Kopi Arabica per Kg
            </h1>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Tabel ini menghitung harga efektif per kilogram dari{" "}
              {live ? (
                <>harga katalog yang berlaku hari ini</>
              ) : (
                <>
                  snapshot harga katalog terakhir kami (sedang memperbarui data
                  langsung)
                </>
              )}{" "}
              di roastery Agroastery, Jakarta Selatan. Semua angka adalah biji
              kopi sangrai siap seduh dalam Rupiah, belum termasuk ongkir.
              {range
                ? ` Saat ini arabica paling ekonomis kami ada di ${numberToIdr({
                    nominal: range.minPerKg,
                  })} per kg dan yang premium di ${numberToIdr({
                    nominal: range.maxPerKg,
                  })} per kg.`
                : ""}
            </p>
          </header>

          <PriceTable rows={rows} />

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-light tracking-wider">
              Cara membaca tabel ini
            </h2>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Kolom 100 g sampai 1 kg adalah harga per kemasan. Kolom terakhir
              &mdash; &ldquo;Termurah /kg&rdquo; &mdash; mengambil ukuran
              paling efisien untuk tiap kopi, karena harga per gram selalu
              turun seiring besarnya pack. Kalau cafe kamu menghabiskan lebih
              dari 2 kg seminggu, bandingkan kolom terakhir itu dengan harga
              supplier lama kamu: biasanya selisihnya langsung kelihatan.
              {cheapest
                ? ` Sebagai gambaran, ${cheapest.name} di ${numberToIdr({
                    nominal: cheapest.bestPerKg,
                  })} per kg berarti satu gelas es kopi susu (±18 g biji kopi) hanya menelan HPP kopi sekitar ${numberToIdr({
                    nominal: Math.round((cheapest.bestPerKg * 18) / 1000),
                  })}.`
                : ""}
            </p>
            <p className="font-extralight leading-relaxed text-[#ccc4a9]">
              Butuh angka di luar tabel — pengiriman rutin, blend khusus, atau
              volume besar? Harga wholesale dibicarakan di sesi konsultasi 2
              jam di roastery, sekalian cicip dulu sebelum deal.{" "}
              <Link
                href="/konsultasi"
                className="underline underline-offset-4 text-[#f5ebc9]"
              >
                Booking konsultasi
              </Link>{" "}
              atau pelajari dulu{" "}
              <Link
                href="/supplier-biji-kopi-cafe"
                className="underline underline-offset-4 text-[#f5ebc9]"
              >
                program supplier untuk cafe
              </Link>
              .
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-light tracking-wider">
              Pertanyaan yang sering muncul
            </h2>
            <dl className="flex flex-col gap-5">
              {faqs.map((faq) => (
                <div key={faq.question} className="flex flex-col gap-1">
                  <dt className="font-light text-[#f5ebc9]">{faq.question}</dt>
                  <dd className="font-extralight leading-relaxed text-[#ccc4a9]">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="text-sm font-extralight text-[#ccc4a9]">
            Cari yang lebih pas untuk menu susu? Lihat{" "}
            <Link
              href="/kopi-susu-ekonomis"
              className="underline underline-offset-4 text-[#f5ebc9]"
            >
              blend kopi susu ekonomis
            </Link>{" "}
            atau{" "}
            <Link
              href="/roasted-for-filter"
              className="underline underline-offset-4 text-[#f5ebc9]"
            >
              kopi seduh manual
            </Link>
            . Produk di luar kategori arabica ada di{" "}
            <Link
              href="/katalog"
              className="underline underline-offset-4 text-[#f5ebc9]"
            >
              katalog
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
