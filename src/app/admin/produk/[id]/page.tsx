
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { ProductForm, inputClass } from "@/components/admin/product-form";
import { VariantGenerator } from "@/components/admin/variant-generator";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { hapusFoto, hapusProduk, hapusVarian, jadikanFotoUtama, simpanVarian } from "../actions";

export const metadata: Metadata = { title: "Ubah Produk — Admin DJSport" };

type Variant = {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string;
  sku: string | null;
  price: number | null;
  stock: number;
  is_active: boolean;
};

const URUTAN_UKURAN = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
const urutUkuran = (a: string, b: string) => {
  const ia = URUTAN_UKURAN.indexOf(a), ib = URUTAN_UKURAN.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  return a.localeCompare(b, "id", { numeric: true });
};

export default async function UbahProdukPage({ params, searchParams }: PageProps<"/admin/produk/[id]">) {
  const { id } = await params;
  const { baru } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: categories }, { data: variants }, { data: images }] = await Promise.all([
    supabase.from("products").select("id, name, slug, description, category_id, base_price, is_active").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, parent_id").order("sort_order").order("name"),
    supabase.from("product_variants").select("id, color_name, color_hex, size, sku, price, stock, is_active").eq("product_id", id),
    supabase.from("product_images").select("id, url, color_name, sort_order").eq("product_id", id).order("sort_order"),
  ]);
  if (!product) notFound();

  const varian = ((variants ?? []) as Variant[]).sort(
    (a, b) => a.color_name.localeCompare(b.color_name, "id") || urutUkuran(a.size, b.size),
  );
  const warna = [...new Set(varian.map((v) => v.color_name))];
  const totalStok = varian.reduce((n, v) => n + v.stock, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/produk" className="text-sm text-muted hover:text-brand-orange">← Semua produk</Link>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase">{product.name}</h1>
        {baru && (
          <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Produk dibuat. Sekarang isi varian warna × ukuran dan unggah fotonya.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold uppercase">1. Info produk</h2>
        <ProductForm product={product} categories={categories ?? []} />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase">2. Varian & stok</h2>
          <p className="text-sm text-muted">{varian.length} varian · total stok {totalStok}</p>
        </div>

        {varian.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[640px] text-sm">
              <div className="grid grid-cols-[1.4fr_0.6fr_1.4fr_1fr_0.8fr_0.6fr_auto] gap-2 border-b border-line pb-2 text-xs font-semibold text-muted">
                <span>Warna</span><span>Ukuran</span><span>SKU</span><span>Harga khusus</span><span>Stok</span><span>Aktif</span><span />
              </div>
              {varian.map((v) => {
                const formId = `v-${v.id}`;
                return (
                  <div key={v.id} className="grid grid-cols-[1.4fr_0.6fr_1.4fr_1fr_0.8fr_0.6fr_auto] items-center gap-2 border-b border-line py-2 last:border-0">
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: v.color_hex ?? "transparent" }} />
                      {v.color_name}
                    </span>
                    <span className="font-semibold">{v.size}</span>
                    <input form={formId} name="sku" defaultValue={v.sku ?? ""} className={inputClass} />
                    <input form={formId} name="price" inputMode="numeric" placeholder="—" defaultValue={v.price?.toLocaleString("id-ID") ?? ""} className={inputClass} />
                    <input form={formId} name="stock" type="number" min={0} defaultValue={v.stock} className={inputClass} />
                    <input form={formId} name="is_active" type="checkbox" defaultChecked={v.is_active} className="h-4 w-4 accent-[var(--brand-orange)]" />
                    <span className="flex gap-1">
                      <form id={formId} action={simpanVarian.bind(null, id, v.id)}>
                        <button className="rounded-md bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white">Simpan</button>
                      </form>
                      <form action={hapusVarian.bind(null, id, v.id)}>
                        <button className="rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50" aria-label={`Hapus varian ${v.color_name} ${v.size}`}>Hapus</button>
                      </form>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <VariantGenerator productId={id} hasVariants={varian.length > 0} />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase">3. Foto</h2>
        {images && images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((img, i) => (
              <div key={img.id} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-brand-paper">
                  <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-orange px-1.5 py-0.5 text-[10px] font-bold text-white">UTAMA</span>}
                </div>
                <p className="mt-1 truncate text-xs text-muted">{img.color_name ?? "Semua warna"}</p>
                <div className="mt-1 flex gap-1">
                  {i !== 0 && (
                    <form action={jadikanFotoUtama.bind(null, id, img.id)}>
                      <button className="text-xs font-semibold hover:text-brand-orange">Jadikan utama</button>
                    </form>
                  )}
                  <form action={hapusFoto.bind(null, id, img.id)} className="ml-auto">
                    <button className="text-xs text-red-600">Hapus</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Belum ada foto.</p>
        )}
        <ImageUploader productId={id} colors={warna} />
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase text-red-700">Hapus produk</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          Menghapus produk beserta semua varian dan fotonya. Tidak bisa dibatalkan. Untuk sementara tidak dijual, cukup hilangkan centang &ldquo;Tampilkan di toko&rdquo;.
        </p>
        <form action={hapusProduk.bind(null, id)}>
          <ConfirmButton
            message={`Hapus "${product.name}" beserta semua varian dan fotonya? Ini tidak bisa dibatalkan.`}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Hapus produk ini
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
