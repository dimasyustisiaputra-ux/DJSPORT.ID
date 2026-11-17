import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog";
import { ProductView } from "@/components/product-view";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produk tidak ditemukan — DJSport" };
  return {
    title: `${p.name} — DJSport`,
    description: p.description?.slice(0, 160) ?? `Harga dan detail ${p.name} di DJSport.`,
    openGraph: p.image ? { images: [p.image] } : undefined,
  };
}

async function Detail({ params }: Pick<PageProps<"/produk/[slug]">, "params">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSiteSettings()]);
  if (!product) notFound();
  return <ProductView product={product} settings={settings} />;
}

export default function ProdukPage({ params }: PageProps<"/produk/[slug]">) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <Link href="/#produk" className="text-sm text-muted hover:text-brand-orange">← Semua produk</Link>
        <div className="mt-4">
          <Suspense
            fallback={
              <div className="grid gap-8 md:grid-cols-2">
                <div className="aspect-[4/5] animate-pulse rounded-xl bg-brand-paper" />
                <div className="space-y-3">
                  <div className="h-10 w-3/4 animate-pulse rounded bg-brand-paper" />
                  <div className="h-8 w-1/3 animate-pulse rounded bg-brand-paper" />
                </div>
              </div>
            }
          >
            <Detail params={params} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
