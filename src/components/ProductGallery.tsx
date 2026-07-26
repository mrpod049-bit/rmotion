"use client";
import { useState } from "react";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = (d: number) => setI((c) => (c + d + n) % n);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-96 flex items-center justify-center overflow-hidden rounded-lg bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[i]}
          alt={`${alt} — vue ${i + 1}`}
          className="max-h-full max-w-full object-contain"
        />

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-center gap-3">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Voir l'image ${idx + 1}`}
              aria-current={idx === i}
              className={`h-16 w-16 rounded border overflow-hidden bg-white transition-colors ${
                idx === i ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" aria-hidden className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
