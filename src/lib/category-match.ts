import type { ProductCard } from "@/lib/catalog";

/** Produk termasuk kategori `slug` bila ada langsung di kategori itu atau di salah satu sub-kategorinya. */
export function produkDiKategori(p: ProductCard, slug: string) {
  return p.category?.slug === slug || p.category?.parent?.slug === slug;
}
