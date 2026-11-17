/** Halaman admin boleh menunggu data login & database sebelum tampil. */
export const instant = false;

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Pengaturan — Admin DJSport" };

export default async function PengaturanPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("whatsapp_number, whatsapp_greeting").eq("id", true).maybeSingle();
  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase">Pengaturan</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Kontak tim sales yang dipakai di seluruh website.</p>
      <SettingsForm nomor={data?.whatsapp_number ?? null} greeting={data?.whatsapp_greeting ?? ""} />
    </div>
  );
}
