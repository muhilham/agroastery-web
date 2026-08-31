import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">
        <div className="h-8 w-56 bg-white/10 rounded animate-pulse mb-8" />

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse shrink-0" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
