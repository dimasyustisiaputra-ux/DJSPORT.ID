"use client";

// Keranjang pesanan disimpan di browser pengunjung (tanpa login). Harga & stok final selalu dicek ulang di server
// dan di KONVEXA saat pesanan dikirim, jadi data di sini hanya untuk tampilan.

import { useSyncExternalStore } from "react";

export type CartItem = {
  /** ID varian (atau "k:<productId>:<ukuran>" untuk ukuran dari KONVEXA) */
  key: string;
  productId: string;
  slug: string;
  nama: string;
  warna: string;
  ukuran: string;
  harga: number;
  qty: number;
  image: string | null;
};

const KUNCI = "djs-keranjang-v1";
const MAKS_QTY = 99;
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function baca(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KUNCI);
    const v = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(v) ? v.filter((x) => x && typeof x.key === "string" && x.qty > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function tulis(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(KUNCI, JSON.stringify(items));
  } catch {
    /* mode privat / penyimpanan penuh: keranjang tetap jalan selama halaman terbuka */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // keranjang diubah di tab lain
  window.addEventListener("storage", (e) => {
    if (e.key === KUNCI) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

const KOSONG: CartItem[] = [];
export function useCart() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    baca,
    () => KOSONG,
  );
}

export function tambahKeKeranjang(item: Omit<CartItem, "qty">, qty: number) {
  const items = [...baca()];
  const i = items.findIndex((x) => x.key === item.key);
  if (i >= 0) items[i] = { ...items[i], ...item, qty: Math.min(MAKS_QTY, items[i].qty + qty) };
  else items.push({ ...item, qty: Math.min(MAKS_QTY, qty) });
  tulis(items);
}

export function ubahJumlah(key: string, qty: number) {
  tulis(
    baca()
      .map((x) => (x.key === key ? { ...x, qty: Math.max(0, Math.min(MAKS_QTY, Math.floor(qty))) } : x))
      .filter((x) => x.qty > 0),
  );
}

export function hapusDariKeranjang(key: string) {
  tulis(baca().filter((x) => x.key !== key));
}

export function kosongkanKeranjang() {
  tulis([]);
}
