"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Category, ProductCard } from "@/lib/catalog";
import { rentangHarga } from "@/lib/format";
import { produkDiKategori } from "@/lib/category-match";

export function ProductGrid({
  products,
  categories,
  title = "Produk",
  emptyText,
}: {
  products: ProductCard[];
  /** Pilihan filter (kategori utama di beranda, sub-kategori di halaman kategori). */
  categories: Category[];
  title?: string;
  emptyText?: string;
}) {
  const [kategori, setKategori] = useState<string | null>(null);
  // Hanya tampilkan filter kategori yang punya produk
  const adaProduk = categories.filter((c) => products.some((p) => produkDiKategori(p, c.slug)));
  const tampil = kategori ? products.filter((p) => produkDiKategori(p, kategori)) : products;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-bold uppercase">{title}</h2>
        {adaProduk.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
            {[{ slug: null, name: "Semua" }, ...adaProduk].map((c) => (
              <button
                key={c.slug ?? "semua"}
                onClick={() => setKategori(c.slug)}
                aria-pressed={kategori === c.slug}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  kategori === c.slug ? "border-brand-ink bg-brand-ink text-white" : "border-line hover:border-brand-ink"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="font-display text-xl font-bold uppercase">Koleksi segera hadir</p>
          <p className="mt-1 text-sm text-muted">
            {emptyText ?? "Katalog produk DJSport sedang disiapkan. Silakan kembali lagi nanti."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {tampil.map((p, i) => (
            <Link key={p.id} href={`/produk/${p.slug}`} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-brand-paper">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={i < 4}
                  />
                ) : (
                  <div className="brand-gradient absolute inset-0">
                    <div className="brand-stripes absolute inset-0" />
                  </div>
                )}
                {p.category && (
                  <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold">{p.category.name}</span>
                )}
                {!p.inStock && (
                  <span className="absolute inset-x-0 bottom-0 bg-brand-ink/85 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
                    Stok habis
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold group-hover:text-brand-orange">{p.name}</h3>
              <p className="text-sm font-bold">{rentangHarga(p.minPrice, p.maxPrice)}</p>
              {p.colors.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  {p.colors.slice(0, 5).map((c) => (
                    <span
                      key={c.name}
                      title={c.name}
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ background: c.hex ?? "#e7e5e2" }}
                    />
                  ))}
                  {p.colors.length > 5 && <span className="text-xs text-muted">+{p.colors.length - 5}</span>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
