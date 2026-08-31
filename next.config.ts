import type { NextConfig } from "next";

// Table de correspondance ancien slug -> nouveau slug (renommage produits).
const SLUG_MAP: Record<string, string> = {
  "laser-ouvert-30-100w": "ol-series",
  "laser-ferme-60-100w": "bcl-series",
  "laser-ferme-20-30w": "scl-series",
  "centre-usinage-vmc540t": "mcs-series",
  "ms-series-router": "mr-series",
  "centre-usinage-xh7115": "scs-series",
};

const nextConfig: NextConfig = {
  // Le logo est servi en qualité 100 ; Next 16 impose de déclarer les qualités utilisées.
  images: { qualities: [75, 100] },
  async redirects() {
    const perSlug = Object.entries(SLUG_MAP).flatMap(([oldSlug, newSlug]) => [
      { source: `/machines/${oldSlug}`, destination: `/products/${newSlug}`, permanent: true },
      { source: `/en/machines/${oldSlug}`, destination: `/en/products/${newSlug}`, permanent: true },
    ]);

    return [
      // Redirections spécifiques par produit (ancien slug -> nouveau slug).
      ...perSlug,
      // Catalogue et tout autre slug non listé : /machines/* -> /products/* (slug conservé).
      { source: "/machines", destination: "/products", permanent: true },
      { source: "/en/machines", destination: "/en/products", permanent: true },
      { source: "/machines/:slug", destination: "/products/:slug", permanent: true },
      { source: "/en/machines/:slug", destination: "/en/products/:slug", permanent: true },
      // Articles renommés (ancien slug -> nouveau slug).
      { source: "/articles/roi-machine-laser", destination: "/articles/cas-du-roi", permanent: true },
      { source: "/en/articles/roi-machine-laser", destination: "/en/articles/cas-du-roi", permanent: true },
    ];
  },
};

export default nextConfig;
