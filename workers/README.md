# Cloudflare Worker: HTML Fetcher

Worker khusus untuk eDM Helper Layout Checker agar bisa mengambil remote HTML dari `mail.hsbc.com.hk` tanpa terkena CORS di browser.

## Arsitektur

```
GitHub Pages frontend  →  Cloudflare Worker  →  mail.hsbc.com.hk
         ↑                      ↓
    CORS response         HTML body
```

## File

- `html-fetcher.js` — source code Worker (ES modules).

## Deployment

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigasi ke **Workers & Pages** → **Create application**.
3. Pilih **Create Worker**.
4. Beri nama, misalnya `html-fetcher`.
5. Hapus default code, paste isi `html-fetcher.js`.
6. Klik **Deploy**.
7. Catat URL Worker, contoh: `https://html-fetcher.your-account.workers.dev`.

## Konfigurasi Frontend

Buka `js/pages-layout-checker.js`, ganti placeholder:

```js
const HTML_FETCHER_WORKER_URL = 'https://html-fetcher.your-account.workers.dev';
```

## Konfigurasi Worker

Sesuaikan konstanta `CONFIG` di `html-fetcher.js` jika diperlukan:

- `allowedOrigins`: daftar origin frontend yang diizinkan.
  Default sudah mencakup:
  - `https://budife.github.io`
  - `http://localhost:5500`
  - `http://127.0.0.1:5500`
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

- `allowedTargetHost`: hanya `mail.hsbc.com.hk` yang boleh di-fetch.
- `maxResponseBytes`: batas ukuran response (default 10 MB).

## Cara Kerja

1. Frontend kirim request ke Worker dengan query param `url`.
2. Worker validasi origin request dan host target.
3. Worker fetch URL target secara server-side.
4. Worker kembalikan HTML dengan header CORS.
5. Frontend menerima HTML sebagai `text/html` dan menampilkannya di sandboxed iframe.

## Keamanan

- Hanya host `mail.hsbc.com.hk` yang diizinkan sebagai target.
- Hanya origin yang terdaftar yang bisa mengakses response.
- Preview iframe di frontend menggunakan `sandbox="allow-same-origin allow-popups"` sehingga script dari email tidak dieksekusi.

## Testing

Setelah deploy, coba buka:

```
https://html-fetcher.your-account.workers.dev?url=https://mail.hsbc.com.hk/id/emailblast/MKT/2026/1508-20260211-BI_b/1508-PIL-Regular.html
```

Jika berhasil, akan muncul source HTML dari URL tersebut.
