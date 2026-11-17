"use client";

import { useActionState, useState } from "react";
import { simpanBanner } from "@/app/admin/banner/actions";
import { createClient } from "@/lib/supabase/client";
import { BannerSlide } from "@/components/hero-slider";
import { inputClass, Notice } from "@/components/admin/product-form";
import type { Banner } from "@/lib/catalog";

export type BannerValues = Banner & { is_active: boolean; starts_at: string | null; ends_at: string | null };

const MAKS_MB = 5;

/** ISO UTC -> "YYYY-MM-DDTHH:mm" dalam WIB untuk input datetime-local */
function isoKeWib(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function GambarInput({
  label,
  hint,
  name,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState<{ busy?: boolean; error?: string }>({});

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAKS_MB * 1024 * 1024) return setStatus({ error: `Ukuran file lebih dari ${MAKS_MB} MB.` });
    setStatus({ busy: true });
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) return setStatus({ error: `Gagal mengunggah: ${error.message}` });
    onChange(supabase.storage.from("banners").getPublicUrl(path).data.publicUrl);
    setStatus({});
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value ?? ""} />
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil
        <img src={value} alt="" className="mb-2 h-24 rounded-md border border-line object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-md bg-brand-ink px-3 py-2 text-sm font-semibold text-white">
          {status.busy ? "Mengunggah…" : value ? "Ganti gambar" : "Pilih gambar"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pilih} disabled={status.busy} className="sr-only" />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            Hapus gambar
          </button>
        )}
      </div>
      {status.error && <p className="mt-1 text-sm text-red-600">{status.error}</p>}
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </div>
  );
}

const SARAN_TAUTAN = ["/#produk"];

export function BannerForm({ banner, kategori = [] }: { banner?: BannerValues; kategori?: { name: string; slug: string }[] }) {
  const [state, action, pending] = useActionState(simpanBanner.bind(null, banner?.id ?? null), {});
  const [v, setV] = useState({
    eyebrow: banner?.eyebrow ?? "",
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    cta_label: banner?.cta_label ?? "",
    cta_url: banner?.cta_url ?? "",
    cta2_label: banner?.cta2_label ?? "",
    cta2_url: banner?.cta2_url ?? "",
    image_url: banner?.image_url ?? null,
    image_mobile_url: banner?.image_mobile_url ?? null,
    text_color: banner?.text_color ?? "terang",
  });
  const ubah = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [key]: e.target.value }));

  const pratinjau: Banner = {
    id: "pratinjau",
    eyebrow: v.eyebrow || null,
    title: v.title || "Judul banner",
    subtitle: v.subtitle || null,
    cta_label: v.cta_label || null,
    cta_url: v.cta_url || (v.cta_label ? "#" : null),
    cta2_label: v.cta2_label || null,
    cta2_url: v.cta2_url || (v.cta2_label ? "#" : null),
    image_url: v.image_url,
    image_mobile_url: v.image_mobile_url,
    text_color: v.text_color as Banner["text_color"],
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Pratinjau</p>
        <div className="pointer-events-none overflow-hidden rounded-xl border border-line">
          <BannerSlide banner={pratinjau} />
        </div>
      </div>

      <form action={action} className="space-y-5 rounded-xl border border-line bg-white p-5">
        <Notice state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tulisan kecil (opsional)" hint="Contoh: PROMO AKHIR TAHUN">
            <input name="eyebrow" value={v.eyebrow} onChange={ubah("eyebrow")} className={inputClass} />
          </Field>
          <Field label="Warna teks">
            <select name="text_color" value={v.text_color} onChange={ubah("text_color")} className={inputClass}>
              <option value="terang">Putih (untuk gambar gelap)</option>
              <option value="gelap">Hitam (untuk gambar terang)</option>
            </select>
          </Field>
        </div>

        <Field label="Judul" hint="Beri [kurung siku] pada kata yang ingin berwarna oranye. Contoh: Diskon [30%] semua jersey">
          <input name="title" required value={v.title} onChange={ubah("title")} className={inputClass} />
        </Field>

        <Field label="Keterangan (opsional)">
          <textarea name="subtitle" rows={2} value={v.subtitle} onChange={ubah("subtitle")} className={inputClass} />
        </Field>

        <datalist id="saran-tautan">
          {SARAN_TAUTAN.map((t) => <option key={t} value={t} />)}
          {kategori.map((k) => <option key={k.slug} value={`/kategori/${k.slug}`} label={`Kategori ${k.name}`} />)}
        </datalist>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tombol utama — tulisan">
            <input name="cta_label" value={v.cta_label} onChange={ubah("cta_label")} placeholder="Lihat Koleksi" className={inputClass} />
          </Field>
          <Field label="Tombol utama — tautan" hint="Halaman di toko ini diawali /, misalnya /#produk">
            <input name="cta_url" list="saran-tautan" value={v.cta_url} onChange={ubah("cta_url")} placeholder="/#produk" className={inputClass} />
          </Field>
          <Field label="Tombol kedua — tulisan (opsional)">
            <input name="cta2_label" value={v.cta2_label} onChange={ubah("cta2_label")} className={inputClass} />
          </Field>
          <Field label="Tombol kedua — tautan">
            <input name="cta2_url" list="saran-tautan" value={v.cta2_url} onChange={ubah("cta2_url")} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
          <GambarInput
            label="Gambar desktop (opsional)"
            hint="Lebar, disarankan 2400×1000 px. Tanpa gambar, banner memakai desain brand DJSport."
            name="image_url"
            value={v.image_url}
            onChange={(url) => setV((s) => ({ ...s, image_url: url }))}
          />
          <GambarInput
            label="Gambar HP (opsional)"
            hint="Tegak, disarankan 1080×1350 px. Bila kosong, HP memakai gambar desktop."
            name="image_mobile_url"
            value={v.image_mobile_url}
            onChange={(url) => setV((s) => ({ ...s, image_mobile_url: url }))}
          />
        </div>

        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Field label="Mulai tayang (opsional, WIB)" hint="Kosongkan agar langsung tayang.">
            <input name="starts_at" type="datetime-local" defaultValue={isoKeWib(banner?.starts_at ?? null)} className={inputClass} />
          </Field>
          <Field label="Selesai tayang (opsional, WIB)" hint="Kosongkan agar tayang terus. Cocok untuk promo berbatas waktu.">
            <input name="ends_at" type="datetime-local" defaultValue={isoKeWib(banner?.ends_at ?? null)} className={inputClass} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={banner?.is_active ?? true} className="h-4 w-4 accent-[var(--brand-orange)]" />
          Aktif (tampilkan di halaman depan)
        </label>

        <button disabled={pending} className="brand-gradient rounded-md px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Menyimpan…" : banner ? "Simpan perubahan" : "Simpan banner"}
        </button>
      </form>
    </div>
  );
}
