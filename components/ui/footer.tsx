"use client";

import Link from "next/link";

import { footer } from "@/constant/menu-list";
import { MAP_LOCATION } from "@/constant/resource-and-link";

const phone = (process.env.NEXT_PUBLIC_AGROASTERY_WA_NUMBER ?? "+628979092726").replace(/^\+/, "");

export function Footer() {
  return (
    <footer className="p-16 bg-[#171717] gap-10 flex w-full justify-between sm:p-8 sm:flex-col sm:gap-10">
      <div className="flex flex-col space-y-5 sm:w-full">
        {footer.map((link) =>
          link.href.startsWith("/") ? (
            <Link
              key={link.label}
              href={link.href}
              className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
            >
              {link.label}
            </a>
          )
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:gap-1">
          <h6 className="text-xs font-bold text-[#ccc4a9]">ADDRESS</h6>
          <p className="max-w-[400px] font-extralight leading-relaxed text-[#ccc4a9]">
            Jl. Kemang Barat No.7I, RT.9/RW.1, Bangka, Kec. Mampang Prpt., Kota
            Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12730
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:gap-1">
          <h6 className="text-xs font-bold text-[#ccc4a9]">PHONE / WHATSAPP</h6>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-extralight leading-relaxed text-[#ccc4a9] hover:text-[#25D366] transition-colors inline-flex items-center gap-1"
          >
            +62 897-9092-726
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
        <div className="flex flex-col gap-2 sm:gap-1">
          <h6 className="text-xs font-bold text-[#ccc4a9]">OPERATIONAL HOUR</h6>
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
  );
}