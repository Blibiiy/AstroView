// Menggunakan axios untuk melakukan permintaan HTTP ke API NASA
const axios = require('axios');

// Konstanta dasar untuk URL dan kunci API NASA
const URL_DASAR_NASA = 'https://api.nasa.gov';
const KUNCI_API_NASA = process.env.NASA_API_KEY;

// Fungsi utilitas untuk mengubah objek Date menjadi string YYYY-MM-DD
function formatTanggal(tanggal = new Date()) {
  const tahun = tanggal.getFullYear();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const hari = String(tanggal.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${hari}`;
}

// ========================
// APOD (Astronomy Picture of the Day)
// ========================

// Mengambil data APOD untuk tanggal tertentu (atau hari ini bila kosong)
async function ambilApod(tanggal = null) {
  if (!KUNCI_API_NASA) {
    throw new Error('NASA_API_KEY belum di-set di .env');
  }

  const parameter = { api_key: KUNCI_API_NASA };
  if (tanggal) parameter.date = tanggal;

  const url = `${URL_DASAR_NASA}/planetary/apod`;
  const respons = await axios.get(url, { params: parameter });
  return respons.data;
}

// Mengambil APOD dengan mekanisme fallback:
// 1. Coba ambil APOD hari ini.
// 2. Jika gagal (misal belum tersedia), coba ambil APOD kemarin.
async function ambilApodDenganCadangan() {
  const hariIni = new Date();
  const teksHariIni = formatTanggal(hariIni);

  try {
    const apodHariIni = await ambilApod(teksHariIni);
    return { apod: apodHariIni, tanggalDipakai: teksHariIni };
  } catch (kesalahan) {
    console.error(
      'APOD untuk hari ini gagal, coba fallback ke kemarin:',
      kesalahan.message
    );

    const kemarin = new Date(hariIni.getTime() - 24 * 60 * 60 * 1000);
    const teksKemarin = formatTanggal(kemarin);

    const apodKemarin = await ambilApod(teksKemarin);
    return { apod: apodKemarin, tanggalDipakai: teksKemarin };
  }
}

// ========================
// Pencarian gambar NASA (NASA Image and Video Library)
// ========================

async function cariGambarNasa(kueri, halaman = 1) {
  // Jika kueri kosong, langsung kembalikan hasil kosong
  if (!kueri) return { item: [], total: 0, perHalaman: 0 };

  const url = 'https://images-api.nasa.gov/search';
  const parameter = {
    q: kueri,
    media_type: 'image',
    page: halaman,
  };

  const respons = await axios.get(url, { params: parameter });
  const koleksi = respons.data?.collection || {};
  const daftarItemMentah = koleksi.items || [];
  const metadata = koleksi.metadata || {};
  const total = metadata.total_hits || daftarItemMentah.length;
  const perHalaman = daftarItemMentah.length;

  // Mengubah struktur data NASA menjadi bentuk yang lebih sederhana
  const item = daftarItemMentah.map((itemMentah) => {
    const data = itemMentah.data && itemMentah.data[0] ? itemMentah.data[0] : {};
    const daftarTautan = itemMentah.links || [];
    const tautanPertama = daftarTautan[0] || {};

    const idNasa = data.nasa_id || '';
    const judul = data.title || 'Tanpa judul';
    const deskripsi = data.description || '';

    // URL gambar thumbnail / preview
    const urlKecil = tautanPertama.href || '';

    // URL koleksi NASA (bisa JSON atau daftar file)
    const urlHalamanNasa = itemMentah.href || '';

    return {
      idNasa,
      judul,
      deskripsi,
      urlKecil,
      urlHalamanNasa,
    };
  });

  return { item, total, perHalaman };
}

// ========================
// EONET: Kejadian alam terbaru
// ========================

async function ambilKejadianEonetTerbaru({
  hari = 10,
  batas = 20,
  status = 'open',
  idKategori = null,
} = {}) {
  const urlDasar = 'https://eonet.gsfc.nasa.gov/api/v2.1/events';

  const parameter = {
    days: hari,
    limit: batas,
    status,
  };

  if (idKategori) {
    parameter.category = idKategori;
  }

  const respons = await axios.get(urlDasar, { params: parameter });
  const kejadian = respons.data?.events || [];

  // Normalisasi data kejadian EONET menjadi struktur yang lebih mudah digunakan
  return kejadian.map((kej) => {
    const id = kej.id;
    const judul = kej.title || 'Kejadian tanpa judul';
    const deskripsi = kej.description || '';
    const tautan = kej.link || '';
    const daftarKategori = kej.categories || [];
    const daftarSumber = kej.sources || [];
    const daftarGeometri = kej.geometries || [];

    const kategoriUtama = daftarKategori[0] || null;
    const judulKategori = kategoriUtama?.title || 'Tanpa kategori';

    // Mengambil geometri terakhir sebagai posisi/tanggal terkini
    const geometriTerakhir =
      daftarGeometri.length > 0 ? daftarGeometri[daftarGeometri.length - 1] : null;

    let tanggal = null;
    let koordinat = null;
    let jenisGeometri = null;
    if (geometriTerakhir) {
      tanggal = geometriTerakhir.date || null;
      jenisGeometri = geometriTerakhir.type || null;
      koordinat = geometriTerakhir.coordinates || null;
    }

    const sumberUtama = daftarSumber[0] || null;

    return {
      id,
      judul,
      deskripsi,
      tautan,
      judulKategori,
      daftarKategori,
      tanggal,
      jenisGeometri,
      koordinat,
      idSumber: sumberUtama?.id || null,
      judulSumber: sumberUtama?.title || null,
      urlSumber: sumberUtama?.url || null,
    };
  });
}

// Mengekspor fungsi-fungsi layanan NASA
module.exports = {
  ambilApod,               // dipakai untuk cron & endpoint manual
  ambilApodDenganCadangan, // dipakai /api/apod/today
  formatTanggal,
  cariGambarNasa,
  ambilKejadianEonetTerbaru,
};