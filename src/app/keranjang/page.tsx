import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = { title: "Keranjang — DJSport", robots: { index: false } };

async function Isi() {
  const settings = await getSiteSettings();
  // Kunci situs Turnstile (publik) dibaca saat halaman dibuka, jadi bisa diganti tanpa build ulang
  return <CartPage whatsappNumber={settings.whatsappNumber} turnstileSiteKey={process.env.TURNSTILE_SITE_KEY || null} />;
}

export default function KeranjangPage() {
  return (
    <main className="flex-1 bg-brand-paper">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl font-bold uppercase">Keranjang</h1>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white" />}>
          <Isi />
        </Suspense>
      </div>
    </main>
  );
}
