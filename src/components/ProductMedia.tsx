"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import ProductGallery from "@/components/ProductGallery";

const Product3DViewer = dynamic(() => import("@/components/Product3DViewer"), { ssr: false });

// Bloc média de la fiche produit : galerie photos + onglet « Vue 3D » quand un modèle existe.
export default function ProductMedia({
  images,
  alt,
  category,
  model3d,
  labels,
}: {
  images: string[];
  alt: string;
  category: string;
  model3d: string | null;
  labels: {
    photos: string;
    view3d: string;
    hint3d: string;
    loading3d: string;
    fullscreen3d: string;
    exitFullscreen3d: string;
  };
}) {
  // La vue 3D est affichée d'emblée quand un modèle existe.
  const [tab, setTab] = useState<"photos" | "3d">(model3d ? "3d" : "photos");

  const photos = images.length ? (
    <ProductGallery images={images} alt={alt} />
  ) : (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm uppercase tracking-wider">
      {category}
    </div>
  );

  if (!model3d) return photos;

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-colors ${
      active
        ? "bg-gray-900 border-gray-900 text-white"
        : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "3d"}
          onClick={() => setTab("3d")}
          className={tabClass(tab === "3d")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          {labels.view3d}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "photos"}
          onClick={() => setTab("photos")}
          className={tabClass(tab === "photos")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {labels.photos}
        </button>
      </div>

      {tab === "photos" ? (
        photos
      ) : (
        <Product3DViewer
          src={model3d}
          alt={alt}
          hint={labels.hint3d}
          loadingLabel={labels.loading3d}
          fullscreenLabel={labels.fullscreen3d}
          exitFullscreenLabel={labels.exitFullscreen3d}
        />
      )}
    </div>
  );
}
