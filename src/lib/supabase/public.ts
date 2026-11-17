import { createClient } from "@supabase/supabase-js";

// Klien untuk data publik (katalog) — tanpa sesi login, aman untuk di-cache.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
