import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProducts } from "@/lib/catalog";
import { produkDiKategori } from "@/lib/category-match";
import { ProductGrid } from "@/components/product-grid";
import { PricelistCards } from "@/components/pricelist-cards";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hasil = await getCategoryBySlug(slug);
  if (!hasil) return { title: "Kategori tidak ditemukan — DJSport" };
  const nama = hasil.parent ? `${hasil.parent.name} ${hasil.category.name}` : hasil.category.name;
  return { title: `${hasil.category.name} — DJSport`, description: `Katalog dan harga ${nama} DJSport.` };
}

async function Isi({ params }: Pick<PageProps<"/kategori/[slug]">, "params">) {
  const { slug } = await params;
  const [hasil, semua] = await Promise.all([getCategoryBySlug(slug), getProducts()]);
  if (!hasil) notFound();
  const { category, parent } = hasil;
  const produk = semua.filter((p) => produkDiKategori(p, category.slug));
  const subs = category.children.filter((s) => s.show_in_nav);
  // Sub-kategori ikut tampilan induknya bila induknya berbentuk pricelist
  const pricelist = category.tampilan === "pricelist" || parent?.tampilan === "pricelist";
  const settings = pricelist ? await getSiteSettings() : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-brand-orange">Beranda</Link>
        {parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/kategori/${parent.slug}`} className="hover:text-brand-orange">{parent.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {!pricelist && subs.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {subs.map((s) => (
            <Link key={s.id} href={`/kategori/${s.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:border-brand-ink">
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* pricelist: jarak breadcrumb → banner sama dengan jarak header → breadcrumb */}
      <div className={pricelist ? "mt-3 md:mt-4" : "mt-8"}>
        {settings ? (
          <PricelistCards
            key={category.slug}
            products={produk}
            title={category.name}
            // sub-kategori tanpa banner sendiri memakai banner induknya
            banner={category.banner.desktop || category.banner.mobile || !parent ? category.banner : parent.banner}
            settings={settings}
            // tombol sub-kategori di bawah banner; di halaman sub-kategori tampil saudaranya dengan yang aktif ditandai
            subKategori={(parent ? parent.children : subs).filter((s) => s.show_in_nav).map(({ id, name, slug }) => ({ id, name, slug }))}
            aktif={category.slug}
          />
        ) : (
        <ProductGrid
          // key: reset filter saat pindah kategori
          key={category.slug}
          products={produk}
          categories={subs}
          title={category.name}
          emptyText={`Belum ada produk di kategori ${category.name}. Lihat kategori lain atau kembali lagi nanti.`}
        />
        )}
      </div>
    </>
  );
}

export default function KategoriPage({ params }: PageProps<"/kategori/[slug]">) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-3 md:pb-12 md:pt-4">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="h-4 w-40 animate-pulse rounded bg-brand-paper" />
              <div className="h-9 w-56 animate-pulse rounded bg-brand-paper" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-brand-paper" />
                ))}
              </div>
            </div>
          }
        >
          <Isi params={params} />
        </Suspense>
      </div>
    </main>
  );
}
