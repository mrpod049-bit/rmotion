"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// Photos des machines avec leurs dimensions naturelles (pour respecter leur format).
const IMAGES = [
  { src: "/gammes/cnc-1.jpg", w: 612, h: 390 },
  { src: "/gammes/laser-1.jpg", w: 368, h: 352 },
  { src: "/gammes/cnc-2.jpg", w: 351, h: 424 },
  { src: "/gammes/laser-2.jpg", w: 331, h: 367 },
  { src: "/gammes/cnc-3.jpg", w: 575, h: 537 },
  { src: "/gammes/laser-3.jpg", w: 307, h: 365 },
  { src: "/gammes/cnc-4.jpg", w: 555, h: 583 },
  { src: "/gammes/laser-4.jpg", w: 358, h: 370 },
  { src: "/gammes/cnc-5.jpg", w: 434, h: 511 },
];

const IMG_H = 300; // hauteur des photos (px) — LE réglage de taille
const GAP = 100; // écart entre deux photos (px)
const CLONES = 6; // photos dupliquées en fin de piste pour boucler sans couture (remplit les grands écrans)
const STEP_MS = 2200; // temps entre deux crans

// Largeur d'une photo à la hauteur IMG_H, en respectant son format naturel.
const widthOf = (im: { w: number; h: number }) => Math.round(IMG_H * (im.w / im.h));

export default function Hero() {
  const track = [...IMAGES, ...IMAGES.slice(0, CLONES)];

  // Décalage cumulé (en px) pour amener chaque photo en position — gère les largeurs variables.
  const offsets = track.map((_, i) =>
    track.slice(0, i).reduce((sum, im) => sum + widthOf(im) + GAP, 0)
  );

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Avance d'un cran à intervalle régulier, en continu.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearInterval(id);
  }, []);

  // Bouclage : une fois arrivé sur les clones, on revient au début sans animation.
  useEffect(() => {
    if (index === IMAGES.length) {
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
      {/* Fond blanc + photos (format naturel, taille réduite) qui défilent de droite à gauche */}
      <div className="absolute inset-0 flex items-center bg-white">
        <div
          className="flex"
          style={{
            transform: `translateX(-${offsets[index]}px)`,
            transition: animate ? "transform 800ms ease-in-out" : "none",
          }}
        >
          {track.map((im, i) => (
            <div
              key={i}
              className="shrink-0"
              style={{ width: widthOf(im), height: IMG_H, marginRight: GAP }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.src}
                alt=""
                aria-hidden
                className="h-full w-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filtre bleuté par-dessus les photos */}
      <div className="absolute inset-0 bg-[#0b2239]/55" />

      {/* Contenu */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 lg:py-28">
        <p className="text-sm uppercase tracking-widest text-gray-300 mb-4">Machines laser &amp; CNC</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6 max-w-2xl">
          Machines compétitives, pensées pour votre entreprise
        </h1>
        <p className="text-gray-200 text-lg mb-10 max-w-xl">
          Rmotion conçoit et distribue des machines laser et CNC fiables pour les PME et TPE. Pas de ligne de production — des équipements adaptés à votre échelle.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/machines" className="bg-white text-gray-900 px-6 py-3 rounded font-medium text-center hover:bg-gray-100 transition-colors">
            Voir le catalogue
          </Link>
          <Link href="/devis" className="border border-gray-300 text-white px-6 py-3 rounded text-center hover:border-white hover:bg-white/10 transition-colors">
            Demander un devis
          </Link>
        </div>
      </div>
    </section>
  );
}
