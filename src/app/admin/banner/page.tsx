/** Halaman admin boleh menunggu data login & database sebelum tampil. */
export const instant = false;

import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { SorotJudul } from "@/components/hero-slider";
import { aktifkanBanner, geserBanner } from "./actions";

export const metadata: Metadata = { title: "Banner — Admin DJSport" };

type Row = {
  id: string;
  eyebrow: string | null;
  title: string;
  image_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB";

/** Status tayang dihitung terhadap waktu permintaan ini (halaman admin selalu dirender per permintaan). */
function status(b: Row): { label: string; cls: string } {
  const now = new Date().getTime();
  if (!b.is_active) return { label: "Nonaktif", cls: "bg-gray-100 text-gray-500" };
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return { label: "Terjadwal", cls: "bg-blue-50 text-blue-700" };
  if (b.ends_at && new Date(b.ends_at).getTime() <= now) return { label: "Selesai", cls: "bg-gray-100 text-gray-500" };
  return { label: "Tayang", cls: "bg-green-50 text-green-700" };
}

export default async function AdminBannerPage({ searchParams }: PageProps<"/admin/banner">) {
  const { baru } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("banners")
    .select("id, eyebrow, title, image_url, is_active, starts_at, ends_at")
    .order("sort_order")
    .order("created_at");
  const banners = (data ?? []) as Row[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Banner</h1>
          <p className="text-sm text-muted">Banner yang tayang bergeser otomatis di halaman depan, sesuai urutan di bawah.</p>
        </div>
        <Link href="/admin/banner/baru" className="brand-gradient rounded-md px-4 py-2 text-sm font-semibold text-white">
          + Tambah banner
        </Link>
      </div>

      {baru && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Banner baru disimpan.</p>}

      {banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">Belum ada banner.</p>
          <p className="mt-1 text-sm text-muted">Halaman depan memakai banner bawaan DJSport sampai Anda menambahkan banner.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {banners.map((b, i) => {
            const s = status(b);
            return (
              <div key={b.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <div className="flex flex-col">
                  <form action={geserBanner.bind(null, b.id, -1)}>
                    <button disabled={i === 0} aria-label="Naikkan urutan" className="px-1 text-muted hover:text-brand-ink disabled:opacity-20">▲</button>
                  </form>
                  <form action={geserBanner.bind(null, b.id, 1)}>
                    <button disabled={i === banners.length - 1} aria-label="Turunkan urutan" className="px-1 text-muted hover:text-brand-ink disabled:opacity-20">▼</button>
                  </form>
                </div>
                <div
                  className="brand-gradient h-14 w-24 shrink-0 rounded bg-cover bg-center"
                  style={b.image_url ? { backgroundImage: `url(${b.image_url})` } : undefined}
                />
                <Link href={`/admin/banner/${b.id}`} className="min-w-0 flex-1 hover:text-brand-orange">
                  {b.eyebrow && <p className="truncate text-xs uppercase tracking-wider text-muted">{b.eyebrow}</p>}
                  <p className="truncate font-semibold"><SorotJudul text={b.title} /></p>
                  {(b.starts_at || b.ends_at) && (
                    <p className="truncate text-xs text-muted">
                      {b.starts_at ? fmt(b.starts_at) : "Sekarang"} → {b.ends_at ? fmt(b.ends_at) : "seterusnya"}
                    </p>
                  )}
                </Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                <form action={aktifkanBanner.bind(null, b.id, !b.is_active)}>
                  <button className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-ink">
                    {b.is_active ? "Matikan" : "Aktifkan"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
