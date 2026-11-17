"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/** Ikon keranjang di header; hanya tampil bila keranjang berisi barang. */
export function CartButton() {
  const jumlah = useCart().reduce((n, x) => n + x.qty, 0);
  if (!jumlah) return null;
  return (
    <Link href="/keranjang" aria-label={`Keranjang, ${jumlah} barang`} className="relative flex items-center rounded-md p-2 hover:bg-brand-paper">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 7h12l-1 13H7L6 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span className="brand-gradient absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white">
        {jumlah > 99 ? "99+" : jumlah}
      </span>
    </Link>
  );
}
