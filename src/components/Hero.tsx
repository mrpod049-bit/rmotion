"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// Photos des machines (dossier public/gammes). Ordre alterné laser / CNC.
const images = [
  "/gammes/cnc-1.jpg",
  "/gammes/laser-1.jpg",
  "/gammes/cnc-2.jpg",
  "/gammes/laser-2.jpg",
  "/gammes/cnc-3.jpg",
  "/gammes/laser-3.jpg",
  "/gammes/cnc-4.jpg",
  "/gammes/laser-4.jpg",
  "/gammes/cnc-5.jpg",
];

const VISIBLE = 3; // nombre de photos affichées en même temps
const STEP_MS = 2200; // temps entre deux crans

export default function Hero() {
  // On duplique les premières images en fin de piste pour un bouclage sans couture.
  const track = [...images, ...images.slice(0, VISIBLE)];
  const N = track.length;

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Avance d'un cran à intervalle régulier, en continu.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearInterval(id);
  }, []);

  // Bouclage : une fois arrivé sur les clones, on revient au début sans animation.
  useEffect(() => {
    if (index === images.length) {
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
      }, 800);
      return () => clearTimeout(t);
    }
    if (!animate) {
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
  }, [index, animate]);

  return (
    <section className="relative bg-white text-white overflow-hidden">
      {/* Fond blanc + photos plus petites et espacées qui défilent de droite à gauche */}
      <div className="absolute inset-0 flex items-center bg-white">
        <div
          className="flex"
          style={{
            width: `${(N * 100) / VISIBLE}%`,
            transform: `translateX(-${(index * 100) / N}%)`,
            transition: animate ? "transform 800ms ease-in-out" : "none",
          }}
        >
          {track.map((src, i) => (
            <div key={i} style={{ width: `${100 / N}%` }} className="px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden
                className="h-64 w-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filtre bleuté par-dessus les photos */}
      <div className="absolute inset-0 bg-[#0b2239]/70" />

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
