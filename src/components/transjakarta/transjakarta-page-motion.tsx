import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const heroGradientClass =
  "text-balance bg-linear-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text font-semibold tracking-tight text-transparent";

const glassPanelClass =
  "rounded-2xl border border-white/10 bg-white/4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-md";

export function TransjakartaPageBackdrop({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export function TransjakartaMotionBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <motion.a
      href={href}
      className="mb-6 inline-flex text-sm text-zinc-500 hover:text-zinc-300"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.a>
  );
}

export function TransjakartaMotionHeroTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.h1
      className={cn(heroGradientClass, className ?? "text-3xl sm:text-4xl")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      {children}
    </motion.h1>
  );
}

export function TransjakartaMotionLead({
  children,
  className,
  delay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.p>
  );
}

export function TransjakartaMotionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.p>
  );
}

export function TransjakartaMotionSection({
  children,
  className,
  delay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.section>
  );
}

export { glassPanelClass };
