import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Category = { id: string; name: string; slug: string };
export type CategoryNode = Category & { show_in_nav: boolean; children: (Category & { show_in_nav: boolean })[] };

/** Kategori utama beserta sub-kategorinya (untuk navbar dropdown), sesuai urutan di admin. */
async function _getCategories(): Promise<CategoryNode[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, parent_id, show_in_nav")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  const utama = data.filter((c) => !c.parent_id);
  return utama.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    show_in_nav: c.show_in_nav,
    children: data
      .filter((s) => s.parent_id === c.id)
      .map((s) => ({ id: s.id, name: s.name, slug: s.slug, show_in_nav: s.show_in_nav })),
  }));
}

/** Cari kategori (utama atau sub) berdasarkan slug, beserta induknya bila ada. */
export async function getCategoryBySlug(slug: string) {
  const tree = await getCategories();
  for (const c of tree) {
    if (c.slug === slug) return { category: c, parent: null as CategoryNode | null };
    const sub = c.children.find((s) => s.slug === slug);
    if (sub) return { category: { ...sub, children: [] } as CategoryNode, parent: c };
  }
  return null;
}

// ---------- Produk ----------

export type Variant = {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string;
  price: number; // harga akhir (harga khusus varian atau harga dasar)
  stock: number;
};

export type ProductImage = { url: string; color_name: string | null };

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  /** Kategori produk; `parent` terisi bila produk ada di sub-kategori. */
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  minPrice: number;
  maxPrice: number;
  colors: { name: string; hex: string | null }[];
  image: string | null;
  inStock: boolean;
};

export type ProductDetail = ProductCard & {
  description: string | null;
  images: ProductImage[];
  variants: Variant[];
  sizes: string[];
};

const URUTAN_UKURAN = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL", "5XL"];
export function urutUkuran(a: string, b: string) {
  const ia = URUTAN_UKURAN.indexOf(a), ib = URUTAN_UKURAN.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, "id", { numeric: true });
}

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  categories: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  product_variants: { id: string; color_name: string; color_hex: string | null; size: string; price: number | null; stock: number; is_active: boolean }[];
  product_images: { url: string; color_name: string | null; sort_order: number }[];
};

const SELECT_PRODUK =
  "id, name, slug, description, base_price, categories(name, slug, parent:parent_id(name, slug)), product_variants(id, color_name, color_hex, size, price, stock, is_active), product_images(url, color_name, sort_order)";

function olah(p: RawProduct): ProductDetail {
  const variants: Variant[] = p.product_variants
    .filter((v) => v.is_active)
    .map((v) => ({ id: v.id, color_name: v.color_name, color_hex: v.color_hex, size: v.size, price: v.price ?? p.base_price, stock: v.stock }))
    .sort((a, b) => a.color_name.localeCompare(b.color_name, "id") || urutUkuran(a.size, b.size));
  const images = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order).map(({ url, color_name }) => ({ url, color_name }));
  const colors: ProductCard["colors"] = [];
  for (const v of variants) if (!colors.some((c) => c.name === v.color_name)) colors.push({ name: v.color_name, hex: v.color_hex });
  const prices = variants.length ? variants.map((v) => v.price) : [p.base_price];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.categories,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    colors,
    image: images[0]?.url ?? null,
    // Produk tanpa varian = stok tidak dicatat (katalog/pricelist), jadi tidak ditandai habis.
    inStock: variants.length === 0 || variants.some((v) => v.stock > 0),
    images,
    variants,
    sizes: [...new Set(variants.map((v) => v.size))].sort(urutUkuran),
  };
}

/** Semua produk yang tampil di toko, terbaru dulu. */
async function _getProducts(): Promise<ProductCard[]> {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT_PRODUK)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RawProduct[]).map(olah).map(
    ({ id, name, slug, category, minPrice, maxPrice, colors, image, inStock }) =>
      ({ id, name, slug, category, minPrice, maxPrice, colors, image, inStock }),
  );
}

async function _getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT_PRODUK)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? olah(data as unknown as RawProduct) : null;
}

export type Banner = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta2_label: string | null;
  cta2_url: string | null;
  image_url: string | null;
  image_mobile_url: string | null;
  text_color: "terang" | "gelap";
};

/** Banner aktif yang sedang dalam periode tayang. Di-cache beberapa menit. */
async function _getActiveBanners(): Promise<Banner[]> {
  const now = new Date().toISOString();
  const { data, error } = await createPublicClient()
    .from("banners")
    .select("id, eyebrow, title, subtitle, cta_label, cta_url, cta2_label, cta2_url, image_url, image_mobile_url, text_color")
    .eq("is_active", true)
    .or(`and(or(starts_at.is.null,starts_at.lte."${now}"),or(ends_at.is.null,ends_at.gt."${now}"))`)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data as Banner[];
}

// Dibungkus cache() React: data yang sama hanya diambil sekali per permintaan halaman.
export const getCategories = cache(_getCategories);
export const getProducts = cache(_getProducts);
export const getProductBySlug = cache(_getProductBySlug);
export const getActiveBanners = cache(_getActiveBanners);
