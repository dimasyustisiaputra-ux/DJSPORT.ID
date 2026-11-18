
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { CategoryManager, type AdminCategory } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Kategori — Admin DJSport" };

export default async function AdminKategoriPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, show_in_nav, tampilan, products(count)")
    .order("sort_order")
    .order("name");

  const rows = (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    parent_id: c.parent_id as string | null,
    show_in_nav: c.show_in_nav as boolean,
    tampilan: c.tampilan as "grid" | "pricelist",
    produk: ((c.products as unknown as { count: number }[])?.[0]?.count ?? 0) as number,
  }));
  const tanpaInduk = (c: (typeof rows)[number]) => ({ id: c.id, name: c.name, slug: c.slug, show_in_nav: c.show_in_nav, tampilan: c.tampilan, produk: c.produk });
  const tree: AdminCategory[] = rows
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...tanpaInduk(c), children: rows.filter((s) => s.parent_id === c.id).map(tanpaInduk) }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase">Kategori</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Kategori utama tampil di navbar sesuai urutan di bawah. Sub-kategori tampil sebagai dropdown saat kategori utama disorot.
      </p>
      <CategoryManager tree={tree} />
    </div>
  );
}
