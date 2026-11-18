import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getKonvexaProduk, type KonvexaProduk } from "@/lib/konvexa";
import { STOK_SESUAI_PESANAN, stokVarianKonvexa, varianDariKonvexa } from "@/lib/konvexa-cocok";

export type Category = { id: string; name: string; slug: string };
/** "grid" = kartu produk biasa, "pricelist" = daftar harga berbentuk kartu (mis. Custom Jersey) */
export type TampilanKategori = "grid" | "pricelist";
export type CategoryNode = Category & {
  show_in_nav: boolean;
  tampilan: TampilanKategori;
  banner: { desktop: string | null; mobile: string | null };
  children: (Category & { show_in_nav: boolean; tampilan: TampilanKategori; banner: { desktop: string | null; mobile: string | null } })[];
};

/** Kategori utama beserta sub-kategorinya (untuk navbar dropdown), sesuai urutan di admin. */
async function _getCategories(): Promise<CategoryNode[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, parent_id, show_in_nav, tampilan, banner_url, banner_mobile_url")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  const utama = data.filter((c) => !c.parent_id);
  return utama.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    show_in_nav: c.show_in_nav,
    tampilan: c.tampilan as TampilanKategori,
    banner: { desktop: c.banner_url, mobile: c.banner_mobile_url },
    children: data
      .filter((s) => s.parent_id === c.id)
      .map((s) => ({ id: s.id, name: s.name, slug: s.slug, show_in_nav: s.show_in_nav, tampilan: s.tampilan as TampilanKategori, banner: { desktop: s.banner_url, mobile: s.banner_mobile_url } })),
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
  /** ID varian di database, atau "k:<productId>:<ukuran>" untuk ukuran yang diambil langsung dari KONVEXA */
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string;
  price: number; // harga akhir (harga Konvexa bila ditautkan, selain itu harga khusus varian atau harga dasar)
  stock: number;
  /** ID produk KONVEXA yang ditautkan (null = tidak ditautkan) */
  konvexaId: string | null;
  /** bisa dipesan lewat keranjang (ditautkan ke Konvexa, data Konvexa tersedia, dan variasinya dikenal Konvexa) */
  dipesan: boolean;
  /** label variasi di KONVEXA yang dikirim saat memesan ("" = tanpa variasi) */
  kxLabel: string | null;
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
  /** Untuk tampilan pricelist: harga coret, label (mis. "BEST VALUE"), satuan harga, dan poin dari deskripsi */
  hargaCoret: number | null;
  label: string | null;
  satuan: string | null;
  poin: string[];
};

export type ProductDetail = ProductCard & {
  description: string | null;
  images: ProductImage[];
  variants: Variant[];
  sizes: string[];
  /** ada varian yang bisa dipesan lewat keranjang (terhubung ke KONVEXA) */
  bisaDipesan: boolean;
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
  harga_coret: number | null;
  label: string | null;
  satuan: string | null;
  categories: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  konvexa_produk_id: string | null;
  product_variants: {
    id: string;
    color_name: string;
    color_hex: string | null;
    size: string;
    price: number | null;
    stock: number;
    is_active: boolean;
    konvexa_produk_id: string | null;
  }[];
  product_images: { url: string; color_name: string | null; sort_order: number }[];
};

const SELECT_PRODUK =
  "id, name, slug, description, base_price, harga_coret, label, satuan, konvexa_produk_id, categories(name, slug, parent:parent_id(name, slug)), product_variants(id, color_name, color_hex, size, price, stock, is_active, konvexa_produk_id), product_images(url, color_name, sort_order)";

type PetaKonvexa = Map<string, KonvexaProduk> | null;

function adaTautan(p: RawProduct) {
  return Boolean(p.konvexa_produk_id) || p.product_variants.some((v) => v.konvexa_produk_id);
}

async function petaKonvexa(list: RawProduct[], segar = false): Promise<PetaKonvexa> {
  if (!list.some(adaTautan)) return null;
  const data = await getKonvexaProduk({ segar });
  return data ? new Map(data.produk.map((x) => [x.id, x])) : null;
}

/** Baris-baris deskripsi menjadi poin singkat (tanda "-", "•", "+" di awal baris dibuang). */
function poinDeskripsi(d: string | null) {
  return (d ?? "")
    .split(/\r?\n/)
    .map((b) => b.replace(/^\s*[-•+*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function olah(p: RawProduct, kx: PetaKonvexa = null): ProductDetail {
  let variants: Variant[] = p.product_variants
    .filter((v) => v.is_active)
    .map((v) => {
      const kp = v.konvexa_produk_id && kx ? kx.get(v.konvexa_produk_id) : undefined;
      const k = kp ? stokVarianKonvexa(kp, v.color_name, v.size) : null;
      return {
        id: v.id,
        color_name: v.color_name,
        color_hex: v.color_hex,
        size: v.size,
        price: k ? k.harga : v.price ?? p.base_price,
        stock: k ? k.qty : v.stock,
        konvexaId: v.konvexa_produk_id,
        dipesan: Boolean(k && k.label !== null),
        kxLabel: k ? k.label : null,
      };
    });
  // Produk tanpa varian tetapi ditautkan ke Konvexa: warna/ukuran & stok diambil langsung dari variasi Konvexa
  const kpProduk = !variants.length && p.konvexa_produk_id && kx ? kx.get(p.konvexa_produk_id) : undefined;
  if (kpProduk) {
    const dariKx = varianDariKonvexa(kpProduk);
    variants = dariKx.length
      ? dariKx.map(({ warna, ukuran, v }) => ({
          id: `k:${p.id}:${v.label}`,
          color_name: warna,
          color_hex: null,
          size: ukuran,
          price: v.harga || kpProduk.harga,
          stock: kpProduk.stokDihitung ? v.qty : STOK_SESUAI_PESANAN,
          konvexaId: kpProduk.id,
          dipesan: true,
          kxLabel: v.label,
        }))
      : [
          {
            id: `k:${p.id}:`,
            color_name: "",
            color_hex: null,
            size: "",
            price: kpProduk.harga,
            stock: kpProduk.stokDihitung ? kpProduk.stok ?? 0 : STOK_SESUAI_PESANAN,
            konvexaId: kpProduk.id,
            dipesan: true,
            kxLabel: "",
          },
        ];
  }
  variants.sort((a, b) => a.color_name.localeCompare(b.color_name, "id") || urutUkuran(a.size, b.size));
  const images = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order).map(({ url, color_name }) => ({ url, color_name }));
  const colors: ProductCard["colors"] = [];
  for (const v of variants) if (v.color_name && !colors.some((c) => c.name === v.color_name)) colors.push({ name: v.color_name, hex: v.color_hex });
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
    hargaCoret: p.harga_coret,
    label: p.label,
    satuan: p.satuan,
    poin: poinDeskripsi(p.description),
    images,
    variants,
    sizes: [...new Set(variants.map((v) => v.size).filter(Boolean))].sort(urutUkuran),
    bisaDipesan: variants.some((v) => v.dipesan),
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
  const list = data as unknown as RawProduct[];
  const kx = await petaKonvexa(list);
  return list.map((p) => olah(p, kx)).map(
    ({ id, name, slug, category, minPrice, maxPrice, colors, image, inStock, hargaCoret, label, satuan, poin }) =>
      ({ id, name, slug, category, minPrice, maxPrice, colors, image, inStock, hargaCoret, label, satuan, poin }),
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
  if (!data) return null;
  const p = data as unknown as RawProduct;
  return olah(p, await petaKonvexa([p]));
}

/** Produk untuk diproses saat pesanan dikirim: stok Konvexa selalu diambil ulang (tidak dari cache). */
export async function getProductsForOrder(ids: string[]): Promise<ProductDetail[]> {
  if (!ids.length) return [];
  const { data, error } = await createPublicClient().from("products").select(SELECT_PRODUK).in("id", ids).eq("is_active", true);
  if (error) throw error;
  const list = data as unknown as RawProduct[];
  const kx = await petaKonvexa(list, true);
  return list.map((p) => olah(p, kx));
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
