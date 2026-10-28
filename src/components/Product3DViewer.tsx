"use client";
import { useEffect, useRef, useState, type HTMLAttributes } from "react";

// Typage JSX du web component <model-viewer> (Google), chargé à la demande.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": HTMLAttributes<HTMLElement> & Record<string, unknown>;
    }
  }
}

export default function Product3DViewer({
  src,
  alt,
  hint,
  loadingLabel,
  fullscreenLabel,
  exitFullscreenLabel,
}: {
  src: string;
  alt: string;
  hint: string;
  loadingLabel: string;
  fullscreenLabel: string;
  exitFullscreenLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Plein écran « maison » (overlay fixe) : fonctionne aussi sur iPhone, où l'API Fullscreen
  // n'est pas disponible pour un élément quelconque.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // La lib (three.js inclus) n'est téléchargée que lorsque le visiteur ouvre la vue 3D.
  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onProgress = (e: Event) =>
      setProgress((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
    const onLoad = () => setLoaded(true);
    el.addEventListener("progress", onProgress);
    el.addEventListener("load", onLoad);
    return () => {
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("load", onLoad);
    };
  }, [ready]);

  return (
    <div
      className={`overflow-hidden bg-gradient-to-b from-white to-gray-100 ${
        expanded ? "fixed inset-0 z-50" : "relative h-[480px] lg:h-[600px] rounded-lg"
      }`}
    >
      {ready && (
        <model-viewer
          ref={ref}
          src={src}
          alt={alt}
          camera-controls=""
          touch-action="pan-y"
          auto-rotate=""
          auto-rotate-delay="1500"
          rotation-per-second="20deg"
          interaction-prompt="none"
          // Éclairage plus contrasté que le défaut (qui délave les blancs du carénage).
          tone-mapping="aces"
          exposure="0.75"
          environment-image="legacy"
          shadow-intensity="1.3"
          shadow-softness="0.5"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      )}

      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <p className="text-xs uppercase tracking-wider text-gray-400">{loadingLabel}</p>
          <div className="w-40 h-1 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? exitFullscreenLabel : fullscreenLabel}
        title={expanded ? exitFullscreenLabel : fullscreenLabel}
        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-colors"
      >
        {expanded ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>

      {loaded && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/80 border border-gray-200 text-xs text-gray-500 pointer-events-none whitespace-nowrap">
          {hint}
        </p>
      )}
    </div>
  );
}
