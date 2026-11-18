"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/catalog";
import { rupiah } from "@/lib/format";
import { linkWhatsApp, type SiteSettings } from "@/lib/whatsapp";

/**
 * Tampilan "pricelist": produk sebagai kartu harga, masing-masing dengan tombol Hubungi Sales (WhatsApp).
 * Dipakai untuk kategori dengan tampilan "pricelist" (mis. Custom Jersey) yang hanya dijual lewat sales.
 */
type BannerGambar = { desktop: string | null; mobile: string | null };

/** Banner kategori dari admin (Kategori → Ubah). Tanpa gambar: banner desain brand dengan nama kategori. */
function BannerKategori({ title, banner }: { title: string; banner: BannerGambar }) {
  const hp = banner.mobile ?? banner.desktop;
  if (!banner.desktop && !hp) {
    return (
      <div aria-hidden className="brand-gradient relative grid aspect-[2/1] place-items-center overflow-hidden rounded-2xl sm:aspect-[3/1]">
        <div className="brand-stripes absolute inset-0" />
        <p className="relative px-4 text-center font-display text-3xl font-bold uppercase text-white tracking-tight sm:text-5xl">{title}</p>
      </div>
    );
  }
  return (
    <>
      {hp && (
        <div className={`relative overflow-hidden rounded-2xl bg-brand-paper sm:hidden ${banner.mobile ? "aspect-square" : "aspect-[3/1]"}`}>
          <Image src={hp} alt={title} fill sizes="100vw" className="object-cover" priority />
        </div>
      )}
      {banner.desktop && (
        <div className="relative hidden aspect-[3/1] overflow-hidden rounded-2xl bg-brand-paper sm:block">
          <Image src={banner.desktop} alt={title} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" priority />
        </div>
      )}
    </>
  );
}

export function PricelistCards({
  products,
  title,
  banner,
  settings,
}: {
  products: ProductCard[];
  title: string;
  banner: BannerGambar;
  settings: SiteSettings;
}) {
  /** Buka WhatsApp sales dengan pesan berisi produk kartu ini. */
  function hubungiSales(p: ProductCard) {
    if (!settings.whatsappNumber) return;
    const pesan = [
      settings.whatsappGreeting,
      "",
      `*${p.name}*`,
      `Harga: ${p.minPrice !== p.maxPrice ? "mulai " : ""}${rupiah(p.minPrice)}${p.satuan ? ` ${p.satuan}` : ""}`,
      "",
      window.location.origin + `/produk/${p.slug}`,
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
    <section className="bg-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="sr-only">{title}</h1>
        <BannerKategori title={title} banner={banner} />

        <ul aria-label={`Daftar harga ${title}`} className="mt-8 space-y-4">
          {products.map((p, i) => (
            <li
              key={p.id}
              className="grid grid-cols-[76px_1fr] items-start gap-x-3 gap-y-3 rounded-2xl border border-line bg-white p-3 transition hover:border-gray-300 hover:shadow-md sm:grid-cols-[112px_1fr_auto] sm:gap-x-5 sm:gap-y-1 sm:p-4"
            >
              <div className="relative row-span-2 aspect-square overflow-hidden rounded-xl bg-brand-paper">
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
                  <p className="text-xs text-muted line-through sm:text-sm">{rupiah(p.hargaCoret)}</p>
                )}
                {p.minPrice !== p.maxPrice && <p className="text-[10px] text-muted">mulai</p>}
                <p className="whitespace-nowrap text-xl font-bold leading-tight sm:text-2xl">{rupiah(p.minPrice)}</p>
                {p.satuan && <p className="text-[11px] font-medium text-muted sm:text-xs">{p.satuan}</p>}
              </div>

              {/* poin, tautan detail, dan tombol sales: di HP selebar kartu */}
              <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-2">
                {p.poin.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[11px] leading-snug text-muted sm:text-xs">
                    {p.poin.map((b) => (
                      <li key={b}>+ {b}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link href={`/produk/${p.slug}`} className="text-xs font-semibold text-brand-ink underline-offset-4 hover:text-brand-orange hover:underline">
                    Lihat detail & foto →
                  </Link>
                  {settings.whatsappNumber && (
                    <button
                      type="button"
                      onClick={() => hubungiSales(p)}
                      aria-label={`Hubungi sales tentang ${p.name} lewat WhatsApp`}
                      className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1ebe5a]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
                      </svg>
                      Hubungi Sales
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-muted">Harga dapat berubah sesuai desain, bahan, dan jumlah pesanan.</p>
      </div>
    </section>
  );
}
