/** Halaman admin boleh menunggu data login & database sebelum tampil. */
export const instant = false;

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, rupiah } from "@/lib/admin";

export const metadata: Metadata = { title: "Produk — Admin DJSport" };

type Row = {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  categories: { name: string } | null;
  product_variants: { stock: number; color_name: string }[];
  product_images: { url: string; sort_order: number }[];
};

export default async function AdminProdukPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("id, name, base_price, is_active, categories(name), product_variants(stock, color_name), product_images(url, sort_order)")
    .order("created_at", { ascending: false });
  const produk = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Produk</h1>
          <p className="text-sm text-muted">{produk.length} artikel</p>
        </div>
        <Link href="/admin/produk/baru" className="brand-gradient rounded-md px-4 py-2 text-sm font-semibold text-white">
          + Tambah produk
        </Link>
      </div>

      {produk.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">Belum ada produk.</p>
          <p className="mt-1 text-sm text-muted">Mulai dengan menambahkan artikel pertama Anda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {produk.map((p) => {
            const foto = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
            const stok = p.product_variants.reduce((n, v) => n + v.stock, 0);
            const warna = new Set(p.product_variants.map((v) => v.color_name)).size;
            return (
              <Link
                key={p.id}
                href={`/admin/produk/${p.id}`}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0 hover:bg-brand-paper"
              >
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-brand-paper">
                  {foto && <Image src={foto.url} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">
                    {p.categories?.name ?? "Tanpa kategori"} · {p.product_variants.length} varian · {warna} warna
                  </p>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  <p className="font-semibold">{rupiah(p.base_price)}</p>
                  <p className={stok === 0 ? "text-red-600" : "text-muted"}>Stok {stok}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.is_active ? "Tampil" : "Disembunyikan"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
