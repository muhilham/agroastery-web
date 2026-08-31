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

        {/* Shipping info + timeline */}

        <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4 mb-4">
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-4" />
          <div className="h-3 w-full bg-white/10 rounded animate-pulse mb-1" />
          <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse mb-4" />

          {/* Tracking timeline skeleton */}
          <div className="space-y-4 pt-4 border-t border-white/10">
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

        {/* Items */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4 mb-4 space-y-3">
          <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-3" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse shrink-0" />
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-3 border-t border-white/10">
            <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}