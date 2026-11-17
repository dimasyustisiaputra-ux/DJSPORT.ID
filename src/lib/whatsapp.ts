// Fungsi WhatsApp murni (tanpa kode server), aman dipakai di komponen browser maupun server.

export type SiteSettings = { whatsappNumber: string | null; whatsappGreeting: string };

/** "0812-3456 7890" / "+62 812..." / "62812..." -> "62812..." (format wa.me) */
export function normalisasiNomorWa(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (d.startsWith("8")) d = "62" + d;
  return /^628\d{7,12}$/.test(d) ? d : null;
}

export function linkWhatsApp(nomor: string, pesan: string) {
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}
