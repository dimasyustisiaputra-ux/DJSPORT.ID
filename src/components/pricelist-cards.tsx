"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductCard } from "@/lib/catalog";
import { rupiah } from "@/lib/format";
import { linkWhatsApp, type SiteSettings } from "@/lib/whatsapp";

/**
 * Tampilan "pricelist": produk sebagai kartu paket yang bisa dipilih, lalu dipesan lewat WhatsApp.
 * Dipakai untuk kategori dengan tampilan "pricelist" (mis. Custom Jersey) yang hanya dijual lewat sales.
 */
export function PricelistCards({
  products,
  title,
  settings,
}: {
  products: ProductCard[];
  title: string;
  settings: SiteSettings;
}) {
  const [pilih, setPilih] = useState(products[0]?.id ?? null);
  const terpilih = products.find((p) => p.id === pilih) ?? null;

  function bukaWhatsApp() {
    if (!settings.whatsappNumber || !terpilih) return;
    const pesan = [
      settings.whatsappGreeting,
      "",
      `*${terpilih.name}*`,
      `Harga: ${terpilih.minPrice !== terpilih.maxPrice ? "mulai " : ""}${rupiah(terpilih.minPrice)}${terpilih.satuan ? ` ${terpilih.satuan}` : ""}`,
      "",
      window.location.origin + `/produk/${terpilih.slug}`,
    ].join("\n");
    window.open(linkWhatsApp(settings.whatsappNumber, pesan), "_blank", "noopener");
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-12 text-center">
        <p className="font-display text-xl font-bold uppercase">Pricelist segera hadir</p>
        <p className="mt-1 text-sm text-muted">Daftar harga {title} sedang disiapkan. Hubungi tim sales kami lewat WhatsApp.</p>
      </div>
    );
  }

  return (
    <section className="pricelist-panel relative overflow-hidden rounded-3xl px-4 py-8 text-white sm:px-8 md:py-12">
      <div className="relative mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/70">Pilih model, lalu konsultasikan desain, ukuran, dan jumlah tim Anda dengan sales kami lewat WhatsApp.</p>

        <div role="radiogroup" aria-label={`Pilihan ${title}`} className="mt-8 space-y-5">
          {products.map((p, i) => {
            const aktif = p.id === pilih;
            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={aktif}
                tabIndex={aktif ? 0 : -1}
                onClick={() => setPilih(p.id)}
                onKeyDown={(e) => {
                  const arah = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
                  if (arah) {
                    e.preventDefault();
                    const n = products[(i + arah + products.length) % products.length];
                    setPilih(n.id);
                    (e.currentTarget.parentElement?.children[products.indexOf(n)] as HTMLElement | undefined)?.focus();
                  } else if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setPilih(p.id);
                  }
                }}
                className={`relative grid cursor-pointer grid-cols-[76px_1fr] items-start gap-x-3 gap-y-3 rounded-2xl border p-3 outline-none transition sm:grid-cols-[112px_1fr_auto] sm:gap-x-5 sm:gap-y-1 sm:p-4 focus-visible:ring-2 focus-visible:ring-brand-orange ${
                  aktif ? "border-brand-orange/80 bg-white/[0.12] shadow-lg shadow-black/30" : "border-white/15 bg-white/[0.04] hover:border-white/30"
                }`}
              >
                {aktif && (
                  <span aria-hidden className="brand-gradient absolute -left-2.5 -top-2.5 grid h-7 w-7 place-items-center rounded-full text-white shadow-md ring-4 ring-[#1b1b20]">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" className="h-3.5 w-3.5"><path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}

                <div className="relative row-span-2 aspect-square overflow-hidden rounded-xl bg-white/10 sm:row-span-2">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill sizes="(min-width: 640px) 112px, 76px" className="object-cover" priority={i < 3} />
                  ) : (
                    <div className="brand-gradient absolute inset-0"><div className="brand-stripes absolute inset-0" /></div>
                  )}
                </div>

                {/* nama + label */}
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 self-end sm:self-start">
                  <h2 className="text-base font-bold leading-tight sm:text-xl">{p.name}</h2>
                  {p.label && (
                    <span className="brand-gradient rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{p.label}</span>
                  )}
                </div>

                {/* harga: di HP di bawah nama, di layar lebar di kolom kanan */}
                <div className="col-start-2 row-start-2 self-start sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-right">
                  {p.hargaCoret !== null && p.hargaCoret > p.minPrice && (
                    <p className="text-xs text-white/50 line-through sm:text-sm">{rupiah(p.hargaCoret)}</p>
                  )}
                  {p.minPrice !== p.maxPrice && <p className="text-[10px] text-white/60">mulai</p>}
                  <p className="whitespace-nowrap text-xl font-bold leading-tight sm:text-2xl">{rupiah(p.minPrice)}</p>
                  {p.satuan && <p className="text-[11px] font-medium text-white/70 sm:text-xs">{p.satuan}</p>}
                </div>

                {/* poin & tautan detail: di HP selebar kartu */}
                <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-2">
                  {p.poin.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-white/70 sm:text-sm">
                      {p.poin.map((b) => (
                        <li key={b}>+ {b}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/produk/${p.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-block text-xs font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    Lihat detail & foto →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          {settings.whatsappNumber ? (
            <button
              onClick={bukaWhatsApp}
              disabled={!terpilih}
              className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white shadow-lg shadow-black/30 transition hover:brightness-110 disabled:opacity-60 sm:text-base"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z" /></svg>
              {terpilih ? `Pesan ${terpilih.name} via WhatsApp` : "Pilih salah satu dulu"}
            </button>
          ) : (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm text-white/80">Hubungi tim sales DJSport untuk memesan.</p>
          )}
          <p className="mt-3 text-center text-xs text-white/50">Harga dapat berubah sesuai desain, bahan, dan jumlah pesanan.</p>
        </div>
      </div>
    </section>
  );
}
