// Pencocokan warna/ukuran DJSport dengan variasi produk KONVEXA. Fungsi murni: dipakai server (stok, pesanan)
// dan browser (peringatan di admin).
//
// Variasi KONVEXA berlabel "A / B" (2 dimensi, mis. "Hitam / L") atau "A" (1 dimensi, mis. "L").

export type KxVarian = { label: string; a: string; b: string; qty: number; harga: number };
export type KxProdukVarian = {
  harga: number;
  stokDihitung: boolean;
  stok: number | null;
  varian: KxVarian[];
  dimensi: { n1: string; n2: string } | null;
};

const norm = (s: string) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

/** Variasi Konvexa yang cocok dengan warna + ukuran DJSport (urutan dimensi bebas), atau null. */
export function cariVarian(kp: Pick<KxProdukVarian, "varian">, warna: string, ukuran: string): KxVarian | null {
  const w = norm(warna), u = norm(ukuran);
  const duaDimensi = kp.varian.some((v) => v.b);
  for (const v of kp.varian) {
    const a = norm(v.a), b = norm(v.b);
    if (duaDimensi) {
      if ((a === w && b === u) || (a === u && b === w)) return v;
    } else if ((u && (a === u || norm(v.label) === u)) || (!u && w && a === w)) {
      return v;
    }
  }
  return null;
}

/** Stok "tak terbatas" untuk produk Konvexa yang stoknya tidak dihitung (dibuat sesuai pesanan) */
export const STOK_SESUAI_PESANAN = 999;

/** Stok, harga, dan label variasi Konvexa untuk satu warna + ukuran DJSport */
export function stokVarianKonvexa(kp: KxProdukVarian, warna: string, ukuran: string) {
  if (!kp.varian.length) {
    // produk tanpa stok per variasi: pakai total stok, dikirim tanpa variasi
    return { qty: kp.stokDihitung ? kp.stok ?? 0 : STOK_SESUAI_PESANAN, harga: kp.harga, label: "" as string | null };
  }
  const v = cariVarian(kp, warna, ukuran);
  if (!v) return { qty: kp.stokDihitung ? 0 : STOK_SESUAI_PESANAN, harga: kp.harga, label: null as string | null };
  return { qty: kp.stokDihitung ? v.qty : STOK_SESUAI_PESANAN, harga: v.harga || kp.harga, label: v.label as string | null };
}

/** Untuk produk DJSport tanpa varian: ubah variasi Konvexa menjadi pasangan warna/ukuran yang tampil di website. */
export function varianDariKonvexa(kp: KxProdukVarian): { warna: string; ukuran: string; v: KxVarian }[] {
  const n1 = norm(kp.dimensi?.n1 ?? ""), n2 = norm(kp.dimensi?.n2 ?? "");
  const isUkuran = (n: string) => /ukuran|size|uk\b/.test(n);
  const isWarna = (n: string) => /warna|color|colour/.test(n);
  return kp.varian.map((v) => {
    if (v.b) {
      // 2 dimensi: dimensi yang bernama "Ukuran" jadi ukuran, sisanya warna (bawaan: dimensi 1 = warna)
      return isUkuran(n1) && !isUkuran(n2) ? { warna: v.b, ukuran: v.a, v } : { warna: v.a, ukuran: v.b, v };
    }
    return isWarna(n1) ? { warna: v.a, ukuran: "", v } : { warna: "", ukuran: v.a, v };
  });
}
