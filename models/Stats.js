// Memuat library mongoose untuk membuat skema dan model
const mongoose = require('mongoose');

// Skema untuk menyimpan statistik global aplikasi
const skemaStatistik = new mongoose.Schema(
  {
    // Kunci unik untuk membedakan dokumen (misal "global")
    kunci: {
      type: String,
      required: true,
      unique: true,
    },
    // Menyimpan total kunjungan yang pernah tercatat
    jumlahKunjungan: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true } // Otomatis menambahkan createdAt dan updatedAt
);

// Membuat model Statistik berdasarkan skema di atas
const Statistik = mongoose.model('Statistik', skemaStatistik);

// Fungsi pembantu untuk mengambil dokumen statistik global,
// bila belum ada maka akan dibuat baru dengan nilai awal 0
async function ambilAtauBuatDokumenStatistik() {
  let dokumen = await Statistik.findOne({ kunci: 'global' });
  if (!dokumen) {
    dokumen = await Statistik.create({ kunci: 'global', jumlahKunjungan: 0 });
  }
  return dokumen;
}

// Mengekspor model dan fungsi pembantu
module.exports = {
  Statistik,
  ambilAtauBuatDokumenStatistik,
};