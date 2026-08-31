import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <div className="px-6 pb-4 space-y-3">
          <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
        </div>
        <div className="px-6 pb-6 grid gap-4 grid-cols-2 tablet:grid-cols-3 tablet:pl-6 tablet:pr-0 desktop:pr-0 desktop:pl-6 desktop:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/10 animate-pulse aspect-[3/4]"
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
