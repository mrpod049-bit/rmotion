import Link from "next/link";

export type Crumb = { label: string; href?: string };

// Fil d'ariane visible (le JSON-LD BreadcrumbList est géré séparément par les pages).
// Le dernier élément représente la page courante et n'est pas cliquable.
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-gray-900 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "text-gray-700" : undefined} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden className="text-gray-300">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
