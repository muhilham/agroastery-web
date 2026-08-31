import Navigation from "@/components/navigation";

export default function Loading() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          {/* Checkmark icon placeholder */}
          <div className="w-20 h-20 mx-auto rounded-full bg-white/10 animate-pulse mb-6" />

          {/* Text placeholders */}
          <div className="space-y-3 mb-6">
            <div className="h-6 w-48 mx-auto bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-3/4 mx-auto bg-white/10 animate-pulse rounded" />
          </div>

          {/* Order number chip placeholder */}
          <div className="h-8 w-40 mx-auto bg-white/10 animate-pulse rounded-full" />

          {/* Button placeholder */}
          <div className="mt-8 space-y-3">
            <div className="h-10 w-full bg-white/10 animate-pulse rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}