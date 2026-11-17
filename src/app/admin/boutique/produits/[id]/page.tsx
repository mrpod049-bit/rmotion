import { notFound } from "next/navigation";
import { adminGetProduct, adminAllProductsLite, getCategories } from "@/lib/shop/catalog";
import { LinkBtn, Title } from "../../_ui";
import ProductForm from "./ProductForm";

export default async function ShopProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const data = isNew ? null : await adminGetProduct(Number(id));
  if (!isNew && !data) notFound();
  const [categories, all] = await Promise.all([getCategories(), adminAllProductsLite()]);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title action={<LinkBtn light href="/admin/boutique/produits">← Catalogue</LinkBtn>}>
        {isNew ? "Nouveau produit" : data!.product.name}
      </Title>
      <ProductForm
        initial={data}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        products={all.filter((p) => p.id !== data?.product.id)}
      />
    </div>
  );
}
