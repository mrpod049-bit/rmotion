// Modèles 3D interactifs (.glb) par fiche produit, servis depuis public/models/.
// Pour en ajouter un : déposer le fichier dans public/models/ et l'associer à son slug ici.
const MODELS_3D: Record<string, string> = {
  "bcl-series": "/models/bcl-series.glb",
};

export function getModel3d(slug: string): string | null {
  return MODELS_3D[slug] ?? null;
}
