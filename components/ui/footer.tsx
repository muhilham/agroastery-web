"use client";

import { footer } from "@/constant/menu-list";
import { MAP_LOCATION } from "@/constant/resource-and-link";

export function Footer() {
  return (
    <footer className="p-16 bg-[#171717] gap-10 flex w-full justify-between sm:p-8 sm:flex-col sm:gap-10">
      <div className="flex flex-col space-y-5 sm:w-full">
        {footer.map((link) => {
          const isInternal = link.href.startsWith("/");
          return (
            <a
              key={link.label}
              href={link.href}
              {...(isInternal
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
            >
              {link.label}
            </a>
          );
        })}
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
          <p className="font-extralight leading-relaxed text-[#ccc4a9]">
            +62 897-9092-726
          </p>
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
