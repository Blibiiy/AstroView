// Script ini mengatur pemuatan data kejadian alam (EONET) di halaman Events
document.addEventListener('DOMContentLoaded', () => {
  const pilihanHariElemen = document.getElementById('events-days');
  const tombolSegarkanElemen = document.getElementById('events-refresh');
  const pesanKejadianElemen = document.getElementById('events-message');
  const daftarKejadianElemen = document.getElementById('events-list');

  if (
    !pilihanHariElemen ||
    !tombolSegarkanElemen ||
    !pesanKejadianElemen ||
    !daftarKejadianElemen
  ) {
    return;
  }

  // Mengubah format tanggal ISO menjadi YYYY-MM-DD
  function formatTanggalPendek(iso) {
    if (!iso) return '-';
    return iso.split('T')[0] || iso;
  }

  // Mengambil data kejadian dari backend dan menampilkannya
  async function muatKejadian() {
    const jumlahHari = pilihanHariElemen.value || '7';

    pesanKejadianElemen.textContent = 'Memuat data EONET...';
    daftarKejadianElemen.innerHTML = '';

    const parameter = new URLSearchParams({
      days: jumlahHari,
      limit: '20',
      status: 'open',
    });

    try {
      const respons = await fetch(
        `/api/eonet/events?${parameter.toString()}`
      );
      const data = await respons.json();

      if (!respons.ok) {
        throw new Error(data.error || 'Gagal mengambil data EONET.');
      }

      const daftarKejadian = data.events || [];
      if (daftarKejadian.length === 0) {
        pesanKejadianElemen.textContent =
          'Tidak ada event untuk rentang hari ini.';
        daftarKejadianElemen.innerHTML = '';
        return;
      }

      pesanKejadianElemen.textContent = `Menampilkan ${daftarKejadian.length} event dalam ${data.days} hari terakhir.`;

      // Menyusun HTML kartu kejadian
      daftarKejadianElemen.innerHTML = daftarKejadian
        .map((kejadian) => {
          const judul = kejadian.judul || kejadian.title || 'Untitled event';
          const kategori =
            kejadian.judulKategori || kejadian.categoryTitle || 'Uncategorized';
          const tanggal = formatTanggalPendek(
            kejadian.tanggal || kejadian.date
          );
          const judulSumber =
            kejadian.judulSumber || kejadian.sourceTitle || '';
          const urlSumber = kejadian.urlSumber || kejadian.sourceUrl || '';
          const deskripsiPenuh =
            kejadian.deskripsi || kejadian.description || '';

          const deskripsiRingkas =
            deskripsiPenuh.length > 140
              ? deskripsiPenuh.slice(0, 140) + '...'
              : deskripsiPenuh;

          let teksKoordinat = '';
          const koordinat =
            kejadian.koordinat || kejadian.coordinates || null;
          if (Array.isArray(koordinat) && koordinat.length >= 2) {
            const [bujur, lintang] = koordinat;
            teksKoordinat = `Lat: ${lintang.toFixed(
              2
            )}, Lon: ${bujur.toFixed(2)}`;
          }

          return `
            <article class="rounded-md border border-slate-800 bg-black/92 px-3 py-3 flex flex-col h-full">
              <p class="text-[0.7rem] text-slate-400">
                ${kategori}${
            tanggal && tanggal !== '-' ? ` • ${tanggal}` : ''
          }
              </p>
              <h2 class="mt-1 text-sm font-semibold text-slate-50 line-clamp-2">
                ${judul}
              </h2>
              ${
                deskripsiRingkas
                  ? `<p class="mt-1 text-[0.75rem] text-slate-300 leading-relaxed line-clamp-3">
                       ${deskripsiRingkas}
                     </p>`
                  : ''
              }

              <div class="mt-2 flex items-center justify-between text-[0.7rem] text-slate-400">
                <span class="mr-2 truncate">
                  ${teksKoordinat}
                </span>
                ${
                  urlSumber
                    ? `<a href="${urlSumber}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">
                         Source${judulSumber ? `: ${judulSumber}` : ''}
                       </a>`
                    : judulSumber
                    ? `<span>Source: ${judulSumber}</span>`
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('');
    } catch (kesalahan) {
      console.error(kesalahan);
      pesanKejadianElemen.textContent = 'Gagal memuat data EONET.';
      daftarKejadianElemen.innerHTML = '';
    }
  }

  tombolSegarkanElemen.addEventListener('click', () => muatKejadian());
  pilihanHariElemen.addEventListener('change', () => muatKejadian());

  // Muat data pertama kali
  muatKejadian();
});