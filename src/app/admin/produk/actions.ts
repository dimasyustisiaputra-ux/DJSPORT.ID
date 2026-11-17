"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { parseRupiah, requireAdmin, slugify } from "@/lib/admin";

export type ActionState = { error?: string; ok?: string };

function segarkan(productId?: string) {
  updateTag("catalog"); // katalog publik
  revalidatePath("/admin/produk");
  if (productId) revalidatePath(`/admin/produk/${productId}`);
}

// ---------- Produk ----------

export async function simpanProduk(productId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category_id = String(formData.get("category_id") ?? "") || null;
  const base_price = parseRupiah(formData.get("base_price"));
  const is_active = formData.get("is_active") === "on";
  let slug = slugify(String(formData.get("slug") ?? "") || name);

  if (!name) return { error: "Nama produk wajib diisi." };
  if (base_price === null) return { error: "Harga wajib diisi." };
  if (!slug) return { error: "Slug (alamat URL) tidak valid." };

  // Pastikan slug unik
  const { data: bentrok } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (bentrok && bentrok.id !== productId) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const data = { name, slug, description, category_id, base_price, is_active, updated_at: new Date().toISOString() };

  if (productId) {
    const { error } = await supabase.from("products").update(data).eq("id", productId);
    if (error) return { error: error.message };
    segarkan(productId);
    return { ok: "Perubahan disimpan." };
  }

  const { data: baru, error } = await supabase.from("products").insert(data).select("id").single();
  if (error) return { error: error.message };
  segarkan();
  redirect(`/admin/produk/${baru.id}?baru=1`);
}

export async function hapusProduk(productId: string) {
  const { supabase } = await requireAdmin();
  const { data: foto } = await supabase.from("product_images").select("url").eq("product_id", productId);
  const paths = (foto ?? []).map((f) => pathDariUrl(f.url)).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  await supabase.from("products").delete().eq("id", productId);
  segarkan();
  redirect("/admin/produk");
}

// ---------- Varian ----------

/** Buat kombinasi warna × ukuran sekaligus. Kombinasi yang sudah ada dilewati. */
export async function buatVarian(productId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  // Setiap baris: "Nama warna" atau "Nama warna #HEX"
  const warna = String(formData.get("colors") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const hex = l.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[0] ?? null;
      return { name: l.replace(hex ?? "", "").trim(), hex: hex?.toUpperCase() ?? null };
    })
    .filter((w) => w.name);
  const ukuran = String(formData.get("sizes") ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const stock = Number(formData.get("stock") || 0);

  if (!warna.length) return { error: "Isi minimal satu warna." };
  if (!ukuran.length) return { error: "Isi minimal satu ukuran." };
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stok awal harus angka 0 atau lebih." };

  const { data: produk } = await supabase.from("products").select("slug").eq("id", productId).single();
  const rows = warna.flatMap((w) =>
    ukuran.map((size) => ({
      product_id: productId,
      color_name: w.name,
      color_hex: w.hex,
      size,
      stock,
      sku: `${(produk?.slug ?? "djs").toUpperCase()}-${slugify(w.name).toUpperCase()}-${size}`.slice(0, 60),
    })),
  );

  const { data, error } = await supabase
    .from("product_variants")
    .upsert(rows, { onConflict: "product_id,color_name,size", ignoreDuplicates: true })
    .select("id");
  if (error) return { error: error.message };

  segarkan(productId);
  const dibuat = data?.length ?? 0;
  const dilewati = rows.length - dibuat;
  return { ok: `${dibuat} varian dibuat${dilewati ? `, ${dilewati} sudah ada (dilewati)` : ""}.` };
}

export async function simpanVarian(productId: string, variantId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") || 0)));
  await supabase
    .from("product_variants")
    .update({
      stock,
      price: parseRupiah(formData.get("price")),
      sku: String(formData.get("sku") ?? "").trim() || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", variantId);
  segarkan(productId);
}

export async function hapusVarian(productId: string, variantId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("product_variants").delete().eq("id", variantId);
  segarkan(productId);
}

// ---------- Foto ----------

function pathDariUrl(url: string) {
  const i = url.indexOf("/product-images/");
  return i === -1 ? null : decodeURIComponent(url.slice(i + "/product-images/".length));
}

/** Dipanggil setelah browser selesai mengunggah file ke Storage. */
export async function catatFoto(productId: string, foto: { url: string; color_name: string | null }[]) {
  const { supabase } = await requireAdmin();
  const { data: akhir } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mulai = (akhir?.sort_order ?? -1) + 1;
  const { error } = await supabase
    .from("product_images")
    .insert(foto.map((f, i) => ({ product_id: productId, url: f.url, color_name: f.color_name, sort_order: mulai + i })));
  if (error) return { error: error.message };
  segarkan(productId);
  return {};
}

export async function hapusFoto(productId: string, imageId: string) {
  const { supabase } = await requireAdmin();
  const { data: foto } = await supabase.from("product_images").select("url").eq("id", imageId).single();
  const path = foto ? pathDariUrl(foto.url) : null;
  if (path) await supabase.storage.from("product-images").remove([path]);
  await supabase.from("product_images").delete().eq("id", imageId);
  segarkan(productId);
}

export async function jadikanFotoUtama(productId: string, imageId: string) {
  const { supabase } = await requireAdmin();
  const { data: semua } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("sort_order");
  const urutan = [imageId, ...(semua ?? []).map((f) => f.id).filter((id) => id !== imageId)];
  await Promise.all(urutan.map((id, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", id)));
  segarkan(productId);
}
