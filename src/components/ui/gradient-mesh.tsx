import { cn } from "../../lib/cn";

type Props = { className?: string };

export function GradientMesh({ className }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div
        className="gradient-mesh-blob-a absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-[80px]"
        aria-hidden
      />
      <div
        className="gradient-mesh-blob-b absolute -right-1/4 bottom-0 h-[480px] w-[480px] rounded-full bg-cyan-500/20 blur-[72px]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
    </div>
  );
}
