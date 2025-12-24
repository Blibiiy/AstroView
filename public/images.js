// Script ini mengatur pencarian dan penampilan gambar NASA di halaman Images
document.addEventListener('DOMContentLoaded', () => {
  const formPencarian = document.getElementById('image-search-form');
  const masukanKueri = document.getElementById('image-query');
  const pesanPencarianElemen = document.getElementById(
    'image-search-message'
  );
  const hasilGambarElemen = document.getElementById('image-results');
  const elemenPaginasi = document.getElementById('image-pagination');

  const modalDetailElemen = document.getElementById('image-detail-modal');
  const judulDetailElemen = document.getElementById('image-detail-title');
  const gambarDetailElemen = document.getElementById('image-detail-img');
  const deskripsiDetailElemen = document.getElementById(
    'image-detail-desc'
  );
  const tombolTutupModal = document.getElementById('image-detail-close');

  if (
    !formPencarian ||
    !masukanKueri ||
    !pesanPencarianElemen ||
    !hasilGambarElemen ||
    !elemenPaginasi ||
    !modalDetailElemen ||
    !judulDetailElemen ||
    !gambarDetailElemen ||
    !deskripsiDetailElemen ||
    !tombolTutupModal
  )
    return;

  let kueriSekarang = '';
  let halamanSekarang = 1;
  let jumlahHalaman = 0;
  let totalHasil = 0;

  // Menyimpan item gambar yang sedang ditampilkan untuk kebutuhan modal detail
  let daftarItemSekarang = [];

  // Menampilkan modal detail ketika pengguna menekan tombol "Detail"
  function bukaModalDetail(item) {
    judulDetailElemen.textContent = item.judul || item.title || 'Detail';

    const urlGambarKecil = item.urlKecil || item.thumbUrl || '';
    if (urlGambarKecil) {
      gambarDetailElemen.src = urlGambarKecil;
      gambarDetailElemen.alt = item.judul || item.title || '';
    } else {
      gambarDetailElemen.src = '';
      gambarDetailElemen.alt = '';
    }

    const deskripsi = item.deskripsi || item.description || 'Tidak ada deskripsi dari NASA.';
    deskripsiDetailElemen.textContent = deskripsi;

    modalDetailElemen.classList.remove('hidden');
  }

  // Menutup modal detail
  function tutupModalDetail() {
    modalDetailElemen.classList.add('hidden');
  }

  tombolTutupModal.addEventListener('click', tutupModalDetail);
  modalDetailElemen.addEventListener('click', (peristiwa) => {
    if (peristiwa.target === modalDetailElemen) tutupModalDetail();
  });

  // Menampilkan kartu-kartu hasil gambar
  function tampilkanHasil(item) {
    daftarItemSekarang = item || [];

    if (!item || item.length === 0) {
      hasilGambarElemen.innerHTML = '';
      return;
    }

    hasilGambarElemen.innerHTML = item
      .map((data, indeks) => {
        const judulAman = data.judul || data.title || 'Untitled';
        const deskripsiPenuh = data.deskripsi || data.description || '';
        const deskripsiSingkat =
          deskripsiPenuh.length > 220
            ? deskripsiPenuh.slice(0, 220) + '...'
            : deskripsiPenuh;
        const urlGambarKecil = data.urlKecil || data.thumbUrl || '';

        return `
          <article class="rounded-md border border-slate-800 bg-black/80 overflow-hidden flex flex-col h-full">
            <div class="w-full h-40 bg-slate-900 overflow-hidden flex items-center justify-center">
              ${
                urlGambarKecil
                  ? `<img src="${urlGambarKecil}" alt="${judulAman}" class="w-full h-full object-cover" />`
                  : '<div class="w-full h-full flex items-center justify-center text-[0.7rem] text-slate-500">No preview</div>'
              }
            </div>
            <div class="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div class="space-y-1">
                <h2 class="text-xs font-semibold text-slate-50 line-clamp-2">
                  ${judulAman}
                </h2>
                <p class="text-[0.7rem] text-slate-300 leading-relaxed line-clamp-2">
                  ${deskripsiSingkat}
                </p>
              </div>
              <div class="pt-1 flex justify-end">
                <button
                  type="button"
                  data-detail-idx="${indeks}"
                  class="text-[0.7rem] text-blue-400 hover:underline"
                >
                  Detail
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Pasang event klik pada setiap tombol "Detail"
    hasilGambarElemen
      .querySelectorAll('button[data-detail-idx]')
      .forEach((tombol) => {
        tombol.addEventListener('click', () => {
          const indeks = parseInt(
            tombol.getAttribute('data-detail-idx') || '0',
            10
          );
          const itemDipilih = daftarItemSekarang[indeks];
          if (itemDipilih) bukaModalDetail(itemDipilih);
        });
      });
  }

  // Menampilkan tombol-tombol paginasi
  function tampilkanPaginasi() {
    elemenPaginasi.innerHTML = '';

    if (!kueriSekarang || jumlahHalaman <= 1) {
      return;
    }

    const jumlahTombolMaks = 5;
    let awal = Math.max(1, halamanSekarang - 2);
    let akhir = Math.min(jumlahHalaman, halamanSekarang + 2);

    if (akhir - awal + 1 > jumlahTombolMaks) {
      akhir = awal + jumlahTombolMaks - 1;
    }
    if (akhir > jumlahHalaman) akhir = jumlahHalaman;
    if (akhir - awal + 1 < jumlahTombolMaks) {
      awal = Math.max(1, akhir - jumlahTombolMaks + 1);
    }
    if (awal < 1) awal = 1;

    const bagian = [];

    // Tombol "Prev"
    bagian.push(`
      <button
        type="button"
        data-page="${halamanSekarang > 1 ? halamanSekarang - 1 : 1}"
        class="px-2 py-1 rounded border border-slate-700 bg-black/70 text-slate-200 ${
          halamanSekarang === 1
            ? 'opacity-40 cursor-default'
            : 'hover:border-blue-400'
        }"
        ${halamanSekarang === 1 ? 'disabled' : ''}
      >
        Prev
      </button>
    `);

    // Tombol nomor halaman
    for (let p = awal; p <= akhir; p++) {
      bagian.push(`
        <button
          type="button"
          data-page="${p}"
          class="px-2 py-1 rounded border ${
            p === halamanSekarang
              ? 'border-blue-400 bg-blue-500 text-slate-950'
              : 'border-slate-700 bg-black/70 text-slate-200 hover:border-blue-400'
          }"
        >
          ${p}
        </button>
      `);
    }

    // Tombol "Next"
    bagian.push(`
      <button
        type="button"
        data-page="${
          halamanSekarang < jumlahHalaman ? halamanSekarang + 1 : jumlahHalaman
        }"
        class="px-2 py-1 rounded border border-slate-700 bg-black/70 text-slate-200 ${
          halamanSekarang === jumlahHalaman
            ? 'opacity-40 cursor-default'
            : 'hover:border-blue-400'
        }"
        ${halamanSekarang === jumlahHalaman ? 'disabled' : ''}
      >
        Next
      </button>
    `);

    elemenPaginasi.innerHTML = bagian.join('');

    // Info kecil jumlah halaman
    const infoHalaman = document.createElement('span');
    infoHalaman.className = 'ml-3 text-slate-400 hidden sm:inline';
    infoHalaman.textContent = `Halaman ${halamanSekarang} dari ${jumlahHalaman}`;
    elemenPaginasi.appendChild(infoHalaman);

    // Pasang event klik pada tombol paginasi
    elemenPaginasi
      .querySelectorAll('button[data-page]')
      .forEach((tombol) => {
        tombol.addEventListener('click', () => {
          const halamanTujuan = parseInt(
            tombol.getAttribute('data-page') || '1',
            10
          );
          if (
            !Number.isNaN(halamanTujuan) &&
            halamanTujuan !== halamanSekarang &&
            halamanTujuan >= 1 &&
            halamanTujuan <= jumlahHalaman
          ) {
            lakukanPencarian(kueriSekarang, halamanTujuan);
          }
        });
      });
  }

  // Memanggil API backend untuk mencari gambar berdasarkan kueri dan halaman
  async function lakukanPencarian(kueri, halaman = 1) {
    if (!kueri) return;

    kueriSekarang = kueri;
    halamanSekarang = halaman;

    pesanPencarianElemen.textContent = 'Mencari...';
    pesanPencarianElemen.className = 'text-[0.75rem] text-slate-300';
    hasilGambarElemen.innerHTML = '';
    elemenPaginasi.innerHTML = '';

    try {
      const respons = await fetch(
        `/api/images/search?q=${encodeURIComponent(
          kueri
        )}&page=${halaman}`
      );
      const data = await respons.json();
      if (!respons.ok) {
        pesanPencarianElemen.textContent =
          data.error || 'Gagal mencari gambar.';
        pesanPencarianElemen.className =
          'text-[0.75rem] text-red-400';
        return;
      }

      const item = data.items || [];
      totalHasil = data.total || item.length;
      jumlahHalaman = data.totalPages || 1;

      if (item.length === 0) {
        pesanPencarianElemen.textContent = `Hasil: 0`;
        pesanPencarianElemen.className =
          'text-[0.75rem] text-slate-300';
        hasilGambarElemen.innerHTML = '';
        return;
      }

      // Tampilkan ringkas jumlah hasil
      pesanPencarianElemen.textContent = `Hasil: ${totalHasil}`;
      pesanPencarianElemen.className =
        'text-[0.75rem] text-slate-300';

      tampilkanHasil(item);
      tampilkanPaginasi();
    } catch (kesalahan) {
      console.error(kesalahan);
      pesanPencarianElemen.textContent =
        'Error saat menghubungi server.';
      pesanPencarianElemen.className =
        'text-[0.75rem] text-red-400';
      hasilGambarElemen.innerHTML = '';
      elemenPaginasi.innerHTML = '';
    }
  }

  // Menangani submit form pencarian
  formPencarian.addEventListener('submit', (peristiwa) => {
    peristiwa.preventDefault();
    const kueri = masukanKueri.value.trim();
    if (!kueri) return;
    lakukanPencarian(kueri, 1);
  });
});