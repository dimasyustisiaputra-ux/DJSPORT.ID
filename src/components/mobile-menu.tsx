"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CategoryNode } from "@/lib/catalog";

export function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  // Menu dianggap terbuka hanya di halaman tempat ia dibuka, jadi otomatis tertutup saat pindah halaman
  const [bukaDi, setBukaDi] = useState<string | null>(null);
  const buka = bukaDi === pathname;
  const setBuka = (v: boolean) => setBukaDi(v ? pathname : null);
  const [terbuka, setTerbuka] = useState<string | null>(null);

  // Kunci scroll halaman saat menu terbuka
  useEffect(() => {
    document.body.style.overflow = buka ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [buka]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setBuka(true)}
        aria-label="Buka menu kategori"
        aria-expanded={buka}
        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-brand-paper"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Dirender langsung di <body>: header memakai backdrop-blur, yang membuat panel "fixed" terkurung di dalam header */}
      {buka && createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu kategori">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBuka(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="font-display text-sm font-bold uppercase tracking-widest text-brand-orange">Kategori</span>
              <button onClick={() => setBuka(false)} aria-label="Tutup menu" className="h-10 w-10 text-2xl leading-none">×</button>
            </div>
            <Link href="/#produk" className="border-b border-line px-4 py-3 font-semibold">Semua Produk</Link>
            {categories.map((c) => {
              const subs = c.children.filter((s) => s.show_in_nav);
              return (
                <div key={c.id} className="border-b border-line">
                  <div className="flex items-center">
                    <Link href={`/kategori/${c.slug}`} className="flex-1 px-4 py-3 font-semibold">{c.name}</Link>
                    {subs.length > 0 && (
                      <button
                        onClick={() => setTerbuka(terbuka === c.id ? null : c.id)}
                        aria-expanded={terbuka === c.id}
                        aria-label={`Sub-kategori ${c.name}`}
                        className="px-4 py-3 text-muted"
                      >
                        <span className={`inline-block transition-transform ${terbuka === c.id ? "rotate-180" : ""}`}>▾</span>
                      </button>
                    )}
                  </div>
                  {terbuka === c.id && (
                    <div className="bg-brand-paper pb-2">
                      {subs.map((s) => (
                        <Link key={s.id} href={`/kategori/${s.slug}`} className="block px-8 py-2 text-sm">{s.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>,
        document.body,
      )}
    </div>
  );
}
