/** Halaman admin boleh menunggu data login & database sebelum tampil. */
export const instant = false;

import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { BannerForm } from "@/components/admin/banner-form";

export const metadata: Metadata = { title: "Tambah Banner — Admin DJSport" };

export default async function BannerBaruPage() {
  const { supabase } = await requireAdmin();
  const { data: kategori } = await supabase.from("categories").select("name, slug").order("sort_order");
  return (
    <div>
      <Link href="/admin/banner" className="text-sm text-muted hover:text-brand-orange">← Semua banner</Link>
      <h1 className="mb-6 mt-1 font-display text-3xl font-bold uppercase">Tambah banner</h1>
      <BannerForm kategori={kategori ?? []} />
    </div>
  );
}
