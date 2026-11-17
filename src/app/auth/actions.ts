"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; info?: string; values?: Record<string, string> };

function terjemahkan(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk email Anda dan klik tautan konfirmasi.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("password should be")) return "Kata sandi minimal 8 karakter.";
  if (m.includes("rate limit")) return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  if (m.includes("invalid") && m.includes("email")) return "Alamat email tidak valid.";
  return "Terjadi kesalahan: " + message;
}

/** Hanya izinkan pengalihan ke halaman di situs ini sendiri. */
function amankanTujuan(lanjut: FormDataEntryValue | null): string {
  const s = typeof lanjut === "string" ? lanjut : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

// Pendaftaran publik ditutup: website berfungsi sebagai katalog & pricelist.
// Akun admin baru dibuat dari dashboard Supabase (Authentication → Users → Add user).

export async function masuk(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const lanjut = amankanTujuan(formData.get("lanjut"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: terjemahkan(error.message), values: { email } };
  redirect(lanjut === "/" ? "/admin" : lanjut);
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
