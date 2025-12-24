// Mengambil instance mongoose dari modul db
const { mongoose } = require('./db');

// Skema untuk menyimpan data pelanggan (subscriber) email APOD
const skemaPelanggan = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    // createdAt dan updatedAt otomatis
    timestamps: true,
  }
);

// Membuat model Pelanggan berdasarkan skema di atas
const Pelanggan = mongoose.model('Pelanggan', skemaPelanggan);

module.exports = Pelanggan;