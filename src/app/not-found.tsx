import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-brand-paper px-4 py-20 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-orange">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold uppercase">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Produk atau halaman yang Anda cari mungkin sudah tidak tersedia.</p>
      <Link href="/#produk" className="brand-gradient mt-6 rounded-md px-5 py-2.5 text-sm font-semibold text-white">Lihat Produk</Link>
    </main>
  );
}
