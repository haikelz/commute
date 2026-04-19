import { cn } from "@/lib/cn";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type MapFullscreenFrameProps = {
  children: ReactNode;
  className?: string;
  mapResize?: () => void;
  heightClassName?: string;
};

export function MapFullscreenFrame({
  children,
  className,
  mapResize,
  heightClassName = "h-[min(70vh,560px)]",
}: MapFullscreenFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const labelId = useId();

  const scheduleResize = useCallback(() => {
    requestAnimationFrame(() => {
      mapResize?.();
      setTimeout(() => mapResize?.(), 120);
    });
  }, [mapResize]);

  const syncState = useCallback(() => {
    const el = frameRef.current;
    const native =
      !!el &&
      (document.fullscreenElement === el ||
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement === el);
    setFullscreen(native);
  }, []);

  useEffect(() => {
    const onChange = () => syncState();

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener(
      "webkitfullscreenchange",
      onChange as EventListener
    );

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onChange as EventListener
      );
    };
  }, [syncState]);

  useEffect(() => {
    if (!pseudoFullscreen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scheduleResize();

    return () => {
      document.body.style.overflow = prev;
    };
  }, [pseudoFullscreen, scheduleResize]);

  useEffect(() => {
    scheduleResize();
  }, [fullscreen, pseudoFullscreen, scheduleResize]);

  const exitPseudo = useCallback(() => {
    setPseudoFullscreen(false);
    scheduleResize();
  }, [scheduleResize]);

  useEffect(() => {
    if (!pseudoFullscreen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") exitPseudo();
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [pseudoFullscreen, exitPseudo]);

  const toggle = useCallback(async () => {
    const el = frameRef.current;
    if (!el) return;

    if (pseudoFullscreen) {
      exitPseudo();
      scheduleResize();
      return;
    }

    const docFs = document.fullscreenElement;
    const req =
      el.requestFullscreen?.bind(el) ??
      (
        el as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        }
      ).webkitRequestFullscreen?.bind(el);

    const exit =
      document.exitFullscreen?.bind(document) ??
      (
        document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
        }
      ).webkitExitFullscreen?.bind(document);

    try {
      if (docFs === el) {
        if (exit) await exit();
        scheduleResize();
        return;
      }
      if (req) {
        await req();
      } else {
        setPseudoFullscreen(true);
      }
    } catch {
      setPseudoFullscreen((p) => !p);
    }
    scheduleResize();
  }, [pseudoFullscreen, exitPseudo, scheduleResize]);

  const isExpanded = fullscreen || pseudoFullscreen;

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg",
        isExpanded
          ? pseudoFullscreen
            ? "fixed inset-0 z-[200] h-[100dvh] max-h-[100dvh] rounded-none border-zinc-800"
            : "h-screen max-h-[100dvh] rounded-none border-zinc-800"
          : heightClassName,
        className
      )}
    >
      <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur-md transition-colors hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/50"
          aria-pressed={isExpanded}
          aria-expanded={isExpanded}
          aria-controls={labelId}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Keluar layar penuh</span>
            </>
          ) : (
            <>
              <Maximize2 className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Layar penuh</span>
            </>
          )}
        </button>
      </div>
      <span id={labelId} className="sr-only">
        {isExpanded ? "Peta mode layar penuh" : "Peta mode biasa"}
      </span>
      <div className="relative h-full min-h-0 w-full">{children}</div>
    </div>
  );
}
