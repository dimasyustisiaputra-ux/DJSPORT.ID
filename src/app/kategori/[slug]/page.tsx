import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/catalog";
import { produkDiKategori } from "@/lib/category-match";
import { ProductGrid } from "@/components/product-grid";

export async function generateStaticParams() {
  const tree = await getCategories();
  const slugs = tree.flatMap((c) => [c.slug, ...c.children.map((s) => s.slug)]);
  // Cache Components butuh minimal satu parameter; slug ini akan menghasilkan 404.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "belum-ada-kategori" }];
}

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

      {subs.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {subs.map((s) => (
            <Link key={s.id} href={`/kategori/${s.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:border-brand-ink">
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <ProductGrid
          // key: reset filter saat pindah kategori
          key={category.slug}
          products={produk}
          categories={subs}
          title={category.name}
          emptyText={`Belum ada produk di kategori ${category.name}. Lihat kategori lain atau kembali lagi nanti.`}
        />
      </div>
    </>
  );
}

export default function KategoriPage({ params }: PageProps<"/kategori/[slug]">) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
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
