"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { catatFoto } from "@/app/admin/produk/actions";
import { inputClass } from "@/components/admin/product-form";

const MAKS_MB = 5;

export function ImageUploader({ productId, colors }: { productId: string; colors: string[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<{ busy?: boolean; error?: string; ok?: string }>({});

  async function upload() {
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) return setStatus({ error: "Pilih foto terlebih dahulu." });
    const terlaluBesar = files.find((f) => f.size > MAKS_MB * 1024 * 1024);
    if (terlaluBesar) return setStatus({ error: `${terlaluBesar.name} lebih dari ${MAKS_MB} MB.` });

    setStatus({ busy: true });
    const supabase = createClient();
    const hasil: { url: string; color_name: string | null }[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) return setStatus({ error: `Gagal mengunggah ${file.name}: ${error.message}` });
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      hasil.push({ url: data.publicUrl, color_name: color || null });
    }
    const res = await catatFoto(productId, hasil);
    if (res.error) return setStatus({ error: res.error });
    if (fileRef.current) fileRef.current.value = "";
    setStatus({ ok: `${hasil.length} foto diunggah.` });
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-lg bg-brand-paper p-4">
      <p className="text-sm font-semibold">Unggah foto</p>
      {status.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{status.error}</p>}
      {status.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{status.ok}</p>}
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <select value={color} onChange={(e) => setColor(e.target.value)} className={inputClass}>
          <option value="">Semua warna</option>
          {colors.map((c) => (
            <option key={c} value={c}>Warna: {c}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted">JPG, PNG, atau WEBP, maksimal {MAKS_MB} MB per foto. Disarankan rasio 4:5 (misal 1200×1500).</p>
      <button
        type="button"
        onClick={upload}
        disabled={status.busy}
        className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status.busy ? "Mengunggah…" : "Unggah"}
      </button>
    </div>
  );
}
