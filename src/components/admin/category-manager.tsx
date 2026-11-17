"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { geserKategori, hapusKategori, simpanKategori, tambahKategori, type KategoriState } from "@/app/admin/kategori/actions";
import { inputClass, Notice } from "@/components/admin/product-form";

type AdminCategoryBase = { id: string; name: string; slug: string; show_in_nav: boolean; produk: number };
export type AdminCategory = AdminCategoryBase & { children: AdminCategoryBase[] };

function TambahForm({ parentId, placeholder, label }: { parentId: string | null; placeholder: string; label: string }) {
  const [state, action, pending] = useActionState<KategoriState, FormData>(tambahKategori.bind(null, parentId), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" required placeholder={placeholder} className={inputClass} aria-label={label} />
        <button disabled={pending} className="shrink-0 rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "…" : label}
        </button>
      </div>
      {state.error && <Notice state={state} />}
    </form>
  );
}

function Baris({
  cat,
  parentId,
  isFirst,
  isLast,
  parents,
}: {
  cat: AdminCategoryBase & { children?: AdminCategoryBase[] };
  parentId: string | null;
  isFirst: boolean;
  isLast: boolean;
  parents: { id: string; name: string }[];
}) {
  const isSub = parentId !== null;
  const [edit, setEdit] = useState(false);
  const [state, action, pending] = useActionState<KategoriState, FormData>(async (prev, formData) => {
    const res = await simpanKategori(cat.id, prev, formData);
    if (res.ok) setEdit(false); // tutup form setelah berhasil disimpan
    return res;
  }, {});
  const jumlahSub = cat.children?.length ?? 0;
  const bisaPindah = jumlahSub === 0; // kategori yang punya sub tidak bisa dijadikan sub

  const totalProduk = cat.produk + (cat.children ?? []).reduce((n, c) => n + c.produk, 0);
  const pesanHapus =
    `Hapus kategori "${cat.name}"` +
    (jumlahSub ? ` beserta ${jumlahSub} sub-kategorinya` : "") +
    `?` +
    (totalProduk ? ` ${totalProduk} produk di dalamnya tidak terhapus, tetapi menjadi tanpa kategori.` : "") +
    ` Ini tidak bisa dibatalkan.`;

  return (
    <div className={`flex flex-wrap items-start gap-3 py-3 ${isSub ? "pl-8" : ""}`}>
      <div className="flex flex-col pt-1">
        <form action={geserKategori.bind(null, cat.id, -1)}>
          <button disabled={isFirst} aria-label={`Naikkan ${cat.name}`} className="px-1 text-xs text-muted hover:text-brand-ink disabled:opacity-20">▲</button>
        </form>
        <form action={geserKategori.bind(null, cat.id, 1)}>
          <button disabled={isLast} aria-label={`Turunkan ${cat.name}`} className="px-1 text-xs text-muted hover:text-brand-ink disabled:opacity-20">▼</button>
        </form>
      </div>

      {edit ? (
        <form action={action} className="min-w-0 flex-1 space-y-3 rounded-lg bg-brand-paper p-3">
          <Notice state={state} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Nama</span>
              <input name="name" required defaultValue={cat.name} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Alamat URL (slug)</span>
              <input name="slug" defaultValue={cat.slug} className={inputClass} />
              <span className="mt-1 block text-xs text-muted">djsport.id/kategori/{cat.slug}</span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {bisaPindah && (
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs font-medium">Posisi:</span>
                <select name="parent_id" defaultValue={parentId ?? ""} className={`${inputClass} w-auto`}>
                  <option value="">Kategori utama (di navbar)</option>
                  {parents
                    .filter((p) => p.id !== cat.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>Sub-kategori dari {p.name}</option>
                    ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="show_in_nav" defaultChecked={cat.show_in_nav} className="h-4 w-4 accent-[var(--brand-orange)]" />
              {isSub ? "Tampilkan di dropdown" : "Tampilkan di navbar"}
            </label>
          </div>
          <div className="flex gap-2">
            <button disabled={pending} className="brand-gradient rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
            <button type="button" onClick={() => setEdit(false)} className="rounded-md px-4 py-2 text-sm hover:bg-white">Batal</button>
          </div>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className={`truncate ${isSub ? "font-medium" : "font-semibold"}`}>
              {isSub && <span className="mr-1 text-muted">↳</span>}
              {cat.name}
              {!cat.show_in_nav && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">disembunyikan</span>
              )}
            </p>
            <p className="text-xs text-muted">
              /kategori/{cat.slug} · {cat.produk} produk
              {!isSub && jumlahSub > 0 && ` · ${jumlahSub} sub-kategori`}
            </p>
          </div>
          <button onClick={() => setEdit(true)} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-ink">
            Ubah
          </button>
          <form action={hapusKategori.bind(null, cat.id)}>
            <button
              onClick={(e) => {
                if (!window.confirm(pesanHapus)) e.preventDefault();
              }}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export function CategoryManager({ tree }: { tree: AdminCategory[] }) {
  const parents = tree.map((c) => ({ id: c.id, name: c.name }));
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-5">
        <p className="mb-2 text-sm font-semibold">Tambah kategori utama (muncul di navbar)</p>
        <TambahForm parentId={null} placeholder="Contoh: Sepatu" label="Tambah" />
      </div>

      {tree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">Belum ada kategori.</div>
      ) : (
        tree.map((cat, i) => (
          <div key={cat.id} className="rounded-xl border border-line bg-white px-4">
            <Baris cat={cat} parentId={null} isFirst={i === 0} isLast={i === tree.length - 1} parents={parents} />
            {cat.children.length > 0 && (
              <div className="divide-y divide-line border-t border-line">
                {cat.children.map((sub, j) => (
                  <Baris key={sub.id} cat={sub} parentId={cat.id} isFirst={j === 0} isLast={j === cat.children.length - 1} parents={parents} />
                ))}
              </div>
            )}
            <div className="border-t border-line py-3 pl-8">
              <TambahForm parentId={cat.id} placeholder={`Sub-kategori ${cat.name}, misal: ${cat.name} Bola`} label="+ Dropdown" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
