import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "member" | "admin";
};

/** Member yang sedang login, atau null. Memverifikasi sesi ke server Supabase. */
export async function getMember(): Promise<Member | null> {
  // Sesi login selalu dihitung saat ada permintaan (Supabase membaca jam untuk cek token)
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    role: (profile?.role as Member["role"]) ?? "member",
  };
}
