import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/catalog";
import { getMember } from "@/lib/auth";
import { MobileMenu } from "@/components/mobile-menu";
import { CartButton } from "@/components/cart-button";

/** Kategori yang ditampilkan di navbar (diatur di Admin → Kategori). */
async function navCategories() {
  return (await getCategories()).filter((c) => c.show_in_nav);
}

async function CategoryNav() {
  const categories = await navCategories();
  return (
    <nav className="hidden h-full items-stretch gap-1 text-sm font-medium md:flex" aria-label="Kategori">
      {categories.map((c) => {
        const subs = c.children.filter((s) => s.show_in_nav);
        return (
          <div key={c.id} className="group relative flex items-center">
            <Link
              href={`/kategori/${c.slug}`}
              className="flex items-center gap-1 rounded-md px-3 py-2 hover:text-brand-orange group-focus-within:text-brand-orange"
              aria-haspopup={subs.length > 0 ? "true" : undefined}
            >
              {c.name}
              {subs.length > 0 && (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="transition-transform group-hover:rotate-180">
                  <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </Link>
            {subs.length > 0 && (
              // Dropdown: muncul saat disorot mouse atau difokus keyboard
              <div className="invisible absolute left-0 top-full z-30 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="min-w-48 overflow-hidden rounded-lg border border-line bg-white py-2 shadow-lg">
                  {subs.map((s) => (
                    <Link key={s.id} href={`/kategori/${s.slug}`} className="block px-4 py-2 hover:bg-brand-paper hover:text-brand-orange">
                      {s.name}
                    </Link>
                  ))}
                  <Link href={`/kategori/${c.slug}`} className="mt-1 block border-t border-line px-4 pb-1 pt-2 text-xs font-semibold text-brand-orange">
                    Lihat semua {c.name} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

async function MobileCategoryMenu() {
  return <MobileMenu categories={await navCategories()} />;
}

async function UserNav() {
  const member = await getMember();
  // Pengunjung umum tidak melihat tombol login; tim admin masuk lewat /masuk.
  if (!member) return null;
  const nama = member.fullName?.split(" ")[0] || "Akun";
  return (
    <>
      {member.role === "admin" && (
        <Link href="/admin" className="rounded-md bg-brand-ink px-3 py-2 text-sm font-semibold text-white">Admin</Link>
      )}
      <Link href="/akun" aria-label={`Akun ${nama}`} className="flex items-center gap-2 rounded-md border border-line p-1.5 text-sm font-semibold hover:border-brand-ink sm:px-3">
        <span className="brand-gradient flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
          {nama.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{nama}</span>
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    // Header ikut tergulir bersama halaman (tidak menempel di atas). z-20 tetap ada agar dropdown kategori tampil di atas konten.
    <header className="relative z-20 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:gap-4">
        <div className="flex items-center gap-1">
          <Suspense fallback={<div className="h-10 w-10 md:hidden" />}>
            <MobileCategoryMenu />
          </Suspense>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo.png" alt="DJSport" width={58} height={40} priority />
          </Link>
        </div>
        <Suspense>
          <CategoryNav />
        </Suspense>
        <div className="flex items-center gap-2">
          <CartButton />
          <Suspense>
            <UserNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-black text-white/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm">
        <span className="font-display font-bold uppercase tracking-wider text-white">DJSport</span>
        <span>© 2026 djsport.id</span>
      </div>
    </footer>
  );
}
