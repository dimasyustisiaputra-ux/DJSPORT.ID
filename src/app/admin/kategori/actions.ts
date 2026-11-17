"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin, slugify } from "@/lib/admin";

export type KategoriState = { error?: string; ok?: string };

function segarkan() {
  updateTag("catalog"); // navbar, beranda, halaman kategori
  revalidatePath("/admin/kategori");
}

function pesanError(message: string) {
  if (message.includes("categories_slug_key") || message.includes("duplicate key")) return "Alamat URL (slug) itu sudah dipakai kategori lain.";
  if (message.includes("Sub-kategori tidak boleh")) return "Sub-kategori tidak bisa punya sub-kategori lagi (maksimal 2 tingkat).";
  if (message.includes("tidak bisa dijadikan sub-kategori")) return "Kategori ini punya sub-kategori, jadi tidak bisa dipindah menjadi sub-kategori.";
  return message;
}

export async function tambahKategori(parentId: string | null, _prev: KategoriState, formData: FormData): Promise<KategoriState> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama kategori wajib diisi." };
  const slug = slugify(name);
  if (!slug) return { error: "Nama kategori harus mengandung huruf atau angka." };

  let q = supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);
  const { data: akhir } = await q.maybeSingle();

  const { error } = await supabase
    .from("categories")
    .insert({ name, slug, parent_id: parentId, sort_order: (akhir?.sort_order ?? 0) + 1 });
  if (error) return { error: pesanError(error.message) };
  segarkan();
  return { ok: `"${name}" ditambahkan.` };
}

export async function simpanKategori(id: string, _prev: KategoriState, formData: FormData): Promise<KategoriState> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const show_in_nav = formData.get("show_in_nav") === "on";
  const parentRaw = formData.get("parent_id");
  if (!name) return { error: "Nama kategori wajib diisi." };
  if (!slug) return { error: "Alamat URL tidak valid." };

  const data: Record<string, unknown> = { name, slug, show_in_nav };
  if (parentRaw !== null) {
    const parent_id = String(parentRaw) || null;
    if (parent_id === id) return { error: "Kategori tidak bisa menjadi induk dirinya sendiri." };
    data.parent_id = parent_id;
  }

  const { error } = await supabase.from("categories").update(data).eq("id", id);
  if (error) return { error: pesanError(error.message) };
  segarkan();
  return { ok: "Disimpan." };
}

export async function hapusKategori(id: string) {
  const { supabase } = await requireAdmin();
  // Produk di kategori ini (dan sub-kategorinya) otomatis menjadi "tanpa kategori"; produknya tidak terhapus.
  await supabase.from("categories").delete().eq("id", id);
  segarkan();
}

/** Tukar urutan dengan kategori di atas/bawahnya (di tingkat yang sama). */
export async function geserKategori(id: string, arah: -1 | 1) {
  const { supabase } = await requireAdmin();
  const { data: ini } = await supabase.from("categories").select("parent_id").eq("id", id).single();
  if (!ini) return;
  let q = supabase.from("categories").select("id").order("sort_order").order("name");
  q = ini.parent_id ? q.eq("parent_id", ini.parent_id) : q.is("parent_id", null);
  const { data } = await q;
  const ids = (data ?? []).map((c) => c.id);
  const i = ids.indexOf(id);
  const j = i + arah;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((cid, n) => supabase.from("categories").update({ sort_order: n + 1 }).eq("id", cid)));
  segarkan();
}
