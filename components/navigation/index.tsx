"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import { menuItems } from "@/constant/menu-list";
import { IoMdArrowBack } from "react-icons/io";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

import { useStore } from "@nanostores/react";
import {
  $searchQuery,
  $searchResults,
  setSearchQuery,
  clearSearch,
} from "@/lib/stores/search";
import { selectProductBySlug } from "@/lib/stores/product";
import { numberToIdr } from "@/lib/numberToIdr";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const searchQuery = useStore($searchQuery);
  const results = useStore($searchResults);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
      if (isMenuOpen) setIsMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  const goToProduct = (slug: string) => {
    selectProductBySlug(slug);
    setIsSearchOpen(false);
    clearSearch();
    router.push(`/product/${slug}`);
  };

  return (
    <Fragment>
      {isSearchOpen ? (
        <div className="w-full min-h-svh bg-black fixed z-50">
          <div className="inline-flex gap-6 w-full border-b bg-black thin-border p-3">
            <div className="relative w-full">
              <svg
                width="24"
                height="24"
                className="absolute left-0 h-full ml-3"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M19.675 20.55L13.375 14.25C12.875 14.6666 12.2625 14.9875 11.5375 15.2125C10.8125 15.4375 10.125 15.55 9.475 15.55C7.77117 15.55 6.3285 14.9596 5.147 13.779C3.96567 12.5985 3.375 11.1568 3.375 9.45398C3.375 7.75131 3.96533 6.30831 5.146 5.12498C6.3265 3.94164 7.76817 3.34998 9.471 3.34998C11.1737 3.34998 12.6167 3.94064 13.8 5.12198C14.9833 6.30348 15.575 7.74614 15.575 9.44998C15.575 10.15 15.4625 10.8416 15.2375 11.525C15.0125 12.2083 14.7 12.7916 14.3 13.275L20.625 19.6L19.675 20.55ZM9.475 14.2C10.825 14.2 11.9542 13.7458 12.8625 12.8375C13.7708 11.9291 14.225 10.8 14.225 9.44998C14.225 8.09998 13.7708 6.97081 12.8625 6.06248C11.9542 5.15414 10.825 4.69998 9.475 4.69998C8.125 4.69998 6.99583 5.15414 6.0875 6.06248C5.17917 6.97081 4.725 8.09998 4.725 9.44998C4.725 10.8 5.17917 11.9291 6.0875 12.8375C6.99583 13.7458 8.125 14.2 9.475 14.2Z"
                  fill="#F5EBC9"
                />
              </svg>
              <Input
                type="text"
                placeholder="Cari Produk.."
                className="rounded-full w-full border-secondary placeholder:text-primary placeholder:text-sm p-5 text-secondary pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="text-primary text-sm"
              onClick={() => {
                setIsSearchOpen(false);
                clearSearch();
              }}
            >
              Cancel
            </button>
          </div>

          {/* SEARCH RESULTS */}
          <div>
            {searchQuery.trim().length === 0 ? null : results.length === 0 ? (
              <div className="p-5 text-secondary text-sm">
                Produk tidak ditemukan
              </div>
            ) : (
              results.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => goToProduct(p.slug)}
                  className="w-full text-left inline-flex justify-start items-start gap-5 p-5 thin-border"
                >
                  <div className="thin-border-rounded p-2 border-primary rounded-xl">
                    <img
                      src={
                        p.images?.[0]?.image ?? "/assets/coffe/blend-gayo.png"
                      }
                      className="size-16 h-fit"
                      alt={p.title}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-base text-primary uppercase">
                      {p.title}
                    </h1>
                    <p className="text-sm text-secondary line-clamp-2">
                      {p.description}
                    </p>
                    <div className="text-primary text-sm">
                      {numberToIdr({ nominal: p.price })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <nav
        className={`w-full tablet:h-20 p-6 desktop:h-20 z-40 fixed flex justify-between items-center px-4 tablet:px-10 desktop:px-20 transition-all duration-300 ${isScrolled ? "bg-black/20 backdrop-blur-sm" : "bg-transparent"}`}
      >
        {pathname === "/product" ? (
          <button
            className="inline-flex gap-2 items-center"
            onClick={() => router.back()}
          >
            <IoMdArrowBack color="#F5EBC9" size={18} />
            <span className="text-secondary text-base font-bold">
              Detail Produk
            </span>
          </button>
        ) : pathname === "/recipant-detail" ? (
          <button
            className="inline-flex gap-2 items-center"
            onClick={() => router.back()}
          >
            <IoMdArrowBack color="#F5EBC9" size={18} />
            <span className="text-secondary text-base font-bold">
              Detail produk
            </span>
          </button>
        ) : (
          <button onClick={() => router.push("/")}>
            <Image
              src="/assets/agroastery-logo.svg"
              alt="ag-logogram"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          </button>
        )}

        <ul className="hidden desktop:flex text-primary font-normal py-16 space-x-4 text-base">
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
        <div className="inline-flex items-center gap-2 desktop:hidden">
          <button
            className="text-primary z-50 relative w-6 flex items-center justify-center"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.675 20.55L13.375 14.25C12.875 14.6666 12.2625 14.9875 11.5375 15.2125C10.8125 15.4375 10.125 15.55 9.475 15.55C7.77117 15.55 6.3285 14.9596 5.147 13.779C3.96567 12.5985 3.375 11.1568 3.375 9.45398C3.375 7.75131 3.96533 6.30831 5.146 5.12498C6.3265 3.94164 7.76817 3.34998 9.471 3.34998C11.1737 3.34998 12.6167 3.94064 13.8 5.12198C14.9833 6.30348 15.575 7.74614 15.575 9.44998C15.575 10.15 15.4625 10.8416 15.2375 11.525C15.0125 12.2083 14.7 12.7916 14.3 13.275L20.625 19.6L19.675 20.55ZM9.475 14.2C10.825 14.2 11.9542 13.7458 12.8625 12.8375C13.7708 11.9291 14.225 10.8 14.225 9.44998C14.225 8.09998 13.7708 6.97081 12.8625 6.06248C11.9542 5.15414 10.825 4.69998 9.475 4.69998C8.125 4.69998 6.99583 5.15414 6.0875 6.06248C5.17917 6.97081 4.725 8.09998 4.725 9.44998C4.725 10.8 5.17917 11.9291 6.0875 12.8375C6.99583 13.7458 8.125 14.2 9.475 14.2Z"
                  fill="#F5EBC9"
                />
              </svg>
            </div>
          </button>

          <button
            className="text-primary z-50 relative w-6 flex items-center justify-center"
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
                className={`size-6 absolute inset-0 transition-all duration-300 ${
                  isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
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
                className={`size-6 absolute inset-0 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
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
        </div>
      </nav>
      <div
        className={`fixed inset-0 z-30 transition-all duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="pt-14 px-4 z-30 bg-background pb-4">
          <ul>
            {menuItems.map((item, index) => (
              <li
                key={index}
                className=" h-14 flex flex-col justify-center thin-border"
              >
                <a
                  href={item.link}
                  className="text-primary font-normal text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Fragment>
  );
}
