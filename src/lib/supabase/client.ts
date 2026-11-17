import { createBrowserClient } from "@supabase/ssr";

// Klien di browser (unggah foto produk & banner di admin).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
