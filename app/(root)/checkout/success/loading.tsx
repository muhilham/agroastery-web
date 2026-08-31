import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md mx-auto w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-center">
          {/* Checkmark icon placeholder */}
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 animate-pulse mb-6" />

          {/* Text line placeholders */}
          <div className="space-y-3 mb-6">
            <div className="h-4 w-3/4 mx-auto bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-1/2 mx-auto bg-white/10 animate-pulse rounded" />
          </div>

          {/* Button placeholder */}
          <div className="h-10 w-full rounded-xl bg-white/10 animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
