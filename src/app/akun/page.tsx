import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/auth";
import { keluar } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Akun Saya — DJSport" };

async function AkunContent() {
  const member = await getMember();
  if (!member) redirect("/masuk?lanjut=/akun");

  return (
    <>
      <div className="rounded-xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="brand-gradient flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-bold text-white">
            {(member.fullName ?? member.email).charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold">{member.fullName ?? "-"}</p>
            <p className="text-sm text-muted">{member.email}</p>
          </div>
          {member.role === "admin" && (
            <span className="ml-auto rounded-full bg-brand-ink px-3 py-1 text-xs font-semibold text-white">Admin</span>
          )}
        </div>
        <dl className="mt-6 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Nomor HP</dt>
            <dd className="font-medium">{member.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">Peran</dt>
            <dd className="font-medium">{member.role === "admin" ? "Admin" : "Pengguna"}</dd>
          </div>
        </dl>
      </div>

      {member.role === "admin" && (
        <Link href="/admin" className="brand-gradient mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white">
          Buka halaman Admin →
        </Link>
      )}

      <form action={keluar} className="mt-8">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-red-300 hover:text-red-700">
          Keluar
        </button>
      </form>
    </>
  );
}

export default function AkunPage() {
  return (
    <main className="flex-1 bg-brand-paper">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl font-bold uppercase">Akun Saya</h1>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white" />}>
          <AkunContent />
        </Suspense>
      </div>
    </main>
  );
}
