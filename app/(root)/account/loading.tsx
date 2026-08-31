import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-8" />

          {/* Profile section */}
          <section className="mb-8 space-y-4">
            <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded-xl animate-pulse" />
            </div>
          </section>

          {/* Links section */}
          <section className="space-y-2">
            <div className="h-5 w-12 bg-white/10 rounded animate-pulse mb-4" />
            <div className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
