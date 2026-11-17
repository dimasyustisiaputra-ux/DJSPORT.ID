"use server";

import { headers } from "next/headers";
import { getProductsForOrder } from "@/lib/catalog";
import { kirimPesananKeKonvexa } from "@/lib/konvexa";

export type HasilKirim =
  | { ok: true; nomor: string; total: number }
  | { ok: false; pesan: string; kurang?: { key: string; tersedia: number }[] };

type Masukan = {
  ref: string;
  nama: string;
  wa: string;
  alamat: string;
  catatan: string;
  items: { key: string; productId: string; qty: number }[];
  turnstile: string;
};

// Batas sederhana per IP (per instance server) sebagai lapis kedua setelah Turnstile
const percobaan = new Map<string, number[]>();
function bolehKirim(ip: string) {
  const now = Date.now(), jendela = 10 * 60_000, maks = 5;
  const daftar = (percobaan.get(ip) ?? []).filter((t) => now - t < jendela);
  if (daftar.length >= maks) return false;
  daftar.push(now);
  percobaan.set(ip, daftar);
  return true;
}

/** Verifikasi Cloudflare Turnstile (anti-bot). Bila TURNSTILE_SECRET_KEY belum diisi, pemeriksaan dilewati. */
async function lolosTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function kirimPesanan(m: Masukan): Promise<HasilKirim> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "";

  const nama = String(m.nama ?? "").trim();
  const wa = String(m.wa ?? "").replace(/[^\d+]/g, "");
  const alamat = String(m.alamat ?? "").trim();
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(String(m.ref ?? ""))) return { ok: false, pesan: "Muat ulang halaman lalu coba lagi." };
  if (!nama) return { ok: false, pesan: "Isi nama Anda." };
  if (!/^(\+?62|0)8\d{7,12}$/.test(wa)) return { ok: false, pesan: "Nomor HP tidak valid. Contoh: 081234567890." };
  if (alamat.length < 10) return { ok: false, pesan: "Isi alamat pengiriman lengkap (jalan, nomor, kota)." };
  if (!Array.isArray(m.items) || !m.items.length || m.items.length > 50) return { ok: false, pesan: "Keranjang kosong." };

  if (!(await lolosTurnstile(String(m.turnstile ?? ""), ip))) return { ok: false, pesan: "Verifikasi anti-bot gagal. Centang ulang verifikasinya lalu kirim lagi." };
  if (ip && !bolehKirim(ip)) return { ok: false, pesan: "Terlalu banyak pesanan dalam waktu singkat. Coba lagi beberapa menit lagi." };

  // Ambil ulang produk & stok terbaru: data di browser hanya untuk tampilan
  const produk = await getProductsForOrder([...new Set(m.items.map((x) => String(x.productId)))]);
  const baris: { key: string; produkId: string; varian: string; qty: number }[] = [];
  for (const it of m.items) {
    const p = produk.find((x) => x.id === it.productId);
    const v = p?.variants.find((x) => x.id === it.key);
    const qty = Math.floor(Number(it.qty));
    if (!p || !v || !v.dipesan || !v.konvexaId) return { ok: false, pesan: "Ada produk di keranjang yang sudah tidak bisa dipesan online. Hapus produk itu lalu coba lagi.", kurang: [{ key: it.key, tersedia: 0 }] };
    if (!(qty > 0) || qty > 99) return { ok: false, pesan: "Jumlah barang tidak valid." };
    baris.push({ key: it.key, produkId: v.konvexaId, varian: v.size, qty });
  }

  const hasil = await kirimPesananKeKonvexa({
    ref: m.ref,
    nama: nama.slice(0, 80),
    wa,
    alamat: alamat.slice(0, 500),
    catatan: String(m.catatan ?? "").trim().slice(0, 500),
    items: baris.map(({ produkId, varian, qty }) => ({ produkId, varian, qty })),
  });
  if (hasil.ok) return hasil;

  // Petakan baris yang stoknya kurang kembali ke item keranjang
  const kurang = (hasil.kurang ?? []).flatMap((k) =>
    baris
      .filter((b) => b.produkId === k.produkId && (b.varian === k.varian || !k.varian))
      .map((b) => ({ key: b.key, tersedia: k.tersedia })),
  );
  return { ok: false, pesan: hasil.pesan, kurang: kurang.length ? kurang : undefined };
}
