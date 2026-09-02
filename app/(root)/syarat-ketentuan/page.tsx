import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Syarat & Ketentuan — Agroastery",
  description:
    "Syarat dan ketentuan penggunaan situs Agroastery — hak dan kewajiban pengguna dalam berbelanja kopi spesialti.",
  alternates: { canonical: "/syarat-ketentuan" },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 pt-28 pb-16 px-4 tablet:px-10 desktop:px-20 max-w-4xl mx-auto">
        <h1 className="text-3xl font-light tracking-wider text-[#f5ebc9] mb-8">
          Syarat & Ketentuan
        </h1>
        <p className="text-sm text-[#ccc4a9] mb-8">
          Terakhir diperbarui: 2 September 2026
        </p>

        <section className="space-y-6 text-[#ccc4a9] font-extralight leading-relaxed">
          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan situs Agroastery, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak setuju, jangan gunakan situs ini.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">2. Produk dan Harga</h2>
            <p>
              Seluruh harga produk tercantum dalam Rupiah (IDR) dan belum termasuk ongkos kirim. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya. Kami berhak membatasi jumlah pembelian.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">3. Pemesanan dan Pembayaran</h2>
            <p>
              Pembayaran diproses melalui Pivot Payment Gateway (QRIS). Pesanan akan diproses setelah pembayaran berhasil dikonfirmasi. Kami berhak menolak atau membatalkan pesanan jika terjadi indikasi penipuan atau kesalahan harga.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">4. Pengiriman</h2>
            <p>
              Pengiriman dilakukan melalui mitra logistik pihak ketiga. Estimasi waktu pengiriman tergantung lokasi tujuan. Kerusakan akibat pengiriman harus dilaporkan dalam waktu 1x24 jam setelah paket diterima.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">5. Retur dan Refund</h2>
            <p>
              Produk kopi yang sudah dibuka tidak dapat diretur. Jika produk diterima dalam kondisi rusak atau cacat, laporkan melalui WhatsApp dalam waktu 1x24 jam dan kami akan mengganti produk yang sama.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">6. Konsultasi Kopi</h2>
            <p>
              Layanan konsultasi kopi bersifat reservasi. Pembatalan atau penjadwalan ulang harus dilakukan minimal 24 jam sebelum sesi. Kegagalan hadir tanpa pemberitahuan akan dikenakan biaya penuh.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">7. Kekayaan Intelektual</h2>
            <p>
              Seluruh konten di situs ini — termasuk teks, gambar, logo, dan merek — adalah milik Agroastery. Dilarang menggunakan, mereproduksi, atau mendistribusikan tanpa izin tertulis.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">8. Batasan Tanggung Jawab</h2>
            <p>
              Agroastery tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan produk atau situs ini. Tanggung jawab kami terbatas pada nilai pembelian produk yang bersangkutan.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">9. Perubahan Ketentuan</h2>
            <p>
              Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini. Penggunaan lanjutan setelah perubahan berarti persetujuan Anda.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}