import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md mx-auto w-full text-center">
          {/* Title placeholder */}
          <div className="h-6 w-40 mx-auto bg-white/10 animate-pulse rounded mb-2" />
          <div className="h-4 w-56 mx-auto bg-white/10 animate-pulse rounded mb-8" />

          {/* QR code placeholder */}
          <div className="w-48 h-48 mx-auto bg-white/10 animate-pulse rounded-xl mb-6" />

          {/* Payment info placeholders */}
          <div className="space-y-3">
            <div className="h-4 w-3/4 mx-auto bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-1/2 mx-auto bg-white/10 animate-pulse rounded" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}