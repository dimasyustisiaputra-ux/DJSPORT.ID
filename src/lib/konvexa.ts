// Penghubung ke KONVEXA (ERP DJSPORT): stok & harga produk Retail, dan pengiriman pesanan sebagai invoice.
// HANYA untuk kode server: memakai kunci rahasia KONVEXA_TOKEN (jangan diberi awalan NEXT_PUBLIC_).
// Lihat juga worker/djsport.js di repo KONVEXA.

export type KonvexaProduk = {
  id: string;
  nama: string;
  kode: string;
  harga: number;
  satuan: string;
  /** false = stok tidak dihitung di Konvexa (dibuat sesuai pesanan) */
  stokDihitung: boolean;
  stok: number | null;
  /** stok per ukuran, mis. { M: 4, L: 2 }; kosong bila produk tidak punya stok per ukuran */
  varian: Record<string, number>;
  tanpaVarian: number | null;
};

export type KonvexaData = { gudang: { id: string; nama: string } | null; produk: KonvexaProduk[]; waktu: number };

function konfigurasi() {
  const url = (process.env.KONVEXA_URL || "").replace(/\/+$/, "");
  const token = process.env.KONVEXA_TOKEN || "";
  return url && token ? { url, token } : null;
}

export function konvexaAktif() {
  return konfigurasi() !== null;
}

// Cache singkat di memori server: stok tetap segar, tetapi tidak setiap kunjungan halaman memanggil Konvexa.
const CACHE_MS = 30_000;
let cache: { at: number; data: KonvexaData } | null = null;

/** Daftar produk Retail Konvexa + stok gudang utama. null bila integrasi belum diatur atau Konvexa tidak bisa dihubungi. */
export async function getKonvexaProduk(opts: { segar?: boolean } = {}): Promise<KonvexaData | null> {
  const k = konfigurasi();
  if (!k) return null;
  if (!opts.segar && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    const res = await fetch(`${k.url}/api/djsport/produk`, {
      headers: { Authorization: `Bearer ${k.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as KonvexaData;
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.error("[konvexa] gagal mengambil produk:", e);
    // stok lama lebih baik daripada tidak ada sama sekali, selama belum terlalu basi (5 menit)
    return cache && Date.now() - cache.at < 300_000 ? cache.data : null;
  }
}

export type HasilPesanan =
  | { ok: true; nomor: string; total: number }
  | { ok: false; pesan: string; kurang?: { produkId: string; varian: string; diminta: number; tersedia: number }[] };

export async function kirimPesananKeKonvexa(body: {
  ref: string;
  nama: string;
  wa: string;
  alamat: string;
  catatan?: string;
  items: { produkId: string; varian: string; qty: number }[];
}): Promise<HasilPesanan> {
  const k = konfigurasi();
  if (!k) return { ok: false, pesan: "Pemesanan online belum aktif. Silakan hubungi tim sales lewat WhatsApp." };
  try {
    const res = await fetch(`${k.url}/api/djsport/pesanan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      nomor?: string;
      total?: number;
      error?: string;
      detail?: { produkId: string; varian: string; diminta: number; tersedia: number }[] | null;
    };
    cache = null; // stok berubah: ambil ulang pada kunjungan berikutnya
    if (res.ok && data.nomor) return { ok: true, nomor: data.nomor, total: Number(data.total) || 0 };
    return { ok: false, pesan: data.error || "Pesanan gagal dikirim. Coba lagi sebentar lagi.", kurang: data.detail || undefined };
  } catch (e) {
    console.error("[konvexa] gagal mengirim pesanan:", e);
    return { ok: false, pesan: "Server pesanan sedang tidak bisa dihubungi. Coba lagi sebentar lagi, atau pesan lewat WhatsApp." };
  }
}
