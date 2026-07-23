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
import {
  CONSULTATION_FEE_IDR,
  CONSULTATION_PURPOSES,
  type ConsultationPurpose,
} from "@/lib/consultations/constants";

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
      <h1 className="text-2xl font-semibold text-primary mb-2">Konsultasi Kopi</h1>
      <p className="text-secondary text-sm mb-1">
        2 jam &middot; {numberToIdr({ nominal: CONSULTATION_FEE_IDR })}
      </p>
      <p className="text-sm text-white/60 mb-2">
        Gunakan peralatan kami: espresso machine, EK43, Mazzer Super Jolly.
        Cocok untuk mengembangkan blend untuk menu kafe Anda, atau mencoba
        produk kami dengan bahan Anda sendiri.
      </p>
      <p className="text-xs text-secondary mb-4">
        Bawa bahan sendiri (susu, gula, dll) — kecuali biji kopi. Atau tim kami
        bisa belanjakan (biaya ditambah ke invoice akhir).
      </p>
      <a
        href={buildWhatsAppLink("Halo, saya mau tanya tentang konsultasi kopi")}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary underline underline-offset-4"
      >
        Ada pertanyaan? Chat kami
      </a>

      <h2 className="text-base font-medium text-primary mt-8 mb-3">1. Pilih Tanggal</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
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
              className={`flex flex-col items-center min-w-14 rounded-lg border px-3 py-2 text-sm transition-colors
                ${active ? "border-primary bg-primary/10 text-primary" : "border-white/15 text-secondary"}
                ${allTaken ? "opacity-30" : "hover:border-primary/60"}`}
            >
              <span className="text-xs">{DAY_SHORT[weekday]}</span>
              <span className="font-semibold">{dd}</span>
            </button>
          );
        })}
      </div>

      {selectedDate && selected && (
        <>
          <h2 className="text-base font-medium text-primary mt-6 mb-3">2. Pilih Waktu</h2>
          <div className="flex gap-2">
            {selected.slots.map((s) => {
              const active = selectedSlot === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s.time)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors
                    ${active ? "border-primary bg-primary/10 text-primary" : "border-white/15 text-secondary"}
                    ${!s.available ? "opacity-30 line-through" : "hover:border-primary/60"}`}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedSlot && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <h2 className="text-base font-medium text-primary mb-3">3. Data Diri</h2>

          <label className="block text-sm text-white/60 mb-1" htmlFor="name">Nama</label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-xs mb-2">{errors.name.message}</p>}

          <label className="block text-sm text-white/60 mb-1 mt-3" htmlFor="email">Email</label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs mb-2">{errors.email.message}</p>}

          <label className="block text-sm text-white/60 mb-1 mt-3" htmlFor="phone">No. WhatsApp</label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-destructive text-xs mb-2">{errors.phone.message}</p>}

          <fieldset className="mt-4">
            <legend className="text-sm text-white/60 mb-2">Tujuan</legend>
            {(Object.keys(CONSULTATION_PURPOSES) as ConsultationPurpose[]).map((key) => (
              <label key={key} className="flex items-start gap-2 text-sm mb-2 text-white/60">
                <input type="radio" value={key} {...register("purpose")} className="accent-primary mt-1" />
                <span>{CONSULTATION_PURPOSES[key]}</span>
              </label>
            ))}
            {errors.purpose && <p className="text-destructive text-xs">Pilih salah satu</p>}
          </fieldset>

          <label className="block text-sm text-white/60 mb-1 mt-4" htmlFor="notes">Catatan (opsional)</label>
          <Textarea
            id="notes"
            placeholder="Ceritakan menu andalan Anda atau bahan yang ingin dibawa (opsional)"
            {...register("notes")}
          />

          {submitError && <p className="text-destructive text-sm mt-3">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full mt-5">
            {isSubmitting ? "Memproses..." : `Bayar ${numberToIdr({ nominal: CONSULTATION_FEE_IDR })} & Konfirmasi`}
          </Button>
        </form>
      )}
    </div>
  );
}
