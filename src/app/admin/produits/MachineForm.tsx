"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMachine } from "./actions";
import type { Spec, MachineInput } from "./types";
import { slugify } from "@/lib/slug";

type Category = { id: number; name: string; type: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MachineRow = any;

function toSpecs(raw: unknown): Spec[] {
  if (Array.isArray(raw)) return raw.map((s) => ({ label: String((s as Spec).label ?? ""), value: String((s as Spec).value ?? "") }));
  if (raw && typeof raw === "object") return Object.entries(raw as Record<string, unknown>).map(([label, value]) => ({ label, value: String(value) }));
  return [];
}

const input = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";
const label = "block text-sm font-medium text-gray-700 mb-1";
const section = "border-t border-gray-200 pt-6 mt-6";

export default function MachineForm({ categories, machine }: { categories: Category[]; machine: MachineRow | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState<string>(machine?.name ?? "");
  const [nameEn, setNameEn] = useState<string>(machine?.name_en ?? "");
  const [slug, setSlug] = useState<string>(machine?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState<boolean>(Boolean(machine?.slug));
  const [categoryId, setCategoryId] = useState<number>(machine?.category_id ?? categories[0]?.id ?? 0);
  const [tagline, setTagline] = useState<string>(machine?.tagline ?? "");
  const [taglineEn, setTaglineEn] = useState<string>(machine?.tagline_en ?? "");
  const [description, setDescription] = useState<string>(machine?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState<string>(machine?.description_en ?? "");
  const [priceRange, setPriceRange] = useState<string>(machine?.price_range ?? "");
  const [featured, setFeatured] = useState<boolean>(Boolean(machine?.featured));
  const [published, setPublished] = useState<boolean>(machine ? Boolean(machine.published) : true);
  const [specs, setSpecs] = useState<Spec[]>(toSpecs(machine?.specs));
  const [specsEn, setSpecsEn] = useState<Spec[]>(toSpecs(machine?.specs_en));
  const [options, setOptions] = useState<string[]>((machine?.options as string[]) ?? []);
  const [optionsEn, setOptionsEn] = useState<string[]>((machine?.options_en as string[]) ?? []);
  const [images, setImages] = useState<string[]>((machine?.images as string[]) ?? []);

  const onName = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json.url) added.push(json.url);
        else setError(json.error || "Échec de l'upload d'une image.");
      } catch {
        setError("Échec de l'upload (réseau).");
      }
    }
    if (added.length) setImages((prev) => [...prev, ...added]);
    setUploading(false);
  };

  const moveImage = (i: number, d: number) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Le nom est obligatoire.");
    if (!categoryId) return setError("La catégorie est obligatoire.");
    const data: MachineInput = {
      id: machine?.id ?? null,
      category_id: Number(categoryId),
      name, name_en: nameEn, slug: slug || slugify(name),
      tagline, tagline_en: taglineEn, description, description_en: descriptionEn,
      specs, specs_en: specsEn, options, options_en: optionsEn,
      price_range: priceRange, images, featured, published,
    };
    start(async () => {
      const res = await saveMachine(data);
      if (!res.ok) setError(res.error || "Échec.");
      else {
        router.push("/admin/produits");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-1">
      {/* Identité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Nom *</label>
          <input className={input} value={name} onChange={(e) => onName(e.target.value)} required />
        </div>
        <div>
          <label className={label}>Nom (EN)</label>
          <input className={input} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className={label}>Slug (URL)</label>
          <input className={input} value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true); }} />
          <p className="text-xs text-gray-400 mt-1">/products/{slug || "…"}</p>
        </div>
        <div>
          <label className={label}>Catégorie *</label>
          <select className={`${input} bg-white`} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className={label}>Accroche (tagline)</label>
          <input className={input} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div>
          <label className={label}>Accroche (EN)</label>
          <input className={input} value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} />
        </div>
      </div>

      {/* Prix & statut */}
      <div className={section}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className={label}>Prix de départ (€ HT)</label>
            <input className={input} value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="ex. 2099 (nombre seul)" inputMode="numeric" />
            <p className="text-xs text-gray-400 mt-1">Vide = pas de prix affiché.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publié (visible sur le site)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Mise en avant (accueil)
          </label>
        </div>
      </div>

      {/* Descriptions */}
      <div className={section}>
        <label className={label}>Description (FR)</label>
        <textarea className={input} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Séparez les paragraphes par une ligne vide." />
        <label className={`${label} mt-4`}>Description (EN)</label>
        <textarea className={input} rows={5} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
      </div>

      {/* Images */}
      <div className={section}>
        <label className={label}>Images (carrousel) — la 1ère sert de vignette</label>
        <input type="file" accept="image/*" multiple onChange={(e) => uploadFiles(e.target.files)} className="text-sm" disabled={uploading} />
        {uploading && <p className="text-xs text-gray-500 mt-1">Upload en cours…</p>}
        {images.length > 0 && (
          <div className="mt-3 space-y-2">
            {images.map((url, i) => (
              <div key={url + i} className="flex items-center gap-3 border border-gray-200 rounded p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-14 w-14 object-contain bg-gray-50 rounded shrink-0" />
                <span className="text-xs text-gray-500 truncate flex-1">{url}</span>
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="px-2 text-gray-500 hover:text-gray-900 disabled:opacity-30" title="Monter">↑</button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="px-2 text-gray-500 hover:text-gray-900 disabled:opacity-30" title="Descendre">↓</button>
                <button type="button" onClick={() => setImages((p) => p.filter((_, k) => k !== i))} className="px-2 text-red-600 hover:text-red-800" title="Retirer">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caractéristiques */}
      <div className={section}>
        <SpecEditor title="Caractéristiques (FR)" specs={specs} setSpecs={setSpecs} />
        <div className="mt-6">
          <SpecEditor title="Caractéristiques (EN)" specs={specsEn} setSpecs={setSpecsEn} />
        </div>
      </div>

      {/* Options */}
      <div className={section}>
        <StringListEditor title="Options (FR)" items={options} setItems={setOptions} />
        <div className="mt-6">
          <StringListEditor title="Options (EN)" items={optionsEn} setItems={setOptionsEn} />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm pt-4">{error}</p>}

      <div className="flex items-center gap-3 pt-6">
        <button type="submit" disabled={pending || uploading} className="bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50">
          {pending ? "Enregistrement…" : machine ? "Enregistrer les modifications" : "Créer la fiche"}
        </button>
        <button type="button" onClick={() => router.push("/admin/produits")} className="text-sm text-gray-500 hover:text-gray-900">Annuler</button>
      </div>
    </form>
  );
}

function SpecEditor({ title, specs, setSpecs }: { title: string; specs: Spec[]; setSpecs: (s: Spec[]) => void }) {
  const set = (i: number, k: "label" | "value", v: string) => setSpecs(specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-2">
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${input} flex-1`} placeholder="Libellé (ex. Puissance)" value={s.label} onChange={(e) => set(i, "label", e.target.value)} />
            <input className={`${input} flex-1`} placeholder="Valeur (ex. 50 W)" value={s.value} onChange={(e) => set(i, "value", e.target.value)} />
            <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="px-2 text-red-600 hover:text-red-800" title="Retirer">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setSpecs([...specs, { label: "", value: "" }])} className="mt-2 text-sm text-blue-600 hover:underline">+ Ajouter une caractéristique</button>
    </div>
  );
}

function StringListEditor({ title, items, setItems }: { title: string; items: string[]; setItems: (s: string[]) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${input} flex-1`} value={v} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="px-2 text-red-600 hover:text-red-800" title="Retirer">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems([...items, ""])} className="mt-2 text-sm text-blue-600 hover:underline">+ Ajouter une option</button>
    </div>
  );
}
