import { redirect } from "next/navigation";

/** Halaman ini hanya mengalihkan, jadi tidak perlu divalidasi sebagai navigasi instan. */
export const instant = false;

export default function AdminHome() {
  redirect("/admin/produk");
}
