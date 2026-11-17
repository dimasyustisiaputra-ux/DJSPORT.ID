"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@/lib/catalog";
import { rentangHarga, rupiah } from "@/lib/format";
import { linkWhatsApp, type SiteSettings } from "@/lib/whatsapp";

export function ProductView({ product, settings }: { product: ProductDetail; settings: SiteSettings }) {
  const [warna, setWarna] = useState<string | null>(
    product.colors.find((c) => product.variants.some((v) => v.color_name === c.name && v.stock > 0))?.name ?? product.colors[0]?.name ?? null,
  );
  const [ukuran, setUkuran] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState(1);
  const [fotoAktif, setFotoAktif] = useState(0);

  // Foto untuk warna terpilih (+ foto umum). Bila tidak ada, tampilkan semua.
  const foto = useMemo(() => {
    const cocok = product.images.filter((f) => !f.color_name || f.color_name === warna);
    return cocok.length ? cocok : product.images;
  }, [product.images, warna]);

  const varianUkuran = (size: string) => product.variants.find((v) => v.color_name === warna && v.size === size);
  const terpilih = ukuran ? varianUkuran(ukuran) : undefined;
  const hargaWarna = product.variants.filter((v) => v.color_name === warna).map((v) => v.price);
  const harga = terpilih
    ? rupiah(terpilih.price)
    : hargaWarna.length
      ? rentangHarga(Math.min(...hargaWarna), Math.max(...hargaWarna))
      : rentangHarga(product.minPrice, product.maxPrice);

  function pilihWarna(nama: string) {
    setWarna(nama);
    setFotoAktif(0);
    // Pertahankan ukuran bila tersedia di warna baru
    if (ukuran) {
      const v = product.variants.find((x) => x.color_name === nama && x.size === ukuran);
      if (!v || v.stock === 0) setUkuran(null);
    }
    setJumlah(1);
  }

  /** Pesan WhatsApp berisi detail pilihan pengunjung; dibuat saat tombol diklik agar tautan produk akurat. */
  function bukaWhatsApp() {
    if (!settings.whatsappNumber) return;
    const baris = [
      settings.whatsappGreeting,
      "",
      `*${product.name}*`,
      warna ? `Warna: ${warna}` : null,
      product.sizes.length ? `Ukuran: ${terpilih?.size ?? "(belum dipilih)"}` : null,
      `Jumlah: ${jumlah}`,
      `Harga: ${harga}`,
      "",
      window.location.origin + `/produk/${product.slug}`,
    ].filter((b) => b !== null);
    window.open(linkWhatsApp(settings.whatsappNumber, baris.join("\n")), "_blank", "noopener");
  }

  const gambar = foto[fotoAktif] ?? foto[0];

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      {/* Galeri */}
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-paper">
          {gambar ? (
            <Image src={gambar.url} alt={`${product.name}${warna ? ` — ${warna}` : ""}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />
          ) : (
            <div className="brand-gradient absolute inset-0"><div className="brand-stripes absolute inset-0" /></div>
          )}
        </div>
        {foto.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {foto.map((f, i) => (
              <button
                key={f.url}
                onClick={() => setFotoAktif(i)}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === fotoAktif}
                className={`relative aspect-[4/5] overflow-hidden rounded-md border-2 ${i === fotoAktif ? "border-brand-orange" : "border-transparent"}`}
              >
                <Image src={f.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info & pilihan */}
      <div>
        {product.category && (
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">{product.category.name}</p>
        )}
        <h1 className="mt-1 font-display text-3xl font-bold uppercase leading-tight md:text-4xl">{product.name}</h1>
        <p className="mt-3 text-2xl font-bold">{harga}</p>

        {product.colors.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">
              Warna: <span className="font-semibold">{warna}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const habis = !product.variants.some((v) => v.color_name === c.name && v.stock > 0);
                return (
                  <button
                    key={c.name}
                    onClick={() => pilihWarna(c.name)}
                    aria-pressed={warna === c.name}
                    title={habis ? `${c.name} (habis)` : c.name}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                      warna === c.name ? "border-brand-ink ring-1 ring-brand-ink" : "border-line hover:border-brand-ink"
                    } ${habis ? "opacity-50" : ""}`}
                  >
                    <span className="h-4 w-4 rounded-full border border-line" style={{ background: c.hex ?? "#e7e5e2" }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Ukuran</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const v = varianUkuran(s);
                const tidakAda = !v || v.stock === 0;
                return (
                  <button
                    key={s}
                    disabled={tidakAda}
                    onClick={() => {
                      setUkuran(s);
                      setJumlah(1);
                    }}
                    aria-pressed={ukuran === s}
                    className={`min-w-12 rounded-md border px-3 py-2 text-sm font-semibold ${
                      ukuran === s ? "border-brand-ink bg-brand-ink text-white" : "border-line hover:border-brand-ink"
                    } disabled:cursor-not-allowed disabled:text-muted disabled:line-through disabled:hover:border-line`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {terpilih && terpilih.stock <= 5 && (
              <p className="mt-2 text-sm font-medium text-brand-red">Sisa {terpilih.stock} lagi</p>
            )}
          </div>
        )}

        {!product.inStock && (
          <p className="mt-6 rounded-md bg-brand-paper px-4 py-3 text-sm font-semibold">
            Stok sedang kosong. Tanyakan ketersediaan atau pre-order ke tim sales kami.
          </p>
        )}

        {settings.whatsappNumber && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border border-line">
                <button onClick={() => setJumlah((j) => Math.max(1, j - 1))} className="px-3 py-2.5 text-lg" aria-label="Kurangi jumlah">−</button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{jumlah}</span>
                <button onClick={() => setJumlah((j) => j + 1)} className="px-3 py-2.5 text-lg" aria-label="Tambah jumlah">+</button>
              </div>
              <button
                onClick={bukaWhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3 font-semibold text-white hover:bg-[#1ebe5a]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
                </svg>
                {product.inStock ? "Pesan via WhatsApp" : "Tanya via WhatsApp"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Pilihan warna, ukuran, dan jumlah Anda akan otomatis tertulis di pesan untuk tim sales DJSport.
            </p>
          </>
        )}

        {product.description && (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="mb-2 font-display text-lg font-bold uppercase">Deskripsi</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
