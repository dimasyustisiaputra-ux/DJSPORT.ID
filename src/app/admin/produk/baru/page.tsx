
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Tambah Produk — Admin DJSport" };

export default async function ProdukBaruPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name, parent_id").order("sort_order").order("name");

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold uppercase">Tambah produk</h1>
      <ol className="mb-6 mt-3 flex flex-wrap gap-2 text-sm">
        <li className="rounded-full bg-brand-ink px-3 py-1 font-semibold text-white">1. Info produk</li>
        <li className="rounded-full border border-line bg-white px-3 py-1 text-muted">2. Varian & stok</li>
        <li className="rounded-full border border-line bg-white px-3 py-1 text-muted">3. Foto</li>
      </ol>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
