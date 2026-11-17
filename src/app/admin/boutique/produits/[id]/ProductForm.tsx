"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveProduct, type ProductInput, type VariantInput } from "../actions";

type Initial = {
  product: { id: number; category_id: number | null; name: string; slug: string; brand: string | null; description: string | null; specs: { label: string; value: string }[]; images: string[]; published: boolean };
  variants: (Omit<VariantInput, "attributes" | "label" | "iso_code" | "grade" | "material_groups" | "ean"> & {
    id: number; label: string | null; iso_code: string | null; grade: string | null; material_groups: string | null; ean: string | null;
    attributes: Record<string, string>; on_hand: number; reserved: number;
  })[];
  compatible: { id: number; name: string }[];
} | null;

const inp = "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none";
const lbl = "block text-xs font-medium text-gray-500 mb-1";

const emptyVariant = (): VariantInput & { on_hand?: number; reserved?: number } => ({
  sku: "", label: "", iso_code: "", grade: "", material_groups: "", attributes: [], pack_qty: 1,
  price_ht: 0, cost_price: null, weight_g: 0, ean: "", reorder_threshold: 0, active: true,
});

export default function ProductForm({ initial, categories, products }: {
  initial: Initial; categories: { id: number; name: string }[]; products: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [uploading, setUploading] = useState(false);
  const p = initial?.product;
  const [f, setF] = useState({
    category_id: p?.category_id ?? null as number | null, name: p?.name ?? "", slug: p?.slug ?? "",
    brand: p?.brand ?? "", description: p?.description ?? "", published: p?.published ?? false,
  });
  const [specs, setSpecs] = useState(p?.specs?.length ? p.specs : [{ label: "", value: "" }]);
  const [images, setImages] = useState<string[]>(p?.images ?? []);
  const [compat, setCompat] = useState<number[]>(initial?.compatible.map((c) => c.id) ?? []);
  const [variants, setVariants] = useState<(VariantInput & { on_hand?: number; reserved?: number })[]>(
    initial?.variants.length
      ? initial.variants.map((v) => ({
          ...v, label: v.label ?? "", iso_code: v.iso_code ?? "", grade: v.grade ?? "", material_groups: v.material_groups ?? "",
          ean: v.ean ?? "", attributes: Object.entries(v.attributes || {}).map(([key, value]) => ({ key, value })),
        }))
      : [emptyVariant()]
  );

  const setV = (i: number, patch: Partial<VariantInput>) =>
    setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setError("");
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await fetch("/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json.url) setImages((im) => [...im, json.url]);
        else setError(json.error || "Échec de l'upload.");
      } catch { setError("Échec de l'upload (réseau)."); }
    }
    setUploading(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaved("");
    const data: ProductInput = {
      id: p?.id, ...f, specs, images, compat_ids: compat,
      variants: variants.map((v) => { const copy = { ...v }; delete copy.on_hand; delete copy.reserved; return copy; }),
    };
    start(async () => {
      const r = await saveProduct(data);
      if (!r.ok) { setError(r.error || "Erreur"); return; }
      setSaved("Enregistré.");
      if (!p?.id) router.replace(`/admin/boutique/produits/${r.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2"><label className={lbl}>Nom du produit *</label>
          <input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Plaquette de tournage CNMG" required /></div>
        <div><label className={lbl}>Marque</label>
          <input className={inp} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
        <div><label className={lbl}>Catégorie</label>
          <select className={inp} value={f.category_id ?? ""} onChange={(e) => setF({ ...f, category_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— aucune —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {categories.length === 0 && <Link href="/admin/boutique/produits/categories" className="text-xs text-blue-700 underline">Créer des catégories</Link>}
        </div>
        <div><label className={lbl}>Slug (URL)</label>
          <input className={inp} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto depuis le nom" /></div>
        <label className="flex items-center gap-2 text-sm mt-5">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          Publié (visible dans la boutique une fois en ligne)
        </label>
        <div className="md:col-span-3"><label className={lbl}>Description</label>
          <textarea className={inp} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Caractéristiques communes</h2>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className={inp} placeholder="Libellé (ex. Forme)" value={s.label} onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <input className={inp} placeholder="Valeur (ex. Losange 80°)" value={s.value} onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
            <button type="button" className="text-red-600 text-sm px-2" onClick={() => setSpecs(specs.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="text-sm text-blue-700" onClick={() => setSpecs([...specs, { label: "", value: "" }])}>+ caractéristique</button>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Images</h2>
        <div className="flex flex-wrap gap-3 mb-2">
          {images.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded border object-contain bg-white" />
              <button type="button" className="absolute -top-2 -right-2 rounded-full bg-white border px-1 text-xs text-red-600" onClick={() => setImages(images.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => upload(e.target.files)} className="text-sm" />
        {uploading && <span className="text-xs text-gray-500 ml-2">Upload…</span>}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-1">Déclinaisons (références vendables)</h2>
        <p className="text-xs text-gray-500 mb-3">Une ligne = une référence en stock. Le prix HT s&apos;entend par unité de vente (ex. boîte de 10 → conditionnement 10). Groupes matière ISO : lettres P M K N S H. Le stock se gère dans l&apos;onglet Stock / Achats.</p>
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={v.id ?? `n${i}`} className={`rounded-lg border p-3 ${v.active ? "border-gray-200" : "border-dashed border-gray-300 opacity-70"}`}>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <div><label className={lbl}>Réf. (SKU) *</label><input className={inp} value={v.sku} onChange={(e) => setV(i, { sku: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={lbl}>Libellé</label><input className={inp} value={v.label} onChange={(e) => setV(i, { label: e.target.value })} placeholder="CNMG 120408-PM 4325" /></div>
                <div><label className={lbl}>Désignation ISO</label><input className={inp} value={v.iso_code} onChange={(e) => setV(i, { iso_code: e.target.value })} placeholder="CNMG 120408" /></div>
                <div><label className={lbl}>Nuance</label><input className={inp} value={v.grade} onChange={(e) => setV(i, { grade: e.target.value })} /></div>
                <div><label className={lbl}>Matières ISO</label><input className={inp} value={v.material_groups} onChange={(e) => setV(i, { material_groups: e.target.value.toUpperCase() })} placeholder="PMK" /></div>
                <div><label className={lbl}>Prix HT (€) *</label><input className={inp} type="number" step="0.01" min="0" value={v.price_ht} onChange={(e) => setV(i, { price_ht: Number(e.target.value) })} /></div>
                <div><label className={lbl}>Coût d&apos;achat HT</label><input className={inp} type="number" step="0.01" min="0" value={v.cost_price ?? ""} onChange={(e) => setV(i, { cost_price: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                <div><label className={lbl}>Conditionnement</label><input className={inp} type="number" min="1" value={v.pack_qty} onChange={(e) => setV(i, { pack_qty: Number(e.target.value) })} /></div>
                <div><label className={lbl}>Poids (g / unité de vente)</label><input className={inp} type="number" min="0" value={v.weight_g} onChange={(e) => setV(i, { weight_g: Number(e.target.value) })} /></div>
                <div><label className={lbl}>Seuil d&apos;alerte stock</label><input className={inp} type="number" min="0" value={v.reorder_threshold} onChange={(e) => setV(i, { reorder_threshold: Number(e.target.value) })} /></div>
                <div><label className={lbl}>EAN</label><input className={inp} value={v.ean} onChange={(e) => setV(i, { ean: e.target.value })} /></div>
              </div>
              <div className="mt-2">
                <span className={lbl}>Attributs (filtrables) — ex. Diamètre = 10 mm, Revêtement = TiAlN</span>
                {v.attributes.map((a, k) => (
                  <div key={k} className="flex gap-2 mb-1">
                    <input className={inp} value={a.key} placeholder="Attribut" onChange={(e) => setV(i, { attributes: v.attributes.map((x, j) => j === k ? { ...x, key: e.target.value } : x) })} />
                    <input className={inp} value={a.value} placeholder="Valeur" onChange={(e) => setV(i, { attributes: v.attributes.map((x, j) => j === k ? { ...x, value: e.target.value } : x) })} />
                    <button type="button" className="text-red-600 text-sm px-2" onClick={() => setV(i, { attributes: v.attributes.filter((_, j) => j !== k) })}>✕</button>
                  </div>
                ))}
                <button type="button" className="text-xs text-blue-700" onClick={() => setV(i, { attributes: [...v.attributes, { key: "", value: "" }] })}>+ attribut</button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={v.active} onChange={(e) => setV(i, { active: e.target.checked })} /> Active</label>
                {v.id && <span className="text-gray-500">Stock : {v.on_hand ?? 0} (réservé {v.reserved ?? 0})</span>}
                {v.price_ht > 0 && v.cost_price != null && v.cost_price > 0 && (
                  <span className="text-gray-500">Marge brute : {(((v.price_ht - v.cost_price) / v.price_ht) * 100).toFixed(0)} %</span>
                )}
                <button type="button" className="ml-auto text-red-600" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>Retirer</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4">
          <button type="button" className="text-sm text-blue-700" onClick={() => setVariants([...variants, emptyVariant()])}>+ déclinaison</button>
          {variants.length > 0 && (
            <button type="button" className="text-sm text-blue-700" onClick={() => {
              const last = variants[variants.length - 1];
              setVariants([...variants, { ...last, id: undefined, sku: "", on_hand: undefined, reserved: undefined, attributes: last.attributes.map((a) => ({ ...a })) }]);
            }}>+ dupliquer la dernière</button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Produits compatibles (porte-outils, plaquettes…)</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {compat.map((id) => {
            const pr = products.find((x) => x.id === id);
            return <span key={id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{pr?.name ?? `#${id}`} <button type="button" className="text-red-600" onClick={() => setCompat(compat.filter((c) => c !== id))}>✕</button></span>;
          })}
        </div>
        <select className={`${inp} max-w-md`} value="" onChange={(e) => e.target.value && setCompat([...compat, Number(e.target.value)])}>
          <option value="">+ ajouter une compatibilité…</option>
          {products.filter((x) => !compat.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </section>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{saved}</p>}
      <button type="submit" disabled={pending || uploading} className="rounded bg-gray-900 px-6 py-2.5 text-white hover:bg-gray-700 disabled:opacity-50">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
