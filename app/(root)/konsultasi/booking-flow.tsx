"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { numberToIdr } from "@/lib/numberToIdr";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ADDRESS } from "@/constant/resource-and-link";
import {
  CONSULTATION_FEE_IDR,
  CONSULTATION_PURPOSES,
  type ConsultationPurpose,
} from "@/lib/consultations/constants";

const MAPS_DIRECTIONS_URL =
  "https://www.google.com/maps/place/AGROASTERY/@-6.2637061,106.8194468,843m/data=!3m2!1e3!4b1!4m6!3m5!1s0x2e69f1a21b4040ed:0x1ca0ab06ef63e366!8m2!3d-6.2637061!4d106.8194468!16s%2Fg%2F11h7r_fy7s?entry=ttu&g_ep=EgoyMDI2MDcyMC4wIKXMDSoASAFQAw%3D%3D";

interface DateAvailability {
  date: string;
  slots: { time: string; available: boolean }[];
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const FormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(8, "Nomor WhatsApp tidak valid"),
  purpose: z.enum(["custom_blending", "product_testing"]),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function BookingFlow() {
  const router = useRouter();
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  async function loadAvailability() {
    const res = await fetch("/api/consultations/availability");
    if (res.ok) {
      const json = await res.json();
      setDates(json.dates ?? []);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  const selected = dates.find((d) => d.date === selectedDate);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          booking_date: selectedDate,
          time_slot: selectedSlot,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Terjadi kesalahan. Coba lagi.");
        if (json.code === "SLOT_TAKEN") {
          setSelectedSlot(null);
          loadAvailability();
        }
        return;
      }
      router.push(`/konsultasi/bayar/${json.bookingId}`);
    } catch {
      setSubmitError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary mb-2">Konsultasi Kopi</h1>
        <p className="text-secondary text-sm mb-3">
          2 jam &middot; {numberToIdr({ nominal: CONSULTATION_FEE_IDR })}
        </p>

        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">
            Lokasi
          </p>
          <p className="text-sm text-white/60">Agroastery Private Bar</p>
          <p className="text-xs text-secondary leading-relaxed mt-0.5">{ADDRESS}</p>
          <a
            href={MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-primary underline underline-offset-4 mt-2"
          >
            Buka di Google Maps
          </a>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            Untuk Apa
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            Setiap cafe punya karakter sendiri. Karakter dengan pelanggan yang berbeda, rasa yang dituju juga berbeda. Karena itu kopi yang cocok untuk satu tempat belum tentu cocok untuk tempat lain,
            dan satu-satunya cara memastikannya adalah dengan mencobanya sendiri.
          </p>

          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mt-3 mb-1">
            Yang Anda Dapatkan
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-white/60 leading-relaxed">
            <li>Diskusi karakter rasa yang sesuai dengan menu dan pelanggan Anda</li>
            <li>Eksplorasi kopi sesuai dengan preferensi dan menu andalan cafe Anda</li>
            <li>Penawaran harga wholesale</li>
          </ul>

          <p className="text-xs text-secondary leading-relaxed mt-3">
            Menggunakan peralatan kami: espresso machine double boiler, Grinder EK43 dan
            Mazzer Super Jolly.
          </p>
          <p className="text-xs text-secondary leading-relaxed mt-2">
            Bawa bahan sendiri (susu, gula, dll) — kecuali biji kopi. Atau tim kami
            bisa belanjakan (biaya ditambah ke invoice akhir).
          </p>
        </div>
        <a
          href={buildWhatsAppLink("Halo, saya mau tanya tentang konsultasi kopi")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Ada pertanyaan? Chat kami
        </a>
      </div>

      <div className="space-y-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Pilih Tanggal</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
            {dates.map((d) => {
              const [y, m, dd] = d.date.split("-").map(Number);
              const weekday = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
              const allTaken = d.slots.every((s) => !s.available);
              const active = selectedDate === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={allTaken}
                  onClick={() => {
                    setSelectedDate(d.date);
                    setSelectedSlot(null);
                  }}
                  className={`flex flex-col items-center shrink-0 min-w-14 rounded-lg border-2 px-3 py-2 text-sm transition-colors
                    ${active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-[#242424] text-secondary"}
                    ${allTaken ? "opacity-30" : "hover:border-primary/60"}`}
                >
                  <span className="text-xs">{DAY_SHORT[weekday]}</span>
                  <span className="font-semibold">{dd}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && selected && (
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
              <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Pilih Waktu</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.slots.map((s) => {
                const active = selectedSlot === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSlot(s.time)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm transition-colors
                      ${active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-[#242424] text-secondary"}
                      ${!s.available ? "opacity-30 line-through" : "hover:border-primary/60"}`}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedSlot && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
              <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Data Diri</h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-white/60" htmlFor="name">Nama</label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-white/60" htmlFor="email">Email</label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-white/60" htmlFor="phone">No. WhatsApp</label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm text-white/60 mb-2">Tujuan</legend>
              <div className="space-y-2">
                {(Object.keys(CONSULTATION_PURPOSES) as ConsultationPurpose[]).map((key) => (
                  <label
                    key={key}
                    className="flex items-start gap-2.5 rounded-lg border-2 border-white/10 bg-[#242424] p-3 text-sm text-white/60 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary transition-colors"
                  >
                    <input type="radio" value={key} {...register("purpose")} className="accent-primary mt-0.5" />
                    <span>{CONSULTATION_PURPOSES[key]}</span>
                  </label>
                ))}
              </div>
              {errors.purpose && <p className="text-destructive text-xs mt-2">Pilih salah satu</p>}
            </fieldset>

            <div className="space-y-1.5">
              <label className="block text-sm text-white/60" htmlFor="notes">Catatan (opsional)</label>
              <Textarea
                id="notes"
                placeholder="Ceritakan menu andalan Anda atau bahan yang ingin dibawa (opsional)"
                {...register("notes")}
              />
            </div>

            {submitError && <p className="text-destructive text-sm">{submitError}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Memproses..." : `Bayar ${numberToIdr({ nominal: CONSULTATION_FEE_IDR })} & Konfirmasi`}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
