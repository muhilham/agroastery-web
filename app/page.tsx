"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { coffeList } from "@/constant/coffe-list";
import { footer, menuItems } from "@/constant/menu-list";
import { topSectionContent } from "@/constant/top-content";
import { MAP_LOCATION } from "@/constant/resource-and-link";
import { testimonialContent } from "@/constant/testimonial";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);

      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  return (
    <div>
      <div className="font-['Montserrat'] bg-[#1A1A1A] text-[#f5ebc9]">
        <header>
          <nav
            className={`w-full md:h-20 p-6 lg:h-24 z-40 fixed flex justify-between items-center px-4 md:px-10 lg:px-20 transition-all duration-300 ${isScrolled ? "bg-black/20 backdrop-blur-sm" : "bg-transparent"}`}
          >
            <Image
              src="/assets/agroastery-logo.svg"
              alt="ag-logogram"
              width={24}
              height={24}
              className="h-6 w-auto"
            />

            <ul className="md:hidden sm:hidden flex text-primary font-normal py-16 space-x-4 text-base">
              <li>
                <a href="#" className="hover:underline">
                  Tokopedia
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Whatsapp
                </a>
              </li>
            </ul>

            <button
              className="lg:hidden text-primary z-50 relative w-6 flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className={`size-6 absolute inset-0 transition-all duration-300 ${isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                    }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
                {/* Menu icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className={`size-6 absolute inset-0 transition-all duration-300 ${isMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                    }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9h16.5m-16.5 6.75h16.5"
                  />
                </svg>
              </div>
            </button>
          </nav>
          <div
            className={`fixed inset-0 z-30 transition-all duration-300 md:hidden ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
          >
            <div className="pt-14 px-4 bg-black pb-4">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <li key={index} className="border-b border-secondary ">
                    <a
                      href={item.link}
                      className="block py-2 text-primary font-normal text-sm hover:underline hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        <main>
          <section className="bg-[url('/assets/hero.svg')] bg-no-repeat bg-cover h-screen p-16 flex flex-row justify-end items-center sm:p-6 sm:bg-auto sm:bg-[25%_0]">
            <div className="w-1/2 max-w-[564px] flex flex-col gap-6 md:w-4/5 sm:w-full sm:max-w-none">
              <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-light tracking-wider leading-relaxed md:text-4xl sm:text-2xl sm:font-normal">
                  CRAFTING THE FINEST STANDARD
                </h1>
                <p className="text-xl font-light text-[#f5ebc9]">
                  At AGROASTERY we are passionate about sourcing and roasting
                  the highest quality coffee beans from around the world. Our
                  mission is to bring you the perfect cup of coffee every time.
                </p>
              </div>
              <a
                href="https://www.tokopedia.com/agroastery"
                className="flex items-center justify-center w-36 h-10 px-4 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700 hover:bg-[#f5ebc9] hover:text-neutral-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                SEE CATALOG
              </a>
            </div>
          </section>

          <div className="p-16 flex flex-col gap-20 md:p-8 sm:py-6 sm:px-0">
            {/* Values Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                REDEFINING THE NEW STANDARD
              </h2>
              <div className="w-full flex gap-6 sm:overflow-x-scroll sm:px-6 no-scrollbar">
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
                AGROASTERY unique practice and principal shape every blend that
                will be served on your cup
              </p>
            </section>

            {/* Featured Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                UNIQUE BLEND FOR EACH OCCASION
              </h2>
              <div className="flex flex-wrap no-scrollbar gap-6 sm:flex-nowrap sm:overflow-x-scroll sm:px-6">
                {coffeList.map((product) => (
                  <div
                    role="button"
                    onClick={() => router.push(product.href)}
                    key={product.title}
                    className="w-[calc(50%-12px)] cursor-pointer flex flex-col gap-16 p-6 border border-[#f5ebc9] rounded-3xl sm:min-w-[280px]"
                  >
                    <div className="h-full flex flex-col gap-2">
                      <h3 className="text-lg font-light tracking-wider">
                        {product.title}
                      </h3>
                      <p className="max-w-[400px] font-extralight leading-relaxed text-[#ccc4a9]">
                        {product.subtitle}
                      </p>
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

            {/* Opinion Section */}
            <section className="w-full flex flex-col gap-8">
              <h2 className="text-3xl font-extralight tracking-wider sm:px-6">
                UNFILTERED OPINION
              </h2>
              <div className="w-full flex gap-6 no-scrollbar sm:flex-nowrap sm:overflow-x-scroll sm:px-6">
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
            </section>
          </div>
        </main>

        <footer className="p-16 bg-[#171717] gap-10 flex w-full justify-between sm:p-8 sm:flex-col sm:gap-10">
          <div className="flex flex-col space-y-5 sm:w-full">
            {footer.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:gap-1">
              <h6 className="text-xs font-bold text-[#ccc4a9]">ADDRESS</h6>
              <p className="max-w-[400px] font-extralight leading-relaxed text-[#ccc4a9]">
                Jl. Kemang Barat No.7I, RT.9/RW.1, Bangka, Kec. Mampang Prpt.,
                Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12730
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-1">
              <h6 className="text-xs font-bold text-[#ccc4a9]">
                PHONE / WHATSAPP
              </h6>
              <p className="font-extralight leading-relaxed text-[#ccc4a9]">
                +62 823-2866-4557
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-1">
              <h6 className="text-xs font-bold text-[#ccc4a9]">
                OPERATIONAL HOUR
              </h6>
              <p className="font-extralight leading-relaxed text-[#ccc4a9]">
                10am - 8pm ( WIB )
              </p>
            </div>
          </div>

          <div className="lg:w-full lg:max-w-[400px]">
            <iframe
              src={MAP_LOCATION}
              className="w-full h-48 md:h-60 lg:h-64 rounded-2xl"
              style={{ border: 0 }}
              allowFullScreen={true}
              aria-hidden="false"
              tabIndex={0}
              title="Agroastery Location"
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
