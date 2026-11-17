import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { SiteSettings } from "@/lib/whatsapp";

export type { SiteSettings } from "@/lib/whatsapp";

/** Pengaturan situs (nomor WhatsApp sales, dll.). Hanya untuk kode server. */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const { data } = await createPublicClient()
    .from("site_settings")
    .select("whatsapp_number, whatsapp_greeting")
    .eq("id", true)
    .maybeSingle();
  return {
    whatsappNumber: data?.whatsapp_number ?? null,
    whatsappGreeting: data?.whatsapp_greeting ?? "Halo DJSport, saya tertarik dengan produk berikut:",
  };
}
