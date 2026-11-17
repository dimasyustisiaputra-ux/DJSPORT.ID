"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, useTransition } from "react";
import { hapusDariKeranjang, kosongkanKeranjang, ubahJumlah, useCart } from "@/lib/cart";
import { rupiah } from "@/lib/format";
import { linkWhatsApp } from "@/lib/whatsapp";
import { kirimPesanan, type HasilKirim } from "@/app/keranjang/actions";

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20";

function buatRef() {
  return "djs-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function CartPage({ whatsappNumber, turnstileSiteKey }: { whatsappNumber: string | null; turnstileSiteKey: string | null }) {
  const items = useCart();
  const [pending, startTransition] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);
  const [kurang, setKurang] = useState<Record<string, number>>({});
  const [sukses, setSukses] = useState<{ nomor: string; total: number; nama: string } | null>(null);
  // Satu nomor referensi per percobaan checkout: kiriman ulang (mis. tombol diklik dua kali) tidak membuat invoice ganda
  const ref = useRef<string>("");
  useEffect(() => {
    if (!ref.current) ref.current = buatRef();
  }, []);

  const total = items.reduce((n, x) => n + x.harga * x.qty, 0);
  const jumlahBarang = items.reduce((n, x) => n + x.qty, 0);

  function kirim(fd: FormData) {
    setGalat(null);
    setKurang({});
    const data = {
      ref: ref.current || buatRef(),
      nama: String(fd.get("nama") ?? ""),
      wa: String(fd.get("wa") ?? ""),
      alamat: String(fd.get("alamat") ?? ""),
      catatan: String(fd.get("catatan") ?? ""),
      turnstile: String(fd.get("cf-turnstile-response") ?? ""),
      items: items.map((x) => ({ key: x.key, productId: x.productId, qty: x.qty })),
    };
    startTransition(async () => {
      let res: HasilKirim;
      try {
        res = await kirimPesanan(data);
      } catch {
        res = { ok: false, pesan: "Koneksi terputus. Coba kirim lagi." };
      }
      if (res.ok) {
        setSukses({ nomor: res.nomor, total: res.total, nama: data.nama });
        kosongkanKeranjang();
        ref.current = buatRef();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setGalat(res.pesan);
      if (res.kurang) setKurang(Object.fromEntries(res.kurang.map((k) => [k.key, k.tersedia])));
      window.turnstile?.reset();
    });
  }

  if (sukses) {
    const pesanWa = `Halo DJSport, saya ${sukses.nama}. Saya baru memesan lewat website dengan nomor invoice ${sukses.nomor} (total ${rupiah(sukses.total)}). Mohon info pembayaran dan pengirimannya. Terima kasih.`;
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-line bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <h2 className="mt-3 font-display text-2xl font-bold uppercase">Pesanan terkirim</h2>
        <p className="mt-2 text-sm text-muted">Nomor pesanan Anda:</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-brand-orange">{sukses.nomor}</p>
        <p className="mt-1 text-sm">Total {rupiah(sukses.total)} (belum termasuk ongkos kirim)</p>
        <p className="mt-4 text-sm text-muted">
          Tim sales DJSport akan menghubungi Anda lewat WhatsApp untuk konfirmasi pembayaran dan pengiriman. Simpan nomor pesanan di atas.
        </p>
        {whatsappNumber && (
          <a
            href={linkWhatsApp(whatsappNumber, pesanWa)}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3 font-semibold text-white hover:bg-[#1ebe5a]"
          >
            Konfirmasi ke Sales via WhatsApp
          </a>
        )}
        <div className="mt-4">
          <Link href="/#produk" className="text-sm font-semibold text-brand-orange">← Lanjut lihat produk</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-12 text-center">
        <p className="font-display text-xl font-bold uppercase">Keranjang kosong</p>
        <p className="mt-1 text-sm text-muted">Pilih produk, lalu klik &ldquo;Tambah ke Keranjang&rdquo;.</p>
        <Link href="/#produk" className="brand-gradient mt-5 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white">Lihat Produk</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {items.map((x) => (
          <div key={x.key} className="flex gap-4 border-b border-line p-4 last:border-0">
            <Link href={`/produk/${x.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-brand-paper">
              {x.image && <Image src={x.image} alt="" fill sizes="80px" className="object-cover" />}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/produk/${x.slug}`} className="font-semibold hover:text-brand-orange">{x.nama}</Link>
              <p className="text-sm text-muted">{[x.warna, x.ukuran && `Ukuran ${x.ukuran}`].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-sm font-semibold">{rupiah(x.harga)}</p>
              {x.key in kurang && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {kurang[x.key] > 0 ? `Stok tinggal ${kurang[x.key]}. Kurangi jumlahnya.` : "Stok habis. Hapus dari keranjang."}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-md border border-line">
                  <button type="button" onClick={() => ubahJumlah(x.key, x.qty - 1)} className="px-2.5 py-1.5" aria-label="Kurangi jumlah">−</button>
                  <span className="w-8 text-center text-sm font-semibold">{x.qty}</span>
                  <button type="button" onClick={() => ubahJumlah(x.key, x.qty + 1)} className="px-2.5 py-1.5" aria-label="Tambah jumlah">+</button>
                </div>
                <button type="button" onClick={() => hapusDariKeranjang(x.key)} className="text-sm text-red-600 hover:underline">Hapus</button>
              </div>
            </div>
            <p className="hidden text-right font-bold sm:block">{rupiah(x.harga * x.qty)}</p>
          </div>
        ))}
      </div>

      {/* onSubmit (bukan action): formulir tidak dikosongkan otomatis, jadi isian pembeli tetap ada bila pengiriman gagal */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          kirim(new FormData(e.currentTarget));
        }}
        className="h-fit space-y-4 rounded-xl border border-line bg-white p-5"
      >
        <h2 className="font-display text-lg font-bold uppercase">Data pemesan</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nama lengkap</span>
          <input name="nama" required autoComplete="name" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nomor HP / WhatsApp</span>
          <input name="wa" required type="tel" autoComplete="tel" placeholder="081234567890" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Alamat pengiriman</span>
          <textarea name="alamat" required rows={3} autoComplete="street-address" placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Catatan (opsional)</span>
          <input name="catatan" placeholder="Mis. kirim sore hari" className={inputClass} />
        </label>

        <div className="border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Total ({jumlahBarang} barang)</span>
            <span className="font-bold">{rupiah(total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Belum termasuk ongkos kirim. Harga dan stok dicek ulang saat pesanan dikirim.</p>
        </div>

        {turnstileSiteKey && (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language="id" />
          </>
        )}

        {galat && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{galat}</p>}

        <button disabled={pending} className="brand-gradient w-full rounded-md px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Mengirim pesanan…" : "Kirim Pesanan"}
        </button>
        <p className="text-center text-xs text-muted">Pembayaran dikonfirmasi oleh tim sales DJSport lewat WhatsApp.</p>
      </form>
    </div>
  );
}
