import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCategories, listPublishedProducts, MATERIAL_GROUPS } from "@/lib/shop/catalog";
import { eur } from "@/lib/shop/core";
import { getCurrentUser } from "@/lib/shop/auth";
import { netPrice } from "@/lib/shop/pricing";

export const metadata: Metadata = {
  title: "Outils de coupe — plaquettes, fraises, forets",
  description: "Boutique professionnelle Rmotion : plaquettes carbure, fraises, forets et porte-outils. Prix HT, stock en temps réel, livraison rapide.",
  alternates: { canonical: "/outils" },
};

type SP = Promise<Record<string, string | undefined>>;

export default async function ToolsCatalog({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cat = sp.cat || null;
  const q = (sp.q || "").trim().slice(0, 80) || null;
  const mat = sp.mat || null;
  const [categories, products, user] = await Promise.all([
    getCategories(), listPublishedProducts(cat, q, mat), getCurrentUser(),
  ]);
  const roots = categories.filter((c) => !c.parent_id);
  const current = categories.find((c) => c.slug === cat);
  const discount = user?.status === "approved" ? user.discount_pct : 0;
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { cat, q, mat, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/outils?${s}` : "/outils";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6 text-sm">
        <div>
          <h2 className="mb-2 font-semibold">Catégories</h2>
          <ul className="space-y-1">
            <li><Link href={qs({ cat: null })} className={!cat ? "font-semibold" : "text-gray-600 hover:underline"}>Tout le catalogue</Link></li>
            {roots.map((r) => (
              <li key={r.id}>
                <Link href={qs({ cat: r.slug })} className={cat === r.slug ? "font-semibold" : "text-gray-600 hover:underline"}>{r.name}</Link>
                <ul className="ml-3 mt-1 space-y-1">
                  {categories.filter((c) => c.parent_id === r.id).map((c) => (
                    <li key={c.id}><Link href={qs({ cat: c.slug })} className={cat === c.slug ? "font-semibold" : "text-gray-500 hover:underline"}>{c.name}</Link></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">Matière usinée (ISO)</h2>
          <div className="flex flex-wrap gap-1">
            {Object.entries(MATERIAL_GROUPS).map(([k, m]) => (
              <Link key={k} href={qs({ mat: mat === k ? null : k })} title={m.label}
                className={`rounded px-2 py-1 text-xs font-bold text-white ${m.color} ${mat && mat !== k ? "opacity-30" : ""}`}>{k}</Link>
            ))}
          </div>
          {mat && <p className="mt-1 text-xs text-gray-500">{MATERIAL_GROUPS[mat]?.label}</p>}
        </div>
        {!user && (
          <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
            Boutique réservée aux professionnels. <Link href="/compte/inscription" className="underline">Ouvrir un compte</Link> pour commander et bénéficier de vos conditions.
          </div>
        )}
      </aside>

      <section>
        <h1 className="text-2xl font-semibold mb-1">{current?.name ?? "Outils de coupe"}</h1>
        {current?.description && <p className="text-gray-500 mb-4">{current.description}</p>}
        {q && <p className="text-sm text-gray-500 mb-4">Résultats pour « {q} » — <Link className="underline" href={qs({ q: null })}>effacer</Link></p>}
        {products.length === 0 ? (
          <p className="text-gray-500">Aucun produit ne correspond.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} href={`/outils/${p.slug}`} className="group rounded-lg border border-gray-200 p-4 hover:shadow-sm">
                <div className="relative mb-3 aspect-square bg-white">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill sizes="(max-width:768px) 100vw, 300px" className="object-contain" />
                  ) : <div className="flex h-full items-center justify-center text-xs text-gray-300">Pas d&apos;image</div>}
                </div>
                <div className="text-xs text-gray-400">{p.brand}</div>
                <div className="font-medium group-hover:underline">{p.name}</div>
                <div className="mt-1 text-sm">
                  {p.min_price != null && <>dès <strong>{eur(netPrice(p.min_price, discount))}</strong> HT</>}
                  <span className="text-gray-400"> · {p.variant_count} réf.</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
