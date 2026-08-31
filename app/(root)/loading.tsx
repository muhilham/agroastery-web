import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">
        <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-4">
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
