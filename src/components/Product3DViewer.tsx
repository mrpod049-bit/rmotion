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
}: {
  src: string;
  alt: string;
  hint: string;
  loadingLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

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
    <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-b from-white to-gray-100">
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
          shadow-intensity="1"
          exposure="1"
          environment-image="neutral"
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

      {loaded && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/80 border border-gray-200 text-xs text-gray-500 pointer-events-none whitespace-nowrap">
          {hint}
        </p>
      )}
    </div>
  );
}
