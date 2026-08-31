import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          {/* Header placeholder */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-5 w-5 bg-white/10 animate-pulse rounded" />
            <div className="h-6 w-32 bg-white/10 animate-pulse rounded" />
          </div>

          {/* Address card placeholders */}
          <div className="space-y-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 space-y-3"
              >
                <div className="h-4 w-3/4 bg-white/10 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-white/10 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-white/10 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Add new address placeholder */}
          <div className="h-12 w-full rounded-xl border border-dashed border-primary/40 bg-white/5 animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
