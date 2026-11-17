"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/lib/catalog";

const JEDA_MS = 6000;

/** Teks di dalam [kurung siku] diberi warna oranye. */
export function SorotJudul({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="text-brand-orange">{part.slice(1, -1)}</span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function BannerSlide({ banner, priority }: { banner: Banner; priority?: boolean }) {
  const gelap = banner.text_color === "gelap";
  const adaGambar = Boolean(banner.image_url);

  return (
    <div className={`relative isolate flex h-full overflow-hidden bg-brand-ink ${gelap ? "text-brand-ink" : "text-brand-paper"}`}>
      {adaGambar ? (
        <>
          <picture className="absolute inset-0 -z-10">
            {banner.image_mobile_url && <source media="(max-width: 767px)" srcSet={banner.image_mobile_url} />}
            <img
              src={banner.image_url!}
              alt=""
              className="h-full w-full object-cover"
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
            />
          </picture>
          {/* Lapisan gradasi agar teks tetap terbaca di atas foto */}
          <div
            className={`absolute inset-0 -z-10 ${
              gelap ? "bg-gradient-to-r from-white/85 via-white/50 to-transparent" : "bg-gradient-to-r from-black/75 via-black/40 to-transparent"
            }`}
          />
        </>
      ) : (
        <div
          className="brand-stripes absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-40 md:block"
          style={{ clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
      )}

      <div className={`mx-auto grid min-h-[420px] w-full max-w-6xl items-center gap-10 px-4 py-16 md:min-h-[480px] md:py-24 ${adaGambar ? "" : "md:grid-cols-2"}`}>
        <div className="max-w-xl">
          {banner.eyebrow && (
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">{banner.eyebrow}</p>
          )}
          <h2 className="font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl">
            <SorotJudul text={banner.title} />
          </h2>
          {banner.subtitle && (
            <p className={`mt-4 max-w-md text-base ${gelap ? "text-brand-ink/75" : "text-white/75"}`}>{banner.subtitle}</p>
          )}
          {(banner.cta_label || banner.cta2_label) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {banner.cta_label && banner.cta_url && (
                <Link href={banner.cta_url} className="brand-gradient rounded-md px-6 py-3 font-semibold text-white">
                  {banner.cta_label}
                </Link>
              )}
              {banner.cta2_label && banner.cta2_url && (
                <Link
                  href={banner.cta2_url}
                  className={`rounded-md border px-6 py-3 font-semibold ${
                    gelap ? "border-brand-ink/30 hover:bg-brand-ink/5" : "border-white/30 hover:bg-white/10"
                  }`}
                >
                  {banner.cta2_label}
                </Link>
              )}
            </div>
          )}
        </div>
        {!adaGambar && (
          <div className="hidden justify-center md:flex">
            <Image src="/brand/logo-icon.png" alt="" width={1480} height={1010} className="w-96 drop-shadow-2xl" priority={priority} />
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(false);
  const sentuhX = useRef<number | null>(null);
  const jumlah = banners.length;

  const ke = useCallback((i: number) => setAktif(((i % jumlah) + jumlah) % jumlah), [jumlah]);

  useEffect(() => {
    if (jumlah < 2 || jeda) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => ke(aktif + 1), JEDA_MS);
    return () => clearTimeout(t);
  }, [aktif, jeda, jumlah, ke]);

  if (jumlah === 0) return null;
  if (jumlah === 1) return <BannerSlide banner={banners[0]} priority />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner promosi"
      className="relative overflow-hidden bg-brand-ink"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
      onFocus={() => setJeda(true)}
      onBlur={() => setJeda(false)}
      onTouchStart={(e) => (sentuhX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (sentuhX.current === null) return;
        const dx = e.changedTouches[0].clientX - sentuhX.current;
        if (Math.abs(dx) > 50) ke(aktif + (dx < 0 ? 1 : -1));
        sentuhX.current = null;
      }}
    >
      <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${aktif * 100}%)` }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} dari ${jumlah}`}
            aria-hidden={i !== aktif}
            inert={i !== aktif}
          >
            <BannerSlide banner={b} priority={i === 0} />
          </div>
        ))}
      </div>

      <button
        onClick={() => ke(aktif - 1)}
        aria-label="Banner sebelumnya"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-xl text-white backdrop-blur hover:bg-black/50 md:flex"
      >
        ‹
      </button>
      <button
        onClick={() => ke(aktif + 1)}
        aria-label="Banner berikutnya"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-xl text-white backdrop-blur hover:bg-black/50 md:flex"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => ke(i)}
            aria-label={`Tampilkan banner ${i + 1}`}
            aria-current={i === aktif}
            className={`h-2 rounded-full transition-all ${i === aktif ? "w-8 bg-brand-orange" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}
