# AstroView

AstroView adalah aplikasi web sederhana yang menampilkan data dan gambar dari berbagai layanan API NASA, seperti:

- **Astronomy Picture of the Day (APOD)** – foto astronomi pilihan NASA setiap hari.
- **NASA Image and Video Library** – pencarian gambar luar angkasa dengan kata kunci.
- **EONET (Earth Observatory Natural Event Tracker)** – informasi kejadian alam yang sedang aktif (kebakaran hutan, badai, dsb).

Proyek ini dibuat sebagai **Final Project** untuk mata kuliah **Pemrograman Jaringan**.

---

## Fitur Utama

### 1. Halaman Beranda (Home)

- Menampilkan **banner** bertema luar angkasa.
- Menyediakan **navigasi cepat** ke modul:
  - `Events` – kejadian alam.
  - `Images` – pencarian gambar NASA.
- Menampilkan **APOD hari ini** lengkap dengan:
  - Gambar / link media,
  - Judul,
  - Tanggal (dengan mekanisme fallback ke hari sebelumnya jika APOD hari ini belum tersedia),
  - Deskripsi singkat.
- Form **subscribe** untuk menerima APOD harian melalui email.
- **Live bar pengunjung**:
  - Menampilkan jumlah pengunjung yang sedang online,
  - Menampilkan total kunjungan (disimpan di MongoDB Atlas, tidak hilang saat server direstart).

### 2. Modul Events (Natural Events – EONET)

- Mengambil data kejadian alam aktif dari **NASA EONET API**.
- Filter rentang hari (3, 7, 14, 30 hari terakhir).
- Menampilkan daftar event dalam bentuk **grid card**:
  - Kategori kejadian (misalnya Wildfires, Severe Storms),
  - Tanggal terbaru kejadian,
  - Judul kejadian,
  - Ringkasan deskripsi,
  - Koordinat lokasi (lintang & bujur),
  - Tautan sumber resmi (Source) bila tersedia.

### 3. Modul Images (NASA Image and Video Library)

- Fitur **pencarian gambar** berdasarkan kata kunci (misal: _nebula_, _Saturn_, _galaxy_).
- Hasil ditampilkan dalam bentuk **kartu gambar**:
  - Thumbnail,
  - Judul,
  - Ringkasan deskripsi.
- **Paginasi** sederhana (Prev/Next + nomor halaman).
- **Modal detail**:
  - Menampilkan gambar yang dipilih dalam ukuran lebih besar,
  - Menampilkan deskripsi lengkap dari NASA.

### 4. Email APOD Harian

- Menggunakan **SMTP (Gmail)** dan `nodemailer`.
- Pengguna dapat mendaftar email pada form di beranda.
- Server dapat:
  - Mengirim email APOD secara manual lewat endpoint khusus,
  - Menjadwalkan pengiriman otomatis menggunakan **cron job** setiap hari pukul 07.00 (waktu server).

### 5. Statistik Pengunjung (Socket.IO + MongoDB)

- Menggunakan **Socket.IO** untuk menghitung:
  - Jumlah koneksi aktif (pengunjung online),
  - Total kunjungan (disimpan di koleksi `Statistik` MongoDB).
- Logika kunjungan:
  - Setiap tab/sesi browser yang baru membuka situs mengirim event `firstVisit`,
  - Total kunjungan akan bertambah 1,
  - Data total kunjungan tidak hilang jika server di-restart karena disimpan di MongoDB Atlas.

---

## Teknologi yang Digunakan

- **Backend**
  - Node.js
  - Express
  - Socket.IO
  - node-cron
  - Axios
  - Nodemailer
- **Database**
  - MongoDB Atlas (via Mongoose)
- **Frontend**
  - HTML5
  - Tailwind CSS (CDN)
  - JavaScript (Vanilla)
- **API Eksternal**
  - [NASA APOD](https://api.nasa.gov/)
  - [NASA Image and Video Library](https://images.nasa.gov/)
  - [NASA EONET](https://eonet.gsfc.nasa.gov/)

---

## Instalasi & Konfigurasi

### 1. Prasyarat

- Node.js (disarankan versi LTS terbaru)
- npm
- Akun **MongoDB Atlas** atau MongoDB lokal
- Akun Gmail (untuk SMTP) – gunakan **App Password**, bukan password biasa

### 2. Kloning Repositori

```bash
git clone https://github.com/Blibiiy/AstroView.git
cd AstroView
```

### 3. Instal Dependensi

```bash
npm install
```

### 4. Konfigurasi Environment (.env)

Buat file `.env` di root proyek berdasarkan contoh berikut:

```env
PORT=4000

# NASA API
NASA_API_KEY=ISI_DENGAN_KUNCI_API_NASA_ANDA

# MongoDB (direkomendasikan Atlas)
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxx.mongodb.net/astroview?retryWrites=true&w=majority

# SMTP / Email (contoh Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alamat_email_anda@gmail.com
SMTP_PASS=APP_PASSWORD_GMAIL_ANDA
EMAIL_FROM="AstroView <alamat_email_anda@gmail.com>"
```

> Pastikan `.env` ditambahkan ke `.gitignore` agar tidak ter‑commit ke Git.

### 5. Menjalankan Aplikasi di Lokal

```bash
npm start
```

Server AstroView akan berjalan di:

```text
http://localhost:4000
```

- Buka `http://localhost:4000/` untuk halaman utama.
- `http://localhost:4000/images.html` untuk modul Images.
- `http://localhost:4000/events.html` untuk modul Events.

---

## Penggunaan

### Halaman Utama

1. Buka `http://localhost:4000/`.
2. Lihat **APOD hari ini**.
3. Jika ingin menerima APOD lewat email:
   - Isi form email di bagian “Kirim APOD ke email”.
   - Klik **Subscribe**.
4. Statistik pengunjung akan tampil di bagian bawah:
   - “X sekarang online” → jumlah tab aktif.
   - “Y total kunjungan” → akumulasi dari semua sesi, disimpan di MongoDB.

### Modul Events

1. Buka `http://localhost:4000/events.html`.
2. Pilih rentang hari (3, 7, 14, 30 hari).
3. Klik **Refresh** untuk memuat data.
4. Klik tautan **Source** pada tiap card untuk melihat informasi lebih detail di situs sumber.

### Modul Images

1. Buka `http://localhost:4000/images.html`.
2. Masukkan kata kunci (misalnya: `nebula`, `galaxy`, `Mars`).
3. Klik tombol **Cari**.
4. Gunakan tombol **Prev/Next** untuk berpindah halaman hasil.
5. Klik tombol **Detail** pada salah satu card untuk membuka modal gambar dengan deskripsi lengkap.

---

## Struktur Proyek

Struktur direktori secara umum:

```text
AstroView/
├─ models/
│  ├─ db.js               # Koneksi MongoDB (Mongoose)
│  ├─ Stats.js            # Model Statistik (jumlah kunjungan)
│  ├─ Subscriber.js       # Model Pelanggan (email subscriber APOD)
│  └─ MissionPhoto.js     # Model Foto Misi (opsional / pengembangan)
│
├─ services/
│  ├─ nasaService.js      # Layanan untuk memanggil API NASA (APOD, Images, EONET)
│  └─ emailService.js     # Layanan pengiriman email (Nodemailer)
│
├─ public/
│  ├─ index.html          # Halaman utama AstroView
│  ├─ images.html         # Halaman modul gambar NASA
│  ├─ events.html         # Halaman modul kejadian alam (EONET)
│  ├─ home.js             # Logika frontend untuk beranda (APOD, subscribe, visitor stats)
│  ├─ images.js           # Logika pencarian dan tampilan gambar
│  ├─ events.js           # Logika pengambilan dan tampilan event EONET
│  ├─ app.js              # Script lama (chat / demo awal) – opsional
│  ├─ style.css           # (Jika masih digunakan) gaya tambahan non‑Tailwind
│  ├─ space.png           # Gambar banner halaman utama
│  ├─ Events.jpg          # Gambar ilustrasi kartu "Events" di home
│  └─ ...                 # Aset statis lain (gambar dll.)
│
├─ server.js              # Server Express utama + Socket.IO + cron APOD
├─ package.json           # Konfigurasi proyek Node.js (script, dependencies)
└─ README.md              # Dokumentasi proyek (file ini)
```

---

## Lisensi

Proyek ini dirilis dengan lisensi **MIT License**.

Artinya:

- Anda bebas untuk menggunakan, menyalin, memodifikasi, dan mendistribusikan proyek ini,
- Dengan syarat tetap mencantumkan **copyright dan lisensi** asli,
- Tanpa jaminan apa pun (digunakan apa adanya).

Isi lisensi secara ringkas terdapat di bawah:

```text
MIT License

Copyright (c) 2025 AstroView

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell     
copies of the Software, and to permit persons to whom the Software is         
furnished to do so, subject to the following conditions:                      

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.                               

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR    
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,      
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE   
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER        
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
```

---

## Pengembang

**Pengembang 1**

- Nama  : Muhammad Isra Al Fattah  
- NIM   : 23343045  
- GitHub: [Blibiiy](https://github.com/Blibiiy)

**Pengembang 2**

- Nama  : Labib Althaf  
- NIM   : 23343042  
- GitHub: _[akan ditambahkan manual]_  

---

Jika Anda menemukan bug, memiliki saran fitur, atau ingin mengembangkan AstroView lebih lanjut (misalnya menambah modul baru seperti data cuaca ruang angkasa atau misi rover Mars), silakan buat _issue_ atau _pull request_ di repositori ini. Kontribusi sangat terbuka. 😊
