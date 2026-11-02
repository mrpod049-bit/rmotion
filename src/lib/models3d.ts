// Modèles 3D interactifs (.glb) par fiche produit, servis depuis public/models/.
// Pour en ajouter un : déposer le fichier dans public/models/ et l'associer à son slug ici.
// cameraOrbit (facultatif) : angle de départ, si la face avant du modèle n'est pas vers la caméra.
export type Model3d = { src: string; cameraOrbit?: string };

const MODELS_3D: Record<string, Model3d> = {
  "bcl-series": { src: "/models/bcl-series.glb" },
  "mcs-atc": { src: "/models/mcs-atc.glb", cameraOrbit: "180deg 75deg auto" },
  "ol-series": { src: "/models/ol-series.glb", cameraOrbit: "-30deg 75deg auto" },
  "new-slc-series": { src: "/models/new-slc-series.glb" },
};

export function getModel3d(slug: string): Model3d | null {
  return MODELS_3D[slug] ?? null;
}
