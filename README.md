# 📍 Sistem Absensi Pintar (Google Apps Script)

Aplikasi absensi berbasis web (Web App) menggunakan Google Apps Script, Google Sheets, dan Google Drive. Mendukung fitur **GPS Geolocation** dan **Kamera Selfie** dengan antarmuka Modern Glassmorphism.

## ✨ Fitur Utama
* **Geolocation Lock:** Hanya bisa absen di radius tertentu dari sekolah/kantor.
* **Selfie Capture:** Wajib ambil foto saat absen.
* **Modern UI:** Desain responsif, mobile-first, dan efek glassmorphism.
* **Realtime Database:** Data langsung masuk ke Google Sheets.
* **Photo Storage:** Foto tersimpan otomatis di Google Drive.

## 🛠️ Teknologi
* **Backend:** Google Apps Script (JavaScript Cloud).
* **Database:** Google Sheets.
* **Storage:** Google Drive.
* **Frontend:** HTML5, CSS3 (Custom), JavaScript (Vanilla).

## 🚀 Cara Instalasi

1.  **Buat Google Sheet Baru**
    * Beri nama sheet (tab): `SISWA` dan `ABSENSI`.
    * Isi sheet `SISWA` dengan header: `NIS`, `Nama`, `Kelas`, `PIN`.
    
2.  **Buat Script Baru**
    * Buka `Extensions` > `Apps Script`.
    * Copy file `Code.js` ke `Code.gs`.
    * Buat file HTML: `index.html`, `style.html`, `script.html` dan copy kodenya.

3.  **Konfigurasi**
    * Buka `Code.gs`.
    * Ganti `ID_FOLDER_FOTO` dengan ID Folder Google Drive Anda.
    * Ganti `LAT_SEKOLAH` dan `LNG_SEKOLAH` dengan koordinat lokasi Anda.

4.  **Deploy**
    * Klik `Deploy` > `New Deployment`.
    * Pilih type: `Web App`.
    * Execute as: `Me`.
    * Who has access: `Anyone`.
    * Copy URL yang muncul.

## 📄 Lisensi
Project ini open-source di bawah lisensi [MIT](LICENSE).
