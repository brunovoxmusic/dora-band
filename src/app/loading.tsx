import { Navbar } from "@/components/site/navbar";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        {/* Hero skeleton */}
        <div className="relative min-h-[100svh] overflow-hidden">
          <div className="absolute inset-0 bg-stage-grid opacity-20" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pt-24 pb-16 sm:px-6 lg:px-8">
            <div className="mb-6 h-6 w-48 animate-pulse bg-charcoal" />
            <div className="h-16 w-64 animate-pulse bg-charcoal sm:h-24 sm:w-96" />
            <div className="mt-4 h-8 w-80 animate-pulse bg-charcoal/70" />
            <div className="mt-6 h-4 w-96 max-w-full animate-pulse bg-charcoal/50" />
            <div className="mt-10 flex gap-3">
              <div className="h-12 w-56 animate-pulse bg-charcoal" />
              <div className="h-12 w-56 animate-pulse bg-charcoal" />
            </div>
            <div className="mt-16 grid max-w-3xl grid-cols-2 gap-px border border-charcoal bg-charcoal sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse bg-ink" />
              ))}
            </div>
          </div>
        </div>

        {/* Section skeletons */}
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-4 h-3 w-32 animate-pulse bg-charcoal" />
          <div className="mb-6 h-10 w-80 animate-pulse bg-charcoal" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse bg-charcoal" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
