"use client";

import { useActionState } from "react";
import { simpanProduk, type ActionState } from "@/app/admin/produk/actions";

export type ProductValues = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number;
  is_active: boolean;
};

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20";

export function Notice({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{state.ok}</p>;
  return null;
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductValues;
  categories: { id: string; name: string; parent_id?: string | null }[];
}) {
  const utama = categories.filter((c) => !c.parent_id);
  const [state, action, pending] = useActionState(simpanProduk.bind(null, product?.id ?? null), {});

  return (
    <form action={action} className="space-y-4 rounded-xl border border-line bg-white p-5">
      <Notice state={state} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nama produk</span>
        <input name="name" required defaultValue={product?.name} placeholder="Jersey Training Pro" className={inputClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Kategori</span>
          <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputClass}>
            <option value="">— Pilih kategori —</option>
            {utama.map((c) => {
              const subs = categories.filter((s) => s.parent_id === c.id);
              return subs.length ? (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name} (umum)</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={c.id} value={c.id}>{c.name}</option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Harga (Rp)</span>
          <input
            name="base_price"
            required
            inputMode="numeric"
            defaultValue={product ? product.base_price.toLocaleString("id-ID") : ""}
            placeholder="189.000"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-muted">Harga dasar semua varian. Bisa dibedakan per varian.</span>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Deskripsi</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={product?.description ?? ""}
          placeholder="Bahan, fitur, panduan ukuran, cara perawatan…"
          className={inputClass}
        />
      </label>

      {product && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Alamat URL (slug)</span>
          <input name="slug" defaultValue={product.slug} className={inputClass} />
          <span className="mt-1 block text-xs text-muted">djsport.id/produk/{product.slug}</span>
        </label>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="h-4 w-4 accent-[var(--brand-orange)]" />
        Tampilkan di toko
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="brand-gradient rounded-md px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Menyimpan…" : product ? "Simpan perubahan" : "Simpan & lanjut isi varian dan foto"}
        </button>
        {!product && <span className="text-xs text-muted">Varian warna × ukuran dan unggah foto ada di halaman berikutnya.</span>}
      </div>
    </form>
  );
}
