"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { normalisasiNomorWa } from "@/lib/whatsapp";

export type PengaturanState = { error?: string; ok?: string };

export async function simpanPengaturan(_prev: PengaturanState, formData: FormData): Promise<PengaturanState> {
  const { supabase } = await requireAdmin();
  const mentah = String(formData.get("whatsapp_number") ?? "").trim();
  const greeting = String(formData.get("whatsapp_greeting") ?? "").trim();

  const nomor = mentah ? normalisasiNomorWa(mentah) : null;
  if (mentah && !nomor) return { error: "Nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890." };
  if (!greeting) return { error: "Kalimat pembuka pesan wajib diisi." };

  const { error } = await supabase
    .from("site_settings")
    .update({ whatsapp_number: nomor, whatsapp_greeting: greeting, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/", "layout"); // segarkan seluruh halaman publik
  revalidatePath("/admin/pengaturan");
  return { ok: nomor ? `Disimpan. Tombol WhatsApp akan mengarah ke +${nomor}.` : "Disimpan. Nomor kosong, jadi tombol WhatsApp disembunyikan." };
}
