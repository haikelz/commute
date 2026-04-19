import { AppProviders } from "@/components/providers/app-providers";
import {
  TransjakartaMotionEyebrow,
  TransjakartaMotionHeroTitle,
  TransjakartaMotionLead,
  TransjakartaPageBackdrop,
} from "@/components/transjakarta/transjakarta-page-motion";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { Map, MapPin, Route } from "lucide-react";

const cards = [
  {
    href: "/transjakarta/rute",
    icon: Route,
    title: "Rute bus",
    body: "Semua rute TransJakarta, tarif, dan detail halte per arah.",
    gridClass: "",
  },
  {
    href: "/transjakarta/halte",
    icon: MapPin,
    title: "Halte terdekat",
    body: "Gunakan lokasi perangkat untuk menemukan halte dan bus stop terdekat.",
    gridClass: "",
  },
  {
    href: "/transjakarta/peta",
    icon: Map,
    title: "Peta armada",
    body: "Persebaran armada bus TransJakarta.",
    gridClass: "sm:col-span-2 lg:col-span-1",
  },
] as const;

export function TransjakartaHome() {
  return (
    <AppProviders>
      <TransjakartaPageBackdrop>
        <TransjakartaMotionEyebrow className="mb-2 text-xs font-medium tracking-wider text-fuchsia-400/90 uppercase">
          TransJakarta
        </TransjakartaMotionEyebrow>
        <TransjakartaMotionHeroTitle className="mb-2 text-3xl sm:text-4xl">
          Rute, Halte, dan Peta Armada
        </TransjakartaMotionHeroTitle>
        <TransjakartaMotionLead
          className="mb-10 max-w-xl text-sm text-zinc-400"
          delay={0.1}
        >
          Daftar rute, urutan halte per arah, dan pencarian halte terdekat dari
          lokasi Anda.
        </TransjakartaMotionLead>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.a
              key={c.href}
              href={c.href}
              className={cn(
                "group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-colors hover:border-fuchsia-500/30 hover:bg-white/[0.07]",
                c.gridClass
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.06 + i * 0.05 }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                <c.icon className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-medium text-zinc-100 group-hover:text-white">
                  {c.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 group-hover:text-zinc-400">
                  {c.body}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </TransjakartaPageBackdrop>
    </AppProviders>
  );
}
