import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="space-y-2 min-w-0">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-6 w-28 bg-white/10 rounded-full animate-pulse shrink-0" />
        </div>

        {/* Items */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4 mb-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-lg bg-white/10 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Shipping info */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4 mb-6 space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Tracking timeline */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4 space-y-4">
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
