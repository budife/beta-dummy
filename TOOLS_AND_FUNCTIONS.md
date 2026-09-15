# eDM Helper - Daftar Tools dan Fungsi

## Overview
eDM Helper is a collection of useful tools for email marketing and everyday productivity. All tools are free and easy to use.

---

## 📚 Daftar Tools

### 1. **Bookmarklet** 
- **File:** `bookmarklet.html`
- **Icon:** 📖
- **Purpose:** Browser tools for quick actions and shortcuts
- **Fitur:**
  - Drag-and-drop bookmarklets for instant productivity
  - Tools that run directly in the browser
  - Tidak perlu instalasi tambahan

### 2. **Campaign Counter**
- **File:** `campaign-counter.html`
- **Icon:** 📈
- **Fungsi:** Mengelola nomor Campaign ID dari export Monday secara lokal
- **Fitur:**
  - Import XLSX langsung di browser
  - Merge / Replace modes for XLSX data
  - Ringkasan campaign, ID unik, reblast, dan baris gagal
  - Tab Regular hingga 9000 Series
  - Campaign names, blast dates, and reblast details in click popups
  - Export JSON sebagai backup lokal
  - Penyimpanan IndexedDB lokal dan Reset Local Data
  - Bookmarklet Monday memiliki database lokal terpisah

### 3. **Config eDM**
- **File:** `config.html`
- **Icon:** ⚙️
- **Fungsi:** Konfigurasi dan manage email marketing settings
- **Fitur:**
  - Advanced options
  - Template configuration
  - SMTP settings
  - Custom parameters

### 4. **WFH Tracker**
- **File:** `wfh-tracker.html`
- **Icon:** 📅
- **Fungsi:** Track dan manage work from home days
- **Fitur:**
  - Calendar integration
  - Daily logging
  - Summary reports
  - Export timesheet

### 5. **Layout Checker**
- **File:** `layout-checker.html`
- **Icon:** 📏
- **Fungsi:** Cek kompatibilitas layout email
- **Fitur:**
  - Cross-email client testing
  - Device compatibility check
  - Responsive design testing
  - Screenshot comparison

---

## 🛠️ Fitur Utama Platform

### Performance Optimized
- Flat design for optimal performance on low-spec laptops
- No heavy animations
- CSS minimalis dan efisien

### Design System
- Warna tema: Merah (#F18C8E) dan Putih
- Clean, modern flat design
- Responsive across devices

### Accessibility
- Semua tools memiliki proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

---

## 📁 Struktur File

```
Beta/
├── index.html                 # Homepage
├── bookmarklet.html          # Bookmarklet tool
├── campaign-counter.html     # Campaign counter
├── config.html               # eDM configuration
├── wfh-tracker.html          # WFH tracker
├── layout-checker.html       # Layout tester
├── css/                      # Stylesheets
│   ├── base.css             # Base styles
│   ├── layout.css           # Layout components
│   ├── theme.css            # Color scheme
│   ├── pages-index.css      # Homepage styles
│   └── components/          # Component styles
├── js/                       # JavaScript files
│   ├── nav.js              # Navigation
│   ├── pages-index.js      # Homepage logic
│   └── [tool-specific].js  # Individual tool scripts
└── example of database/      # Sample database files
```

---

## 🔧 Technologies Used

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Icons:** Font Awesome 6.5.2
- **Design:** Custom CSS with flat design principles
- **Performance:** Optimized for low-spec devices

---

## 💡 Tips Penggunaan

1. **Bookmarklet** - Drag bookmarklets to the browser toolbar for quick access
2. **Campaign Counter** - Import Monday XLSX files to review used numbers and the next ID
4. **Layout Checker** - Test layouts across email clients for compatibility

---

## 🚀 Cara Menggunakan

1. Buka `index.html` di browser
2. Click the desired tool
3. Follow instruksi di setiap halaman
4. Semua data tersimpan locally (tidak ada server)

---

## 📝 Catatan

- Semua tools berjalan client-side (tidak perlu internet)
- Data aman karena tidak terupload ke server
- Dapat digunakan offline setelah di-download
- Free forever, no hidden costs

---

*Last Updated: 2025*
