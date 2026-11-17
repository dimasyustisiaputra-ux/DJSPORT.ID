
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { BannerForm, type BannerValues } from "@/components/admin/banner-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { hapusBanner } from "../actions";

export const metadata: Metadata = { title: "Ubah Banner — Admin DJSport" };

export default async function UbahBannerPage({ params }: PageProps<"/admin/banner/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("banners")
    .select("id, eyebrow, title, subtitle, cta_label, cta_url, cta2_label, cta2_url, image_url, image_mobile_url, text_color, is_active, starts_at, ends_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const { data: kategori } = await supabase.from("categories").select("name, slug").order("sort_order");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/banner" className="text-sm text-muted hover:text-brand-orange">← Semua banner</Link>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase">Ubah banner</h1>
      </div>
      <BannerForm banner={data as BannerValues} kategori={kategori ?? []} />
      <section className="rounded-xl border border-red-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase text-red-700">Hapus banner</h2>
        <p className="mb-3 mt-1 text-sm text-muted">Banner dan gambarnya dihapus permanen. Untuk menyembunyikan sementara, cukup hilangkan centang &ldquo;Aktif&rdquo;.</p>
        <form action={hapusBanner.bind(null, id)}>
          <ConfirmButton
            message="Hapus banner ini beserta gambarnya? Ini tidak bisa dibatalkan."
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Hapus banner ini
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
