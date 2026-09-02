import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Kebijakan Privasi — Agroastery",
  description:
    "Kebijakan privasi Agroastery — bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
  alternates: { canonical: "/kebijakan-privasi" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 pt-28 pb-16 px-4 tablet:px-10 desktop:px-20 max-w-4xl mx-auto">
        <h1 className="text-3xl font-light tracking-wider text-[#f5ebc9] mb-8">
          Kebijakan Privasi
        </h1>
        <p className="text-sm text-[#ccc4a9] mb-8">
          Terakhir diperbarui: 2 September 2026
        </p>

        <section className="space-y-6 text-[#ccc4a9] font-extralight leading-relaxed">
          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat menggunakan layanan Agroastery, termasuk:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nama lengkap dan alamat email</li>
              <li>Alamat pengiriman</li>
              <li>Nomor telepon</li>
              <li>Informasi pembayaran (diproses oleh pihak ketiga — Pivot Payment Gateway)</li>
              <li>Riwayat pesanan dan preferensi produk</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">2. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Memproses dan mengirimkan pesanan Anda</li>
              <li>Memberikan layanan konsultasi kopi</li>
              <li>Mengirimkan notifikasi terkait pesanan</li>
              <li>Meningkatkan kualitas produk dan layanan</li>
              <li>Menganalisis penggunaan situs web (Google Analytics)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">3. Perlindungan Data</h2>
            <p>
              Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran. Data pembayaran ditangani sepenuhnya oleh Pivot Payment Gateway yang telah tersertifikasi PCI DSS.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">4. Pengungkapan kepada Pihak Ketiga</h2>
            <p>
              Kami tidak menjual informasi pribadi Anda. Informasi dapat dibagikan dengan:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Pihak pemroses pembayaran (Pivot Payment Gateway)</li>
              <li>Pihak jasa pengiriman (Biteship)</li>
              <li>Google Analytics (data anonim agregat)</li>
              <li>Jika diwajibkan oleh hukum</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">5. Hak Anda</h2>
            <p>
              Anda berhak untuk mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui akun Anda atau dengan menghubungi kami melalui WhatsApp.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">6. Cookie</h2>
            <p>
              Situs kami menggunakan cookie untuk menyimpan sesi keranjang belanja dan menganalisis penggunaan situs. Anda dapat mengontrol penggunaan cookie melalui pengaturan browser Anda.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-light text-[#f5ebc9] mb-2">7. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, hubungi kami melalui:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>WhatsApp: +62 897-9092-726</li>
              <li>Alamat: Jl. Kemang Barat No.7I, Jakarta Selatan 12730</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}