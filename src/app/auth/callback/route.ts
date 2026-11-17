import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tujuan tautan konfirmasi email: tukar kode menjadi sesi login.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const lanjut = searchParams.get("lanjut") ?? "/akun";
  const tujuan = lanjut.startsWith("/") && !lanjut.startsWith("//") ? lanjut : "/akun";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${tujuan}`);
  }
  return NextResponse.redirect(`${origin}/masuk?galat=konfirmasi`);
}
