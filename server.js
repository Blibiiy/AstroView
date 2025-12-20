require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');

const {
  getApod,
  getApodWithFallback,
  formatDate,
  searchNasaImages,
  getRecentEonetEvents,
} = require('./services/nasaService');
const { connectDB } = require('./models/db');
const Subscriber = require('./models/Subscriber');
const { sendApodEmail } = require('./services/emailService');
const { getOrCreateStatsDoc } = require('./models/Stats');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();

  // Inisialisasi statistik global dari database
  const statsDoc = await getOrCreateStatsDoc();
  let totalVisits = statsDoc.totalVisits || 0;

  const app = express();
  const server = http.createServer(app);

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  // =========================
  // APOD today (dengan fallback today -> yesterday)
  // =========================
  app.get('/api/apod/today', async (req, res) => {
    try {
      const { apod, usedDate } = await getApodWithFallback();

      res.json({
        date: apod.date,
        usedDate,
        title: apod.title,
        explanation: apod.explanation,
        media_type: apod.media_type,
        url: apod.url,
        hdurl: apod.hdurl,
      });
    } catch (err) {
      console.error('Error get /api/apod/today:', err.message);
      if (err.response) {
        console.error('NASA error data:', err.response.data);
      }
      res.status(500).json({ error: 'Gagal mengambil APOD dari NASA' });
    }
  });

  // =========================
  // Subscribe APOD
  // =========================
  app.post('/api/subscribe', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email wajib diisi.' });
      }

      const trimmed = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return res.status(400).json({ error: 'Format email tidak valid.' });
      }

      let subscriber = await Subscriber.findOne({ email: trimmed });
      if (subscriber) {
        return res
          .status(200)
          .json({ message: 'Email sudah terdaftar sebagai subscriber.' });
      }

      subscriber = await Subscriber.create({ email: trimmed });

      return res.status(201).json({
        message: 'Berhasil subscribe APOD harian.',
        email: subscriber.email,
      });
    } catch (err) {
      console.error('Error POST /api/subscribe:', err.message);
      if (err.code === 11000) {
        return res
          .status(200)
          .json({ message: 'Email sudah terdaftar sebagai subscriber.' });
      }
      return res.status(500).json({ error: 'Gagal menyimpan subscriber.' });
    }
  });

  // =========================
  // Kirim APOD via email (manual test)
  // =========================
  app.post('/api/send-apod-email', async (req, res) => {
    try {
      const today = formatDate(new Date());
      const apod = await getApod(today);

      const subscribers = await Subscriber.find({});
      if (subscribers.length === 0) {
        return res
          .status(200)
          .json({ message: 'Tidak ada subscriber untuk dikirimi email.' });
      }

      let success = 0;
      let failed = 0;

      for (const sub of subscribers) {
        try {
          await sendApodEmail(sub.email, apod);
          success++;
        } catch (e) {
          console.error(`Gagal kirim ke ${sub.email}:`, e.message);
          failed++;
        }
      }

      return res.status(200).json({
        message: 'Selesai mengirim email APOD hari ini.',
        total: subscribers.length,
        success,
        failed,
      });
    } catch (err) {
      console.error('Error POST /api/send-apod-email:', err.message);
      return res.status(500).json({ error: 'Gagal mengirim email APOD.' });
    }
  });

  // =========================
  // NASA Image search
  // =========================
  // GET /api/images/search?q=keyword&page=1
  app.get('/api/images/search', async (req, res) => {
    try {
      const q = (req.query.q || '').toString().trim();
      const page = parseInt(req.query.page || '1', 10) || 1;

      if (!q) {
        return res.status(400).json({ error: 'Parameter q wajib diisi.' });
      }

      const { items, total, perPage } = await searchNasaImages(q, page);
      const totalPages =
        perPage > 0 ? Math.ceil(total / perPage) : items.length ? 1 : 0;

      res.json({
        query: q,
        page,
        perPage,
        total,
        totalPages,
        items,
      });
    } catch (err) {
      console.error('Error GET /api/images/search:', err.message);
      res.status(500).json({ error: 'Gagal mencari gambar di NASA.' });
    }
  });

  // =========================
  // EONET: Natural Events
  // =========================
  // GET /api/eonet/events?days=&limit=&status=
  app.get('/api/eonet/events', async (req, res) => {
    try {
      const days = parseInt(req.query.days || '10', 10) || 10;
      const limit = parseInt(req.query.limit || '20', 10) || 20;
      const status = (req.query.status || 'open').toString();

      const events = await getRecentEonetEvents({
        days,
        limit,
        status,
        categoryId: null,
      });

      res.json({
        days,
        limit,
        status,
        count: events.length,
        events,
      });
    } catch (err) {
      console.error('Error GET /api/eonet/events:', err.message);
      res
        .status(500)
        .json({ error: 'Gagal mengambil data EONET dari NASA.' });
    }
  });

  // =========================
  // Socket.IO: visitor stats (disimpan di DB)
  // =========================
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  let currentConnections = 0;

  io.on('connection', (socket) => {
    console.log('Client terhubung:', socket.id);
    currentConnections++;

    // kirim stats awal ke client baru
    socket.emit('visitorStats', {
      current: currentConnections,
      total: totalVisits,
    });

    // browser kirim event firstVisit saat sesi/tab baru
    socket.on('firstVisit', async () => {
      try {
        totalVisits++;

        // update DB
        statsDoc.totalVisits = totalVisits;
        await statsDoc.save();

        // broadcast ke semua client
        io.emit('visitorCount', {
          current: currentConnections,
          total: totalVisits,
        });
      } catch (err) {
        console.error('Gagal update totalVisits di DB:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client terputus:', socket.id);
      currentConnections = Math.max(0, currentConnections - 1);
      io.emit('visitorCount', {
        current: currentConnections,
        total: totalVisits,
      });
    });
  });

  // =========================
  // Start server + Cron APOD email
  // =========================
  server.listen(PORT, () => {
    console.log(`AstroBot backend berjalan di http://localhost:${PORT}`);

    cron.schedule('0 7 * * *', async () => {
      console.log('[CRON] Mulai kirim email APOD harian...');

      try {
        const today = formatDate(new Date());
        const apod = await getApod(today);
        const subscribers = await Subscriber.find({});

        if (subscribers.length === 0) {
          console.log('[CRON] Tidak ada subscriber untuk dikirimi email.');
          return;
        }

        let success = 0;
        let failed = 0;

        for (const sub of subscribers) {
          try {
            await sendApodEmail(sub.email, apod);
            success++;
          } catch (e) {
            console.error(
              `[CRON] Gagal kirim ke ${sub.email}:`,
              e.message
            );
            failed++;
          }
        }

        console.log(
          `[CRON] Selesai kirim APOD: total=${subscribers.length}, sukses=${success}, gagal=${failed}`
        );
      } catch (err) {
        console.error('[CRON] Error kirim email APOD:', err.message);
      }
    });
  });
}

startServer().catch((err) => {
  console.error('Gagal start server:', err);
  process.exit(1);
});