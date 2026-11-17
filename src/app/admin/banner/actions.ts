"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type BannerState = { error?: string; ok?: string };

function segarkan() {
  revalidatePath("/", "layout"); // segarkan seluruh halaman publik
  revalidatePath("/admin/banner");
}

/** "2026-12-01T08:00" (input datetime-local, waktu WIB) -> ISO UTC */
function wibKeIso(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function teks(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim() || null;
}

/** Hanya izinkan tautan di situs sendiri ("/...") atau https:// */
function tautan(formData: FormData, key: string) {
  const v = teks(formData, key);
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^https:\/\//i.test(v)) return v;
  return "INVALID";
}

export async function simpanBanner(bannerId: string | null, _prev: BannerState, formData: FormData): Promise<BannerState> {
  const { supabase } = await requireAdmin();

  const data = {
    eyebrow: teks(formData, "eyebrow"),
    title: teks(formData, "title"),
    subtitle: teks(formData, "subtitle"),
    cta_label: teks(formData, "cta_label"),
    cta_url: tautan(formData, "cta_url"),
    cta2_label: teks(formData, "cta2_label"),
    cta2_url: tautan(formData, "cta2_url"),
    image_url: teks(formData, "image_url"),
    image_mobile_url: teks(formData, "image_mobile_url"),
    text_color: formData.get("text_color") === "gelap" ? "gelap" : "terang",
    is_active: formData.get("is_active") === "on",
    starts_at: wibKeIso(formData.get("starts_at")),
    ends_at: wibKeIso(formData.get("ends_at")),
  };

  if (!data.title) return { error: "Judul banner wajib diisi." };
  if (data.cta_url === "INVALID" || data.cta2_url === "INVALID")
    return { error: "Tautan tombol harus diawali / (halaman di toko ini) atau https://." };
  if ((data.cta_label && !data.cta_url) || (!data.cta_label && data.cta_url))
    return { error: "Tombol utama butuh tulisan dan tautan sekaligus." };
  if ((data.cta2_label && !data.cta2_url) || (!data.cta2_label && data.cta2_url))
    return { error: "Tombol kedua butuh tulisan dan tautan sekaligus." };
  if (data.starts_at && data.ends_at && data.ends_at <= data.starts_at)
    return { error: "Tanggal selesai harus setelah tanggal mulai." };

  if (bannerId) {
    const { data: lama } = await supabase.from("banners").select("image_url, image_mobile_url").eq("id", bannerId).single();
    const { error } = await supabase.from("banners").update(data).eq("id", bannerId);
    if (error) return { error: error.message };
    // Gambar lama yang sudah diganti/dihapus ikut dibuang dari penyimpanan
    const usang = [lama?.image_url, lama?.image_mobile_url]
      .filter((u): u is string => Boolean(u) && u !== data.image_url && u !== data.image_mobile_url)
      .map(pathDariUrl)
      .filter(Boolean) as string[];
    if (usang.length) await supabase.storage.from("banners").remove(usang);
    segarkan();
    revalidatePath(`/admin/banner/${bannerId}`);
    return { ok: "Banner disimpan. Halaman depan akan diperbarui dalam beberapa detik." };
  }

  const { data: akhir } = await supabase.from("banners").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("banners").insert({ ...data, sort_order: (akhir?.sort_order ?? -1) + 1 });
  if (error) return { error: error.message };
  segarkan();
  redirect("/admin/banner?baru=1");
}

function pathDariUrl(url: string | null) {
  if (!url) return null;
  const i = url.indexOf("/banners/");
  return i === -1 ? null : decodeURIComponent(url.slice(i + "/banners/".length));
}

export async function hapusBanner(bannerId: string) {
  const { supabase } = await requireAdmin();
  const { data: b } = await supabase.from("banners").select("image_url, image_mobile_url").eq("id", bannerId).single();
  const paths = [pathDariUrl(b?.image_url ?? null), pathDariUrl(b?.image_mobile_url ?? null)].filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("banners").remove(paths);
  await supabase.from("banners").delete().eq("id", bannerId);
  segarkan();
  redirect("/admin/banner");
}

export async function aktifkanBanner(bannerId: string, aktif: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("banners").update({ is_active: aktif }).eq("id", bannerId);
  segarkan();
}

export async function geserBanner(bannerId: string, arah: -1 | 1) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("banners").select("id").order("sort_order").order("created_at");
  const ids = (data ?? []).map((b) => b.id);
  const i = ids.indexOf(bannerId);
  const j = i + arah;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((id, n) => supabase.from("banners").update({ sort_order: n }).eq("id", id)));
  segarkan();
}
