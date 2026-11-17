import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicAvailability, getPublishedProduct, MATERIAL_GROUPS } from "@/lib/shop/catalog";
import { eur } from "@/lib/shop/core";
import { getCurrentUser } from "@/lib/shop/auth";
import { netPrice } from "@/lib/shop/pricing";
import { addToCart } from "../../panier/actions";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getPublishedProduct(slug);
  if (!d) return {};
  return {
    title: d.product.name,
    description: (d.product.description || `${d.product.name} — ${d.variants.length} références en stock chez Rmotion.`).slice(0, 160),
    alternates: { canonical: `/outils/${slug}` },
  };
}

export default async function ToolProductPage({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const d = await getPublishedProduct(slug);
  if (!d) notFound();
  const { product: p, variants, compatible } = d;
  const [avail, user] = await Promise.all([getPublicAvailability(variants.map((v) => v.id)), getCurrentUser()]);
  const discount = user?.status === "approved" ? user.discount_pct : 0;
  const attrKeys = Array.from(new Set(variants.flatMap((v) => Object.keys(v.attributes || {}))));
  const added = variants.find((v) => String(v.id) === sp.ajoute);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/outils" className="hover:underline">Outils</Link>
        {p.category_slug && <> / <Link href={`/outils?cat=${p.category_slug}`} className="hover:underline">{p.category_name}</Link></>}
      </nav>
      {added && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {added.sku} ajouté au panier. <Link href="/panier" className="font-medium underline">Voir le panier</Link>
        </div>
      )}
      {sp.err && <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sp.err}</div>}

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] mb-10">
        <div className="relative aspect-square rounded-lg border border-gray-200 bg-white">
          {p.images[0] ? <Image src={p.images[0]} alt={p.name} fill sizes="(max-width:768px) 100vw, 400px" className="object-contain p-4" priority />
            : <div className="flex h-full items-center justify-center text-gray-300">Pas d&apos;image</div>}
        </div>
        <div>
          {p.brand && <div className="text-sm text-gray-500">{p.brand}</div>}
          <h1 className="text-3xl font-semibold mb-3">{p.name}</h1>
          {p.description && <p className="text-gray-700 whitespace-pre-line mb-4">{p.description}</p>}
          {p.specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {p.specs.map((s, i) => <div key={i} className="contents"><dt className="text-gray-500">{s.label}</dt><dd>{s.value}</dd></div>)}
            </dl>
          )}
          {discount > 0 && <p className="mt-4 text-sm text-green-700">Vos conditions : remise de {discount} % appliquée aux prix ci-dessous.</p>}
          {!user && <p className="mt-4 text-sm text-gray-500">Prix publics HT. <Link href="/compte/connexion" className="underline">Connectez-vous</Link> pour commander.</p>}
          {user && user.status !== "approved" && <p className="mt-4 text-sm text-amber-700">Votre compte est en cours de validation : vous pourrez commander dès son ouverture.</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Références disponibles</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Référence</th><th className="px-3 py-2">Désignation ISO</th><th className="px-3 py-2">Nuance</th>
              <th className="px-3 py-2">Matières</th>
              {attrKeys.map((k) => <th key={k} className="px-3 py-2">{k}</th>)}
              <th className="px-3 py-2">Cond.</th><th className="px-3 py-2">Prix HT</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map((v) => {
              const a = avail[v.id] ?? 0;
              const price = netPrice(v.price_ht, discount);
              return (
                <tr key={v.id}>
                  <td className="px-3 py-2"><div className="font-mono text-xs">{v.sku}</div><div className="text-xs text-gray-500">{v.label}</div></td>
                  <td className="px-3 py-2">{v.iso_code || "—"}</td>
                  <td className="px-3 py-2">{v.grade || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-0.5">{(v.material_groups || "").split("").filter(Boolean).map((g) => (
                      <span key={g} title={MATERIAL_GROUPS[g]?.label} className={`rounded px-1 text-[10px] font-bold text-white ${MATERIAL_GROUPS[g]?.color ?? "bg-gray-400"}`}>{g}</span>
                    ))}</div>
                  </td>
                  {attrKeys.map((k) => <td key={k} className="px-3 py-2">{v.attributes?.[k] ?? "—"}</td>)}
                  <td className="px-3 py-2">{v.pack_qty > 1 ? `boîte de ${v.pack_qty}` : "unité"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <strong>{eur(price)}</strong>
                    {discount > 0 && <div className="text-xs text-gray-400 line-through">{eur(v.price_ht)}</div>}
                    {v.pack_qty > 1 && <div className="text-xs text-gray-400">{eur(price / v.pack_qty)} / pièce</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {a > 0 ? <span className="text-green-700">● En stock{a <= 5 ? ` (${a})` : ""}</span> : <span className="text-gray-400">○ Rupture</span>}
                  </td>
                  <td className="px-3 py-2">
                    {a > 0 && (
                      <form action={addToCart} className="flex gap-1">
                        <input type="hidden" name="variant_id" value={v.id} />
                        <input type="hidden" name="back" value={`/outils/${p.slug}`} />
                        <input name="qty" type="number" min="1" max={a} defaultValue={1} className="w-16 rounded border border-gray-300 px-2 py-1" />
                        <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">Ajouter</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {compatible.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Produits compatibles</h2>
          <div className="flex flex-wrap gap-3">
            {compatible.map((c) => <Link key={c.id} href={`/outils/${c.slug}`} className="rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">{c.name}</Link>)}
          </div>
        </div>
      )}
    </div>
  );
}
