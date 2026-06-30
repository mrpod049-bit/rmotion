"use client";
import Link from "next/link";
import { useState, useRef } from "react";

// Images de démo — à remplacer plus tard par tes propres visuels.
// Il suffit de changer les URLs (ou de pointer vers /public/...).
const images = [
  "https://picsum.photos/seed/rmotion-laser/1600/700",
  "https://picsum.photos/seed/rmotion-cnc/1600/700",
  "https://picsum.photos/seed/rmotion-atelier/1600/700",
  "https://picsum.photos/seed/rmotion-metal/1600/700",
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setHovering(true);
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 1100);
  };

  const stop = () => {
    setHovering(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setActive(0);
  };

  return (
    <section
      className="relative bg-gray-900 text-white overflow-hidden"
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {/* Images de fond qui s'enchaînent au survol */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              hovering && i === active ? "opacity-40" : "opacity-0"
            }`}
          />
        ))}
        {/* Voile sombre pour garder le texte lisible par-dessus les images */}
        <div className="absolute inset-0 bg-gray-900/40" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <p className="text-sm uppercase tracking-widest text-gray-300 mb-4">Machines laser &amp; CNC</p>
        <h1 className="text-5xl font-semibold leading-tight mb-6 max-w-2xl">
          Machines compétitives, pensées pour votre entreprise
        </h1>
        <p className="text-gray-200 text-lg mb-10 max-w-xl">
          Rmotion sélectionne et distribue des machines laser et CNC fiables pour les PME et TPE. Pas de ligne de production — des équipements adaptés à votre échelle.
        </p>
        <div className="flex gap-4">
          <Link href="/machines" className="bg-white text-gray-900 px-6 py-3 rounded font-medium hover:bg-gray-100 transition-colors">
            Voir le catalogue
          </Link>
          <Link href="/devis" className="border border-gray-300 text-white px-6 py-3 rounded hover:border-white hover:bg-white/10 transition-colors">
            Demander un devis
          </Link>
        </div>
      </div>
    </section>
  );
}
