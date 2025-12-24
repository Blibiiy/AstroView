// Memuat library mongoose untuk koneksi ke MongoDB
const mongoose = require('mongoose');

// Mengambil URL MongoDB dari variabel lingkungan, bila tidak ada gunakan lokal
const URL_MONGO =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/astroview';

// Fungsi untuk menghubungkan aplikasi ke basis data MongoDB
async function hubungkanBasisData() {
  try {
    // Melakukan koneksi ke MongoDB dengan URL yang sudah ditentukan
    await mongoose.connect(URL_MONGO, {
      // Untuk Mongoose v6+ opsi dasar sudah cukup, tidak perlu konfigurasi tambahan
    });
  } catch (kesalahan) {
    // Jika koneksi gagal, tampilkan pesan kesalahan dan hentikan proses
    console.error('Gagal konek MongoDB:', kesalahan.message);
    process.exit(1);
  }
}

// Mengekspor fungsi koneksi dan instance mongoose
module.exports = {
  hubungkanBasisData,
  mongoose,
};