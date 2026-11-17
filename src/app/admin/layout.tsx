/** Halaman admin boleh menunggu data login & database sebelum tampil. */
export const instant = false;

import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="flex-1 bg-brand-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-brand-orange">Admin</p>
          <nav className="flex gap-2 text-sm font-medium md:flex-col">
            <Link href="/admin/produk" className="rounded-md px-3 py-2 hover:bg-white">Produk</Link>
            <Link href="/admin/produk/baru" className="rounded-md px-3 py-2 hover:bg-white">+ Tambah produk</Link>
            <Link href="/admin/kategori" className="rounded-md px-3 py-2 hover:bg-white">Kategori</Link>
            <Link href="/admin/banner" className="rounded-md px-3 py-2 hover:bg-white">Banner</Link>
            <Link href="/admin/pengaturan" className="rounded-md px-3 py-2 hover:bg-white">Pengaturan</Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
