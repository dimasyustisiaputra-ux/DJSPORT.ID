"use client";

import { useActionState, useState } from "react";
import { simpanTautanKonvexa } from "@/app/admin/produk/actions";
import { inputClass, Notice } from "@/components/admin/product-form";
import { rupiah } from "@/lib/format";

export type KxPilihan = { id: string; nama: string; kode: string; harga: number; stokDihitung: boolean; stok: number | null; varian: Record<string, number> };
export type KxBaris = { warna: string | null; ukuran: string[]; terpilih: string | null };

function stokTeks(p: KxPilihan) {
  if (!p.stokDihitung) return "stok tidak dihitung (sesuai pesanan)";
  const v = Object.entries(p.varian);
  return v.length ? v.map(([s, q]) => `${s} ${q}`).join(" · ") : `stok ${p.stok ?? 0}`;
}

function Baris({ baris, pilihan }: { baris: KxBaris; pilihan: KxPilihan[] }) {
  const [id, setId] = useState(baris.terpilih ?? "");
  const kp = pilihan.find((p) => p.id === id);
  const ukuranKx = kp ? Object.keys(kp.varian) : [];
  // Ukuran di DJSport yang tidak dikenal Konvexa akan terbaca stok 0
  const tidakAda = kp && kp.stokDihitung && ukuranKx.length ? baris.ukuran.filter((u) => !ukuranKx.includes(u)) : [];
  const hilang = Boolean(baris.terpilih) && !pilihan.some((p) => p.id === baris.terpilih);

  return (
    <div className="grid gap-2 border-b border-line py-3 last:border-0 sm:grid-cols-[160px_1fr]">
      <div className="text-sm font-semibold">{baris.warna ?? "Produk ini"}</div>
      <div className="space-y-1">
        <select name={baris.warna === null ? "kx_produk" : `kx:${baris.warna}`} value={id} onChange={(e) => setId(e.target.value)} className={inputClass}>
          <option value="">— Tidak ditautkan (pesan lewat WhatsApp) —</option>
          {hilang && <option value={baris.terpilih!}>⚠ Produk Konvexa tidak ditemukan ({baris.terpilih})</option>}
          {pilihan.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
              {p.kode ? ` (${p.kode})` : ""} · {rupiah(p.harga)}
            </option>
          ))}
        </select>
        {kp && (
          <p className="text-xs text-muted">
            Harga di website: <b>{rupiah(kp.harga)}</b> · Stok gudang utama: {stokTeks(kp)}
          </p>
        )}
        {tidakAda.length > 0 && (
          <p className="text-xs text-red-600">
            Ukuran {tidakAda.join(", ")} tidak ada di Konvexa, jadi akan tampil habis. Samakan penulisan ukurannya.
          </p>
        )}
        {hilang && <p className="text-xs text-red-600">Produk Konvexa yang ditautkan sudah tidak ada. Pilih ulang.</p>}
      </div>
    </div>
  );
}

export function KonvexaLinkForm({
  productId,
  baris,
  pilihan,
  gudang,
}: {
  productId: string;
  baris: KxBaris[];
  pilihan: KxPilihan[];
  gudang: string | null;
}) {
  const [state, action, pending] = useActionState(simpanTautanKonvexa.bind(null, productId), {});
  return (
    <form action={action} className="space-y-3">
      <Notice state={state} />
      <p className="text-sm text-muted">
        Warna yang ditautkan memakai <b>harga dan stok dari KONVEXA</b> (gudang {gudang ?? "utama"}), dan pembeli bisa memesan lewat
        keranjang. Pesanan langsung menjadi invoice di KONVEXA. Ukuran dicocokkan dengan varian produk Konvexa.
      </p>
      <div className="rounded-lg border border-line px-3">
        {baris.map((b) => (
          <Baris key={b.warna ?? "-"} baris={b} pilihan={pilihan} />
        ))}
      </div>
      <button disabled={pending} className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan tautan KONVEXA"}
      </button>
    </form>
  );
}
