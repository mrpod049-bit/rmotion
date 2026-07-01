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

const IMG_W = 391; // largeur fixe d'une photo (px)
const IMG_H = 326; // hauteur fixe d'une photo (px)
const GAP = 100; // écart entre deux photos (px)
const STEP = IMG_W + GAP; // distance parcourue à chaque cran
const CLONES = 3; // photos dupliquées en fin de piste pour boucler sans couture
const STEP_MS = 2200; // temps entre deux crans

export default function Hero() {
  const track = [...images, ...images.slice(0, CLONES)];

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
      {/* Fond blanc + photos (taille fixe, écart fixe) qui défilent de droite à gauche */}
      <div className="absolute inset-0 flex items-center bg-white">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * STEP}px)`,
            transition: animate ? "transform 800ms ease-in-out" : "none",
          }}
        >
          {track.map((src, i) => (
            <div key={i} className="shrink-0" style={{ width: IMG_W, marginRight: GAP }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden
                style={{ height: IMG_H }}
                className="w-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filtre bleuté par-dessus les photos */}
      <div className="absolute inset-0 bg-[#0b2239]/55" />

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
