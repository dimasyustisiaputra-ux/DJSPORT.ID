import Image from "next/image";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-paper px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-sm md:p-8">
        <Image src="/brand/logo.png" alt="DJSport" width={72} height={50} className="mx-auto mb-4" />
        <h1 className="text-center font-display text-2xl font-bold uppercase">{title}</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
