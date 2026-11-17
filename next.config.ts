import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catatan: cacheComponents sengaja TIDAK dipakai. Fitur itu membuat halaman macet di runtime
  // Cloudflare Workers (OpenNext), tempat website ini di-hosting.
  images: {
    // Foto produk disimpan di Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "xkpajughgxsrfbyjvddv.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
