// Konfigurasi adaptor OpenNext untuk menjalankan Next.js di Cloudflare Workers.
// Versi awal tanpa cache tambahan (KV/R2): setiap halaman mengambil data terbaru dari Supabase,
// sehingga perubahan dari halaman admin langsung tampil. Cache bisa ditambahkan nanti bila trafik besar.
// Panduan: https://opennext.js.org/cloudflare/caching
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
