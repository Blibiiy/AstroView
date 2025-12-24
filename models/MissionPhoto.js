// Mengambil instance mongoose dari modul db
const { mongoose } = require('./db');

// Skema untuk menyimpan foto misi (misalnya dari rover Mars)
const skemaFotoMisi = new mongoose.Schema(
  {
    // ID sesi (misal sesi chat / sesi eksplorasi) untuk mengelompokkan foto
    idSesi: {
      type: String,
      required: true,
      index: true,
    },
    // ID foto dari API eksternal
    idFoto: {
      type: Number,
      required: true,
    },
    // URL gambar foto
    urlGambar: {
      type: String,
      required: true,
    },
    // Nama rover yang mengambil gambar
    rover: {
      type: String,
      required: true,
    },
    // Nama kamera yang digunakan
    kamera: {
      type: String,
      required: true,
    },
    // Tanggal di Bumi ketika foto diambil
    tanggalBumi: {
      type: String,
    },
    // Menyimpan seluruh data asli dari API jika diperlukan kembali
    dataLengkap: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// Membuat model FotoMisi berdasarkan skema di atas
const FotoMisi = mongoose.model('FotoMisi', skemaFotoMisi);

module.exports = FotoMisi;