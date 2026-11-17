"use client";

import { useActionState } from "react";
import { simpanPengaturan } from "@/app/admin/pengaturan/actions";
import { inputClass, Notice } from "@/components/admin/product-form";

export function SettingsForm({ nomor, greeting }: { nomor: string | null; greeting: string }) {
  const [state, action, pending] = useActionState(simpanPengaturan, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line bg-white p-5">
      <Notice state={state} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nomor WhatsApp tim sales</span>
        <input name="whatsapp_number" inputMode="tel" defaultValue={nomor ? `+${nomor}` : ""} placeholder="081234567890" className={inputClass} />
        <span className="mt-1 block text-xs text-muted">
          Tombol &ldquo;Pesan via WhatsApp&rdquo; di halaman produk mengarah ke nomor ini. Kosongkan untuk menyembunyikan tombol.
        </span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Kalimat pembuka pesan</span>
        <input name="whatsapp_greeting" required defaultValue={greeting} className={inputClass} />
        <span className="mt-1 block text-xs text-muted">Nama produk, warna, ukuran, harga, dan tautan produk ditambahkan otomatis di bawahnya.</span>
      </label>
      <button disabled={pending} className="brand-gradient rounded-md px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan pengaturan"}
      </button>
    </form>
  );
}
