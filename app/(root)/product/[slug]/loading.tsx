import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 mx-auto desktop:pt-32 w-full desktop:px-20 relative desktop:flex desktop:flex-row min-h-screen pb-24 desktop:pb-0">
        {/* Image carousel skeleton */}
        <div className="w-full desktop:w-1/2 desktop:sticky desktop:top-24 desktop:self-start">
          <div className="aspect-square bg-white/10 animate-pulse" />
          <div className="flex gap-2 mt-3 px-4 tablet:px-6 desktop:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg bg-white/10 animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>

        <section className="flex-1 min-w-0">
          {/* Price + name */}
          <div className="px-4 tablet:px-6 mb-8 flex flex-col gap-2 mt-2">
            <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
          </div>

          {/* Variant selectors */}
          <div className="px-4 tablet:px-6 mb-4 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-16 bg-white/10 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-16 bg-white/10 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stock status */}
          <div className="px-4 tablet:px-6 mb-3">
            <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
          </div>

          {/* Description */}
          <div className="px-4 tablet:px-6 pb-10 space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-white/10 rounded animate-pulse" />
          </div>
        </section>

        {/* Desktop sidebar skeleton */}
        <div className="bg-[#242424] p-4 h-fit rounded-xl space-y-5 w-72 desktop:block hidden">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            <div className="h-5 w-6 bg-white/10 rounded animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-white/10 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-white/10 rounded-xl animate-pulse" />
        </div>

        {/* Mobile floating bar skeleton */}
        <div className="fixed bottom-0 w-full left-0 desktop:hidden bg-black/95 backdrop-blur-sm flex gap-2 z-40 px-4 py-3 border-t border-white/10">
          <div className="flex-1 h-11 bg-white/10 rounded-xl animate-pulse" />
          <div className="flex-1 h-11 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
