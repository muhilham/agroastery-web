"use client";

import { FaWhatsapp } from "react-icons/fa";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function HelpSection() {
  const href = buildWhatsAppLink("Halo, saya butuh bantuan dial-in Blend 50:50 saya.");

  return (
    <section className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-xl font-semibold">Butuh Bantuan?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--secondary))]">
          Belum dapat hasil yang Anda inginkan? Tim kami dengan senang hati membantu Anda dial-in
          kopi ini.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackBlendEvent("whatsapp_clicked")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-black"
        >
          <FaWhatsapp className="h-4 w-4" />
          Chat via WhatsApp
        </a>
      </div>
    </section>
  );
}
