import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-header";

// Satu font untuk seluruh situs. Poppins tidak punya versi "variable",
// jadi ketebalan yang dipakai disebutkan satu per satu (800 untuk judul besar).
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "DJSport — Perlengkapan Olahraga",
  description: "Katalog dan pricelist perlengkapan olahraga DJSport. Hubungi tim sales kami via WhatsApp untuk pemesanan.",
  icons: { icon: "/brand/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
