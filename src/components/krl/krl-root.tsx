import { AppProviders } from "@/components/providers/app-providers";
import { cn } from "@/lib/cn";
import { lazy, Suspense, useState } from "react";

const KrlSchedule = lazy(() =>
  import("./krl-schedule").then((m) => ({ default: m.KrlSchedule }))
);
const KrlFare = lazy(() =>
  import("./krl-fare").then((m) => ({ default: m.KrlFare }))
);

type Tab = "jadwal" | "tarif";

function TabFallback() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-white/4 py-16 text-sm text-zinc-500 backdrop-blur-xl">
      Memuat…
    </div>
  );
}

export function KrlRoot() {
  const [tab, setTab] = useState<Tab>("jadwal");

  return (
    <AppProviders>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10"
          aria-label="Menu utama"
        >
          <button
            type="button"
            onClick={() => setTab("jadwal")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === "jadwal"
                ? "border-fuchsia-500/50 bg-fuchsia-500/15 text-white"
                : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            Jadwal
          </button>
          <button
            type="button"
            onClick={() => setTab("tarif")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === "tarif"
                ? "border-fuchsia-500/50 bg-fuchsia-500/15 text-white"
                : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            Biaya KRL
          </button>
        </nav>

        <Suspense fallback={<TabFallback />}>
          {tab === "jadwal" ? <KrlSchedule /> : <KrlFare />}
        </Suspense>
      </div>
    </AppProviders>
  );
}
