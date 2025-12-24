// Memuat konfigurasi lingkungan dari file .env
require('dotenv').config();

// Memuat library yang dibutuhkan untuk server HTTP dan WebSocket
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Memuat fungsi-fungsi layanan NASA
const {
  ambilApod,
  ambilApodDenganCadangan,
  formatTanggal,
  cariGambarNasa,
  ambilKejadianEonetTerbaru,
} = require('./services/nasaService');

// Koneksi basis data dan model yang digunakan
const { hubungkanBasisData } = require('./models/db');
const Pelanggan = require('./models/Subscriber');
const { kirimEmailApod } = require('./services/emailService');
const { ambilAtauBuatDokumenStatistik } = require('./models/Stats');

// Port server diambil dari variabel lingkungan atau default 3000
const PORT = process.env.PORT || 3000;

// Fungsi utama untuk memulai server AstroView
async function mulaiServer() {
  // Menghubungkan aplikasi ke MongoDB
  await hubungkanBasisData();

  // Mengambil atau membuat dokumen statistik global
  const dokumenStatistik = await ambilAtauBuatDokumenStatistik();
  let jumlahKunjungan = dokumenStatistik.jumlahKunjungan || 0;

  const aplikasi = express();
  const serverHttp = http.createServer(aplikasi);

  // Middleware umum
  aplikasi.use(cors());
  aplikasi.use(express.json());
  aplikasi.use(express.static('public'));

  // =========================
  // Endpoint: APOD hari ini (dengan fallback kemarin)
  // =========================
  aplikasi.get('/api/apod/today', async (permintaan, tanggapan) => {
    try {
      // Mengambil APOD dengan mekanisme fallback
      const { apod, tanggalDipakai } = await ambilApodDenganCadangan();

      tanggapan.json({
        date: apod.date,
        usedDate: tanggalDipakai,
        title: apod.title,
        explanation: apod.explanation,
        media_type: apod.media_type,
        url: apod.url,
        hdurl: apod.hdurl,
      });
    } catch (kesalahan) {
      console.error('Error get /api/apod/today:', kesalahan.message);
      if (kesalahan.response) {
        console.error('NASA error data:', kesalahan.response.data);
      }
      tanggapan
        .status(500)
        .json({ error: 'Gagal mengambil APOD dari NASA' });
    }
  });

  // =========================
  // Endpoint: daftar pelanggan APOD
  // =========================
  aplikasi.post('/api/subscribe', async (permintaan, tanggapan) => {
    try {
      const { email } = permintaan.body;

      // Validasi sederhana email tidak boleh kosong dan harus string
      if (!email || typeof email !== 'string') {
        return tanggapan
          .status(400)
          .json({ error: 'Email wajib diisi.' });
      }

      const emailDipangkas = email.trim().toLowerCase();
      const polaEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!polaEmail.test(emailDipangkas)) {
        return tanggapan
          .status(400)
          .json({ error: 'Format email tidak valid.' });
      }

      // Cek apakah email sudah pernah terdaftar
      let pelanggan = await Pelanggan.findOne({ email: emailDipangkas });
      if (pelanggan) {
        return tanggapan.status(200).json({
          message: 'Email sudah terdaftar sebagai subscriber.',
        });
      }

      // Menyimpan email baru ke basis data
      pelanggan = await Pelanggan.create({ email: emailDipangkas });

      return tanggapan.status(201).json({
        message: 'Berhasil subscribe APOD harian.',
        email: pelanggan.email,
      });
    } catch (kesalahan) {
      console.error('Error POST /api/subscribe:', kesalahan.message);
      if (kesalahan.code === 11000) {
        return tanggapan.status(200).json({
          message: 'Email sudah terdaftar sebagai subscriber.',
        });
      }
      return tanggapan
        .status(500)
        .json({ error: 'Gagal menyimpan subscriber.' });
    }
  });

  // =========================
  // Endpoint: kirim APOD via email (manual test)
  // =========================
  aplikasi.post('/api/send-apod-email', async (permintaan, tanggapan) => {
    try {
      const hariIni = formatTanggal(new Date());
      const apod = await ambilApod(hariIni);

      const daftarPelanggan = await Pelanggan.find({});
      if (daftarPelanggan.length === 0) {
        return tanggapan.status(200).json({
          message: 'Tidak ada subscriber untuk dikirimi email.',
        });
      }

      let jumlahSukses = 0;
      let jumlahGagal = 0;

      // Mengirim email ke setiap pelanggan
      for (const pel of daftarPelanggan) {
        try {
          await kirimEmailApod(pel.email, apod);
          jumlahSukses++;
        } catch (e) {
          console.error(`Gagal kirim ke ${pel.email}:`, e.message);
          jumlahGagal++;
        }
      }

      return tanggapan.status(200).json({
        message: 'Selesai mengirim email APOD hari ini.',
        total: daftarPelanggan.length,
        success: jumlahSukses,
        failed: jumlahGagal,
      });
    } catch (kesalahan) {
      console.error('Error POST /api/send-apod-email:', kesalahan.message);
      return tanggapan
        .status(500)
        .json({ error: 'Gagal mengirim email APOD.' });
    }
  });

  // =========================
  // Endpoint: pencarian gambar NASA
  // =========================
  aplikasi.get('/api/images/search', async (permintaan, tanggapan) => {
    try {
      const kueri = (permintaan.query.q || '').toString().trim();
      const halaman = parseInt(permintaan.query.page || '1', 10) || 1;

      if (!kueri) {
        return tanggapan
          .status(400)
          .json({ error: 'Parameter q wajib diisi.' });
      }

      const {
        item,
        total,
        perHalaman,
      } = await cariGambarNasa(kueri, halaman);
      const jumlahHalaman =
        perHalaman > 0 ? Math.ceil(total / perHalaman) : item.length ? 1 : 0;

      tanggapan.json({
        query: kueri,
        page: halaman,
        perPage: perHalaman,
        total,
        totalPages: jumlahHalaman,
        items: item,
      });
    } catch (kesalahan) {
      console.error('Error GET /api/images/search:', kesalahan.message);
      tanggapan
        .status(500)
        .json({ error: 'Gagal mencari gambar di NASA.' });
    }
  });

  // =========================
  // Endpoint: data kejadian EONET
  // =========================
  aplikasi.get('/api/eonet/events', async (permintaan, tanggapan) => {
    try {
      const hari = parseInt(permintaan.query.days || '10', 10) || 10;
      const batas = parseInt(permintaan.query.limit || '20', 10) || 20;
      const status = (permintaan.query.status || 'open').toString();

      const daftarKejadian = await ambilKejadianEonetTerbaru({
        hari,
        batas,
        status,
        idKategori: null,
      });

      tanggapan.json({
        days: hari,
        limit: batas,
        status,
        count: daftarKejadian.length,
        events: daftarKejadian,
      });
    } catch (kesalahan) {
      console.error('Error GET /api/eonet/events:', kesalahan.message);
      tanggapan.status(500).json({
        error: 'Gagal mengambil data EONET dari NASA.',
      });
    }
  });

  // =========================
  // Socket.IO: statistik pengunjung
  // =========================
  const io = new Server(serverHttp, {
    cors: {
      origin: '*',
    },
  });

  // Menyimpan berapa koneksi yang sedang aktif
  let koneksiAktif = 0;

  io.on('connection', (socket) => {
    console.log('Client terhubung:', socket.id);
    koneksiAktif++;

    // Mengirim statistik awal ke client yang baru terhubung
    socket.emit('visitorStats', {
      current: koneksiAktif,
      total: jumlahKunjungan,
    });

    // Event dari browser: sesi/tab baru pertama kali membuka AstroView
    socket.on('firstVisit', async () => {
      try {
        jumlahKunjungan++;

        // Memperbarui dokumen statistik di basis data
        dokumenStatistik.jumlahKunjungan = jumlahKunjungan;
        await dokumenStatistik.save();

        // Menyiarkan update ke semua client
        io.emit('visitorCount', {
          current: koneksiAktif,
          total: jumlahKunjungan,
        });
      } catch (kesalahan) {
        console.error(
          'Gagal update jumlahKunjungan di basis data:',
          kesalahan.message
        );
      }
    });

    socket.on('disconnect', () => {
      console.log('Client terputus:', socket.id);
      koneksiAktif = Math.max(0, koneksiAktif - 1);
      io.emit('visitorCount', {
        current: koneksiAktif,
        total: jumlahKunjungan,
      });
    });
  });

  // =========================
  // Menjalankan server + cron APOD email harian
  // =========================
  serverHttp.listen(PORT, () => {
    console.log(`AstroView backend berjalan di http://localhost:${PORT}`);

    // Menjadwalkan pengiriman email APOD setiap hari jam 07:00
    cron.schedule('0 7 * * *', async () => {
      console.log('[CRON] Mulai kirim email APOD harian...');

      try {
        const hariIni = formatTanggal(new Date());
        const apod = await ambilApod(hariIni);
        const daftarPelanggan = await Pelanggan.find({});

        if (daftarPelanggan.length === 0) {
          console.log('[CRON] Tidak ada subscriber untuk dikirimi email.');
          return;
        }

        let jumlahSukses = 0;
        let jumlahGagal = 0;

        for (const pel of daftarPelanggan) {
          try {
            await kirimEmailApod(pel.email, apod);
            jumlahSukses++;
          } catch (e) {
            console.error(
              `[CRON] Gagal kirim ke ${pel.email}:`,
              e.message
            );
            jumlahGagal++;
          }
        }

        console.log(
          `[CRON] Selesai kirim APOD: total=${daftarPelanggan.length}, sukses=${jumlahSukses}, gagal=${jumlahGagal}`
        );
      } catch (kesalahan) {
        console.error('[CRON] Error kirim email APOD:', kesalahan.message);
      }
    });
  });
}

// Menjalankan fungsi utama untuk memulai server
mulaiServer().catch((kesalahan) => {
  console.error('Gagal start server:', kesalahan);
  process.exit(1);
});