"use client";
import React from "react";
import Image from "next/image";
import { coffeList } from "@/constant/coffe-list";
import { topSectionContent } from "@/constant/top-content";
import { testimonialContent } from "@/constant/testimonial";
import { Footer } from "@/components/ui/footer";
import Navigation from "@/components/navigation";
import { useRouter } from "next/navigation";
import { numberToIdr } from "@/lib/numberToIdr";
export default function Home() {
  const router = useRouter();
  return (
    <div>
      <div className="bg-[#1A1A1A] text-[#f5ebc9]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Agroastery",
              image:
                "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Jl. Kemang Barat No.7I",
                addressLocality: "Jakarta Selatan",
                addressRegion: "DKI Jakarta",
                postalCode: "12730",
                addressCountry: "ID",
              },
              telephone: "+628979092726",
              openingHours: "Mo-Su 10:00-20:00",
              priceRange: "Rp30,000-Rp150,000",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "25000",
              },
            }),
          }}
        />
        <header>
          <Navigation />
        </header>
        <main>
          <section className="bg-[url('/assets/hero.svg')] bg-no-repeat bg-cover h-screen p-16 flex flex-row justify-end items-center sm:p-6 sm:bg-auto sm:bg-[25%_0]">
            <div className="w-1/2 max-w-[564px] flex flex-col gap-6 md:w-4/5 sm:w-full sm:max-w-none">
              <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-light tracking-wider leading-relaxed md:text-4xl sm:text-2xl sm:font-normal">
                  CRAFTING THE FINEST STANDARD
                </h1>
                <p className="text-xl font-light text-[#f5ebc9]">
                  100,000+ orders. Rated 5.0 by 25,000+ buyers.
                </p>
                <p className="text-sm font-light text-[#cabfa9]">
                  Seven years roasting — now direct to you.
                </p>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f5ebc9]/10 border border-[#f5ebc9]/30 rounded-full text-sm font-medium text-[#f5ebc9]">
                  <svg
                    className="w-4 h-4 text-[#f5ebc9]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="0"
                  >
                    <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.4L12 16.8 5.7 21l2.3-7.4-6-4.4h7.6z" />
                  </svg>
                  {process.env.NEXT_PUBLIC_INDEPENDENCE_DAY_PROMO === "true"
                    ? "17% OFF — Spesial HUT RI"
                    : "Up to 11% cheaper than Shopee/Tokopedia"}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="/katalog"
                  className="flex items-center justify-center w-36 h-10 px-4 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
                >
                  Shop Now
                </a>
                <a
                  href="/konsultasi"
                  className="flex items-center justify-center h-10 px-4 border border-[#f5ebc9]/40 rounded-full text-sm tracking-wider transition-all duration-700 hover:border-[#f5ebc9] text-[#f5ebc9]/80 hover:text-[#f5ebc9]"
                >
                  Konsultasi untuk Cafe
                </a>
              </div>
            </div>
          </section>

          <div className="p-16 flex flex-col gap-20 md:p-8 sm:py-6 sm:px-0">
            {/* Values Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                REDEFINING THE NEW STANDARD
              </h2>
              <div className="w-full flex gap-6 sm:overflow-x-scroll sm:px-6 no-scrollbar scroll-fade-mobile">
                {topSectionContent.map((value, index) => (
                  <div
                    key={index}
                    className="flex flex-col w-full gap-16 p-6 border border-[#f5ebc9] rounded-3xl sm:min-w-[280px]"
                  >
                    <Image
                      src={value.image}
                      alt={value.title}
                      width={160}
                      height={160}
                      className="w-40 h-40 self-end"
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-light tracking-wider">
                        {value.title}
                      </h3>
                      <p className="font-extralight leading-relaxed text-[#ccc4a9]">
                        {value.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-extralight text-xl text-[#f5ebc9] sm:text-base sm:px-6">
                AGROASTERY&apos;s unique practices and principles shape every blend
                that will be served on your cup.
              </p>
              <div className="text-center sm:px-6">
                <a
                  href="/katalog"
                  className="inline-flex items-center justify-center h-10 px-6 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
                >
                  Belanja Sekarang
                </a>
              </div>
            </section>

            {/* Featured Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                UNIQUE BLEND FOR EACH OCCASION
              </h2>
              <div className="flex flex-wrap no-scrollbar gap-6 sm:flex-nowrap sm:overflow-x-scroll sm:px-6 scroll-fade-mobile">
                {coffeList.map((product) => (
                  <div
                    key={product.title}
                    onClick={() => router.push(`${product.href}`)}
                    role="button"
                    className="w-[calc(50%-12px)]  flex flex-col cursor-pointer gap-16 p-6 border border-[#f5ebc9] rounded-3xl sm:min-w-[280px]"
                  >
                    <div className="h-full flex flex-col gap-2">
                      <h3 className="text-lg font-light tracking-wider">
                        {product.title}
                      </h3>
                      <p className="max-w-[400px] font-extralight leading-relaxed text-[#ccc4a9]">
                        {product.subtitle}
                      </p>
                      {product.price && (
                        <p className="text-sm font-medium text-[#f5ebc9] mt-2">
                          Mulai {numberToIdr({ nominal: product.price })}
                        </p>
                      )}
                    </div>
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={240}
                      height={240}
                      className="w-60 h-60 self-end"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Konsultasi Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                KONSULTASI UNTUK CAFE
              </h2>
              <div className="flex flex-col gap-6 p-6 border border-[#f5ebc9] rounded-3xl sm:mx-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-light tracking-wider">
                    Bingung milih kopi? Datang aja langsung.
                  </h3>
                  <p className="max-w-[560px] font-extralight leading-relaxed text-[#ccc4a9]">
                    Sesi privat 2 jam di roastery kami di Jakarta Selatan — diskusi
                    menu, cicip blend di mesin espresso dan EK43, sampai penawaran
                    harga wholesale. Buat kamu yang mau nyobain dulu sebelum ambil
                    stok buat cafe.
                  </p>
                </div>
                <div>
                  <a
                    href="/konsultasi"
                    className="inline-flex items-center justify-center h-10 px-6 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
                  >
                    Booking Konsultasi
                  </a>
                </div>
              </div>
            </section>

            {/* Opinion Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                KATA MEREKA
              </h2>

              <div className="flex items-center gap-2 sm:px-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-[#f5ebc9]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="0"
                    >
                      <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.4L12 16.8 5.7 21l2.3-7.4-6-4.4h7.6z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#f5ebc9]">5.0 — dari 25.000+ pembeli</span>
              </div>

              <div className="w-full flex gap-6 no-scrollbar sm:flex-nowrap sm:overflow-x-scroll sm:px-6 scroll-fade-mobile">
                {testimonialContent.map((opinion) => (
                  <div
                    key={opinion.name}
                    className="flex-1 flex flex-col gap-4 p-6 border border-[#f5ebc9] rounded-3xl sm:flex-shrink-0 sm:w-[calc(100%-48px)] sm:min-w-[280px] md:w-[calc(100%-48px)]"
                  >
                    <h6 className="text-xs font-bold text-[#ccc4a9]">
                      {opinion.product}
                    </h6>
                    <p className="font-extralight leading-relaxed text-[#ccc4a9]">
                      {opinion.message}
                    </p>
                    <h4 className="text-lg font-light">- {opinion.name}</h4>
                  </div>
                ))}
              </div>

              <div className="text-center sm:px-6">
                <a
                  href="/katalog"
                  className="inline-flex items-center justify-center h-10 px-6 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
                >
                  Lihat Katalog
                </a>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}