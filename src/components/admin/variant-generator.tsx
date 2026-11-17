"use client";

import { useActionState } from "react";
import { buatVarian } from "@/app/admin/produk/actions";
import { inputClass, Notice } from "@/components/admin/product-form";

export function VariantGenerator({ productId, hasVariants }: { productId: string; hasVariants: boolean }) {
  const [state, action, pending] = useActionState(buatVarian.bind(null, productId), {});
  return (
    <form action={action} className="space-y-3 rounded-lg bg-brand-paper p-4">
      <p className="text-sm font-semibold">{hasVariants ? "Tambah varian" : "Buat varian sekaligus"}</p>
      <Notice state={state} />
      <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Warna (satu per baris, kode warna opsional)</span>
          <textarea name="colors" rows={3} placeholder={"Hitam #282829\nOranye #F05B36\nPutih"} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Ukuran (pisahkan dengan koma)</span>
          <textarea name="sizes" rows={3} placeholder="S, M, L, XL, XXL" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Stok awal per varian</span>
          <input name="stock" type="number" min={0} defaultValue={0} className={inputClass} />
        </label>
      </div>
      <button disabled={pending} className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Membuat…" : "Buat kombinasi varian"}
      </button>
    </form>
  );
}
