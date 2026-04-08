"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import { menuItems } from "@/constant/menu-list";
import { IoMdArrowBack } from "react-icons/io";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { useStore } from "@nanostores/react";
import {
  $searchQuery,
  $searchResults,
  setSearchQuery,
  clearSearch,
} from "@/lib/stores/search";
import { numberToIdr } from "@/lib/numberToIdr";
import { SHOPEE, TOKOPEDIA } from "@/constant/resource-and-link";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const segs = pathname.split("/").filter(Boolean);

  const isCheckoutPath = segs.at(-1) === "checkout";
  const isProductPath = segs[0] === "product" && segs.length <= 2;

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const searchQuery = useStore($searchQuery);
  const results = useStore($searchResults);
  const { cartCount } = useCart();
  const { user, signIn, signOut } = useAuth();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
      if (isMenuOpen) setIsMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  const goToProduct = (slug: string) => {
    setIsSearchOpen(false);
    clearSearch();
    router.push(`/product/${slug}`);
  };

  return (
    <Fragment>
      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 bg-black h-svh flex flex-col overflow-hidden">
          {/* HEADER */}
          <div className="shrink-0 border-b bg-black thin-border p-3">
            <div className="flex gap-6 w-full">
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
          </div>

          {/* SEARCH RESULTS (scrollable) */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
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
                  <div className="thin-border-rounded aspect-video p-2 border-primary rounded-xl shrink-0">
                    <Image
                      src={p.imageUrl}
                      width={64}
                      height={64}
                      className="size-16"
                      alt={p.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-base text-primary uppercase">
                      {p.name}
                    </h1>
                    <p className="text-sm text-secondary line-clamp-2">
                      {p.shortDescription}
                    </p>
                    <div className="text-primary text-sm">
                      {numberToIdr({ nominal: p.minPrice })}
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
        {isProductPath ? (
          <button
            className="inline-flex gap-2 items-center"
            onClick={() => router.back()}
          >
            <IoMdArrowBack color="#F5EBC9" size={18} />
            <span className="text-secondary text-base font-bold">
              Detail Produk
            </span>
          </button>
        ) : isCheckoutPath ? (
          <button
            className="inline-flex gap-2 items-center"
            onClick={() => router.back()}
          >
            <IoMdArrowBack color="#F5EBC9" size={18} />
            <span className="text-secondary text-base font-bold">
              Detail penerima
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
              style={{ height: "auto" }}
            />
          </button>
        )}

        <ul className="hidden desktop:flex text-primary font-normal py-16 space-x-4 text-base items-center">
          <li>
            <a href={TOKOPEDIA} target="_blank" className="hover:underline">
              Tokopedia
            </a>
          </li>
          <li>
            <a href={SHOPEE} target="_blank" className="hover:underline">
              Shopee
            </a>
          </li>
          <li>
            <a href="/katalog" className="hover:underline">
              Buy now
            </a>
          </li>
          {/* Cart icon — desktop */}
          <li>
            <Link href="/cart" className="relative inline-flex items-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#f5ebc9] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </li>
          {/* Auth — desktop */}
          <li>
            {user ? (
              <div className="inline-flex items-center gap-2">
                <Link href="/account" className="hover:underline flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.user_metadata?.full_name?.split(" ")[0] ?? "Account"}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="text-white/40 hover:text-white/70"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="text-primary hover:underline text-sm"
              >
                Masuk
              </button>
            )}
          </li>
        </ul>

        {/* Mobile right side icons */}
        <div className="inline-flex items-center gap-3 desktop:hidden">
          {/* Cart icon — mobile */}
          <Link href="/cart" className="relative inline-flex items-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {mounted && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#f5ebc9] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          <button
            className="text-primary z-50 relative w-6 flex items-center justify-center"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Toggle search"
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

      {/* Mobile menu overlay */}
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
                className="h-14 flex flex-col justify-center thin-border"
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
            {/* Cart link in mobile menu */}
            <li className="h-14 flex flex-col justify-center thin-border">
              <Link
                href="/cart"
                className="text-primary font-normal text-sm inline-flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4" />
                Keranjang {mounted && cartCount > 0 && `(${cartCount})`}
              </Link>
            </li>
            {/* Auth in mobile menu */}
            <li className="h-14 flex flex-col justify-center thin-border">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/account"
                      className="text-primary font-normal text-sm inline-flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="text-primary/70 font-normal text-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                  </div>
                  <button
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="text-white/40 text-sm"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { signIn(); setIsMenuOpen(false); }}
                  className="text-primary font-normal text-sm text-left inline-flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Masuk
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </Fragment>
  );
}
