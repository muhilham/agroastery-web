import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </main>
      <Footer />
    </div>
  );
}
