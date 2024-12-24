"use client"
import { coffeList } from "@/constant/coffe-list";
import { ADDRESS, INSTAGRAM, MAP_LOCATION, PHONE_OR_WHATSAPP, SHOPEE, TELEGRAM, TIKTOK, TOKOPEDIA, WHATSAPP } from "@/constant/resource-and-link";
import { testimonialContent } from "@/constant/testimonial";
import { topSectionContent } from "@/constant/top-content";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <nav className={`w-full h-16 md:h-20 lg:h-24 z-40 fixed flex justify-between items-center px-4 md:px-10 lg:px-20 transition-all duration-300 ${isScrolled ? "bg-black/20 backdrop-blur-sm" : "bg-transparent"}`}>
        <Image
          src="/assets/agroastery-logo.svg"
          alt="agroastery-logo"
          width={150}
          height={36}
          className="w-32 md:w-40 lg:w-48"
        />

        <ul className="text-primary font-normal flex space-x-4 text-base md:text-lg lg:text-lg">
          <li><a href={TOKOPEDIA} className="hover:underline">Tokopedia</a></li>
          <li><a href={WHATSAPP} className="hover:underline">Whatsapp</a></li>
        </ul>
      </nav>

      <main>
        <div className="h-svh w-full flex flex-col items-center relative">
          <div className="container mx-auto px-4 flex items-center justify-center h-full z-10">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div></div>
              <div className="text-start lg:text-left px-4">
                <h1 className="text-primary text-3xl md:text-4xl lg:text-5xl font-normal mb-4">
                  CRAFTING THE FINEST STANDARD
                </h1>
                <p className="text-primary font-light text-base md:text-lg lg:text-xl mb-5">
                  At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.
                </p>
                <Link href={TOKOPEDIA} role="button" className="text-primary border border-primary rounded-full px-4 md:px-6 py-2 text-base lg:text-lg transition-colors inline-block">
                  SEE CATALOG
                </Link>
              </div>
            </div>
          </div>
          <Image
            src="/assets/hero.svg"
            alt="hero-image"
            layout="fill"
            objectFit="cover"
            className="z-0"
            priority
          />
        </div>

        <section className="bg-background px-4 md:px-10 lg:px-20 py-8 lg:py-10">
          <h1 className="text-primary text-2xl md:text-3xl lg:text-4xl font-light mb-6 lg:mb-10">REDEFINING THE NEW STANDARD</h1>
          <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-4 md:pb-0 no-scrollbar snap-x snap-mandatory">
            {topSectionContent.map((items, index) => (
              <div key={index} className="border border-primary rounded-3xl px-4 md:px-6 lg:px-8 py-4 lg:py-5 relative overflow-hidden flex-none w-[85%] md:w-auto snap-center">
                <Image
                  src={items.image}
                  alt={`circle-${index + 1}`}
                  className="absolute top-5 right-5 w-24 md:w-32 lg:w-40"
                  width={150}
                  height={150}
                />
                <div className="relative pt-32 md:pt-36 lg:pt-44">
                  <h1 className="text-primary text-xl md:text-2xl mb-1 font-normal">{items.title}</h1>
                  <p className="text-secondary text-base lg:text-lg mb-3 font-light">{items.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-primary text-lg lg:text-xl mt-6 lg:mt-10 font-light">AG Roastery unique practice and principal shape every blend that will be served on your cup</p>
        </section>

        <section className="bg-background px-4 md:px-10 lg:px-20 py-8 lg:py-10">
          <h1 className="text-primary text-2xl md:text-3xl lg:text-4xl font-light mb-6 lg:mb-10">UNIQUE BLEND FOR EACH OCCASION</h1>
          <div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-4 lg:gap-6 pb-4 md:pb-0 no-scrollbar snap-x snap-mandatory">
            {coffeList.map((items, index) => (
              <div key={index} className="border border-primary rounded-3xl px-4 md:px-6 lg:px-8 py-4 lg:py-5 relative overflow-hidden flex-none w-[85%] md:w-auto snap-center">
                <Image
                  src={items.image}
                  alt={`coffee-${index + 1}`}
                  className="absolute bottom-5 right-2 w-32 md:w-40 lg:w-48"
                  width={200}
                  height={200}
                />
                <div className="relative pb-32 md:pb-36 lg:pb-44 w-full lg:w-2/3">
                  <h1 className="text-primary text-xl md:text-2xl mb-2 font-normal">{items.title}</h1>
                  <p className="text-secondary text-base lg:text-lg mb-3 font-light">{items.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-background px-4 md:px-10 lg:px-20 py-8 lg:py-10">
          <h1 className="text-primary text-2xl md:text-3xl lg:text-4xl font-light mb-6 lg:mb-10">UNFILTERED OPINIONS</h1>
          <div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-4 lg:gap-6 pb-4 md:pb-0 no-scrollbar snap-x snap-mandatory">
            {testimonialContent.map((items, index) => (
              <div key={index} className="border border-primary rounded-3xl px-4 md:px-6 lg:px-8 py-4 lg:py-5 relative flex-none w-[85%] md:w-auto snap-center">
                <h1 className="text-primary font-normal mb-3">{items.product}</h1>
                <p className="text-secondary text-sm lg:text-base mb-3">{items.message}</p>
                <span className="text-primary text-base lg:text-lg font-normal">- {items.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#141414] px-4 md:px-10 lg:px-20 py-8 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 w-full">
          <div className="flex flex-col gap-2">
            <Link href={TOKOPEDIA} className="text-primary text-base hover:underline lg:text-lg">Tokopedia</Link>
            <Link href={SHOPEE} className="text-primary text-base hover:underline lg:text-lg">Shopee</Link>
            <Link href={WHATSAPP} className="text-primary text-base hover:underline lg:text-lg">WhatsApp</Link>
            <Link href={TELEGRAM} className="text-primary text-base hover:underline lg:text-lg">Telegram</Link>
            <Link href={INSTAGRAM} className="text-primary text-base hover:underline lg:text-lg">Instagram</Link>
            <Link href={TIKTOK} className="text-primary text-base hover:underline lg:text-lg">Tiktok</Link>
          </div>
          <div>
            <div className="space-y-2 mb-4">
              <h1 className="text-secondary font-light text-base lg:text-lg">Address</h1>
              <p className="text-primary font-normal text-base lg:text-lg">{ADDRESS}</p>
            </div>
            <div className="space-y-2 mb-4">
              <h1 className="text-secondary font-light text-base lg:text-lg">Phone / WhatsApp</h1>
              <p className="text-primary font-normal text-base lg:text-lg">{PHONE_OR_WHATSAPP}</p>
            </div>
            <div className="space-y-2">
              <h1 className="text-secondary font-light text-base lg:text-lg">Operational Hour</h1>
              <p className="text-primary font-normal text-base lg:text-lg">10am - 8pm ( WIB )</p>
            </div>
          </div>
          <div className="w-full">
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
        </div>
      </footer>
    </div>
  );
}