// ========================
// Memuat APOD pada halaman utama
// ========================
async function muatApodBeranda() {
  const wadahMediaApod = document.getElementById('apod-media');
  const judulApodElemen = document.getElementById('apod-title');
  const tanggalApodElemen = document.getElementById('apod-date');
  const ringkasanApodElemen = document.getElementById('apod-excerpt');

  if (!wadahMediaApod || !judulApodElemen || !tanggalApodElemen || !ringkasanApodElemen) return;

  // Tampilkan status sementara saat data diambil
  wadahMediaApod.innerHTML =
    '<p class="text-xs text-slate-400">Loading...</p>';

  try {
    // Meminta data APOD dari backend
    const respons = await fetch('/api/apod/today');
    if (!respons.ok) throw new Error('Gagal ambil APOD');

    const data = await respons.json();

    let htmlMedia = '';
    // Jika tipe media adalah gambar, tampilkan langsung
    if (data.media_type === 'image') {
      htmlMedia = `
        <img src="${data.url}" alt="${data.title}" class="w-full h-full object-cover" />
      `;
    } else {
      // Jika bukan gambar (mis. video), tampilkan link untuk membuka media
      htmlMedia = `
        <div class="flex flex-col items-center justify-center gap-2 text-xs text-slate-200">
          <span>Media type: ${data.media_type}</span>
          <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">
            Open media
          </a>
        </div>
      `;
    }
    wadahMediaApod.innerHTML = htmlMedia;

    // Menampilkan judul APOD
    judulApodElemen.textContent =
      data.title || 'Astronomy Picture of the Day';

    // Jika ada tanggal fallback (usedDate), gunakan itu
    const tanggalTampil = data.usedDate || data.date || '-';
    tanggalApodElemen.textContent = `Date: ${tanggalTampil}`;

    // Menampilkan penjelasan APOD
    ringkasanApodElemen.textContent = data.explanation || '';
  } catch (kesalahan) {
    console.error(kesalahan);
    wadahMediaApod.innerHTML =
      '<p class="text-xs text-red-400">Gagal memuat APOD.</p>';
    judulApodElemen.textContent = 'Error loading APOD';
    tanggalApodElemen.textContent = 'Date: -';
    ringkasanApodElemen.textContent = '';
  }
}

// ========================
// Form subscribe email APOD
// ========================
function aturFormSubscribe() {
  const formSubscribe = document.getElementById('subscribe-form');
  const isianEmail = document.getElementById('email');
  const pesanSubscribeElemen = document.getElementById('subscribe-message');
  if (!formSubscribe || !isianEmail || !pesanSubscribeElemen) return;

  formSubscribe.addEventListener('submit', async (peristiwa) => {
    peristiwa.preventDefault();
    pesanSubscribeElemen.textContent = '';

    const email = isianEmail.value.trim();
    if (!email) {
      pesanSubscribeElemen.textContent = 'Email belum diisi.';
      pesanSubscribeElemen.className = 'text-[0.75rem] text-red-400';
      return;
    }

    try {
      // Mengirim email ke backend untuk didaftarkan sebagai subscriber
      const respons = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await respons.json();
      if (!respons.ok) {
        pesanSubscribeElemen.textContent =
          data.error || 'Gagal menyimpan.';
        pesanSubscribeElemen.className =
          'text-[0.75rem] text-red-400';
      } else {
        pesanSubscribeElemen.textContent =
          data.message || 'Berhasil subscribe.';
        pesanSubscribeElemen.className =
          'text-[0.75rem] text-emerald-400';
        isianEmail.value = '';
      }
    } catch (kesalahan) {
      console.error(kesalahan);
      pesanSubscribeElemen.textContent =
        'Tidak bisa konek ke server.';
      pesanSubscribeElemen.className =
        'text-[0.75rem] text-red-400';
    }
  });
}

// ========================
// Statistik pengunjung via Socket.IO
// ========================
function aturStatistikPengunjung() {
  // Jika skrip Socket.IO belum dimuat, hentikan
  if (typeof io === 'undefined') return;

  // Membuat koneksi socket ke server
  const soket = io();

  const elemenSedangOnline = document.getElementById('visitor-count');
  const elemenTotalKunjungan = document.getElementById('visitor-total');

  // Fungsi pembantu untuk memperbarui tampilan jumlah pengunjung
  function perbaruiTampilanStatistik(payload) {
    if (!payload) return;
    if (elemenSedangOnline)
      elemenSedangOnline.textContent = String(payload.current ?? 0);
    if (elemenTotalKunjungan)
      elemenTotalKunjungan.textContent = String(payload.total ?? 0);
  }

  // Menerima statistik awal saat pertama kali terhubung
  soket.on('visitorStats', perbaruiTampilanStatistik);
  // Menerima pembaruan ketika ada perubahan koneksi
  soket.on('visitorCount', perbaruiTampilanStatistik);

  // Menggunakan sessionStorage agar setiap tab hanya mengirim "firstVisit"
  // satu kali selama tab tersebut hidup
  try {
    const kunciSession = 'astroview_sesi_kunjungan_pertama';
    const sudahKirim = sessionStorage.getItem(kunciSession);
    if (!sudahKirim) {
      soket.emit('firstVisit');
      sessionStorage.setItem(kunciSession, '1');
    }
  } catch (kesalahan) {
    console.warn(
      'sessionStorage tidak tersedia untuk statistik pengunjung:',
      kesalahan
    );
    // Jika sessionStorage tidak bisa dipakai, tetap kirim satu kali
    soket.emit('firstVisit');
  }
}

// ========================
// Inisialisasi saat DOM siap
// ========================
document.addEventListener('DOMContentLoaded', () => {
  muatApodBeranda();
  aturFormSubscribe();
  aturStatistikPengunjung();
});