import { getActiveBanners, getCategories, getProducts, type Banner } from "@/lib/catalog";
import { HeroSlider } from "@/components/hero-slider";
import { ProductGrid } from "@/components/product-grid";

// Dipakai bila belum ada banner aktif sama sekali
const BANNER_CADANGAN: Banner = {
  id: "cadangan",
  eyebrow: "Pricelist DJSport",
  title: "Gear olahraga [tanpa kompromi]",
  subtitle: "Lihat koleksi dan harga terbaru DJSport. Hubungi tim sales kami via WhatsApp untuk pemesanan.",
  cta_label: "Lihat Produk",
  cta_url: "/#produk",
  cta2_label: null,
  cta2_url: null,
  image_url: null,
  image_mobile_url: null,
  text_color: "terang",
};

export default async function Home() {
  const [categories, banners, products] = await Promise.all([getCategories(), getActiveBanners(), getProducts()]);
  return (
    <main className="flex-1">
      <h1 className="sr-only">DJSport — Perlengkapan Olahraga</h1>
      {/* Banner diatur dari menu Admin → Banner */}
      <HeroSlider banners={banners.length ? banners : [BANNER_CADANGAN]} />

      <section id="produk" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        {/* Produk diatur dari menu Admin → Produk */}
        <ProductGrid products={products} categories={categories} />
      </section>
    </main>
  );
}
