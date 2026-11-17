import { notFound, redirect } from "next/navigation";
import { getMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Pastikan yang mengakses adalah admin. Dipakai di halaman & server action admin. */
export async function requireAdmin() {
  const member = await getMember();
  if (!member) redirect("/masuk?lanjut=/admin");
  if (member.role !== "admin") notFound();
  return { member, supabase: await createClient() };
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "Rp 189.000" / "189000" / "189.000" -> 189000 */
export function parseRupiah(value: FormDataEntryValue | null): number | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

export { rupiah } from "@/lib/format";
