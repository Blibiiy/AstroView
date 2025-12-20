document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('image-search-form');
  const queryInput = document.getElementById('image-query');
  const msgEl = document.getElementById('image-search-message');
  const resultsEl = document.getElementById('image-results');
  const paginationEl = document.getElementById('image-pagination');

  const modalEl = document.getElementById('image-detail-modal');
  const modalTitleEl = document.getElementById('image-detail-title');
  const modalImgEl = document.getElementById('image-detail-img');
  const modalDescEl = document.getElementById('image-detail-desc');
  const modalCloseBtn = document.getElementById('image-detail-close');

  if (
    !form ||
    !queryInput ||
    !msgEl ||
    !resultsEl ||
    !paginationEl ||
    !modalEl ||
    !modalTitleEl ||
    !modalImgEl ||
    !modalDescEl ||
    !modalCloseBtn
  )
    return;

  let currentQuery = '';
  let currentPage = 1;
  let totalPages = 0;
  let totalHits = 0;

  // simpan item halaman sekarang untuk modal detail
  let currentItems = [];

  function openModal(item) {
    modalTitleEl.textContent = item.title || 'Detail';
    const imgUrl = item.thumbUrl || ''; // pakai thumbnail juga di modal
    if (imgUrl) {
      modalImgEl.src = imgUrl;
      modalImgEl.alt = item.title || '';
    } else {
      modalImgEl.src = '';
      modalImgEl.alt = '';
    }

    const desc = item.description || 'Tidak ada deskripsi dari NASA.';
    modalDescEl.textContent = desc;

    modalEl.classList.remove('hidden');
  }

  function closeModal() {
    modalEl.classList.add('hidden');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  function renderResults(items) {
    currentItems = items || [];
  
    if (!items || items.length === 0) {
      resultsEl.innerHTML = '';
      return;
    }
  
    resultsEl.innerHTML = items
      .map((item, idx) => {
        const safeTitle = item.title || 'Untitled';
        const fullDesc = item.description || '';
        const safeDesc =
          fullDesc.length > 220 ? fullDesc.slice(0, 220) + '...' : fullDesc;
        const img = item.thumbUrl || '';
  
        return `
          <article class="rounded-md border border-slate-800 bg-black/80 overflow-hidden flex flex-col h-full">
            <div class="w-full h-40 bg-slate-900 overflow-hidden flex items-center justify-center">
              ${
                img
                  ? `<img src="${img}" alt="${safeTitle}" class="w-full h-full object-cover" />`
                  : '<div class="w-full h-full flex items-center justify-center text-[0.7rem] text-slate-500">No preview</div>'
              }
            </div>
            <div class="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div class="space-y-1">
                <h2 class="text-xs font-semibold text-slate-50 line-clamp-2">
                  ${safeTitle}
                </h2>
                <p class="text-[0.7rem] text-slate-300 leading-relaxed line-clamp-2">
                  ${safeDesc}
                </p>
              </div>
              <div class="pt-1 flex justify-end">
                <button
                  type="button"
                  data-detail-idx="${idx}"
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
  
    // pasang event listener untuk tombol Detail
    resultsEl
      .querySelectorAll('button[data-detail-idx]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-detail-idx') || '0', 10);
          const item = currentItems[idx];
          if (item) openModal(item);
        });
      });
  }

  function renderPagination() {
    paginationEl.innerHTML = '';

    if (!currentQuery || totalPages <= 1) {
      return;
    }

    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    // rapikan agar tidak lewat totalPages dan maxButtons
    if (end - start + 1 > maxButtons) {
      end = start + maxButtons - 1;
    }
    if (end > totalPages) end = totalPages;
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    if (start < 1) start = 1;

    const parts = [];

    // Prev
    parts.push(`
      <button
        type="button"
        data-page="${currentPage > 1 ? currentPage - 1 : 1}"
        class="px-2 py-1 rounded border border-slate-700 bg-black/70 text-slate-200 ${
          currentPage === 1 ? 'opacity-40 cursor-default' : 'hover:border-blue-400'
        }"
        ${currentPage === 1 ? 'disabled' : ''}
      >
        Prev
      </button>
    `);

    // Nomor halaman
    for (let p = start; p <= end; p++) {
      parts.push(`
        <button
          type="button"
          data-page="${p}"
          class="px-2 py-1 rounded border ${
            p === currentPage
              ? 'border-blue-400 bg-blue-500 text-slate-950'
              : 'border-slate-700 bg-black/70 text-slate-200 hover:border-blue-400'
          }"
        >
          ${p}
        </button>
      `);
    }

    // Next
    parts.push(`
      <button
        type="button"
        data-page="${currentPage < totalPages ? currentPage + 1 : totalPages}"
        class="px-2 py-1 rounded border border-slate-700 bg-black/70 text-slate-200 ${
          currentPage === totalPages
            ? 'opacity-40 cursor-default'
            : 'hover:border-blue-400'
        }"
        ${currentPage === totalPages ? 'disabled' : ''}
      >
        Next
      </button>
    `);

    paginationEl.innerHTML = parts.join('');

    // Info kecil: cuma halaman
    const info = document.createElement('span');
    info.className = 'ml-3 text-slate-400 hidden sm:inline';
    info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    paginationEl.appendChild(info);

    // Listener
    paginationEl
      .querySelectorAll('button[data-page]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.getAttribute('data-page') || '1', 10);
          if (
            !Number.isNaN(page) &&
            page !== currentPage &&
            page >= 1 &&
            page <= totalPages
          ) {
            doSearch(currentQuery, page);
          }
        });
      });
  }

  async function doSearch(query, page = 1) {
    if (!query) return;

    currentQuery = query;
    currentPage = page;

    msgEl.textContent = 'Mencari...';
    msgEl.className = 'text-[0.75rem] text-slate-300';
    resultsEl.innerHTML = '';
    paginationEl.innerHTML = '';

    try {
      const res = await fetch(
        `/api/images/search?q=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await res.json();
      if (!res.ok) {
        msgEl.textContent = data.error || 'Gagal mencari gambar.';
        msgEl.className = 'text-[0.75rem] text-red-400';
        return;
      }

      const items = data.items || [];
      totalHits = data.total || items.length;
      totalPages = data.totalPages || 1;

      if (items.length === 0) {
        msgEl.textContent = `Hasil: 0`;
        msgEl.className = 'text-[0.75rem] text-slate-300';
        resultsEl.innerHTML = '';
        return;
      }

      // Status simpel: "Hasil: {totalHits}"
      msgEl.textContent = `Hasil: ${totalHits}`;
      msgEl.className = 'text-[0.75rem] text-slate-300';

      renderResults(items);
      renderPagination();
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Error saat menghubungi server.';
      msgEl.className = 'text-[0.75rem] text-red-400';
      resultsEl.innerHTML = '';
      paginationEl.innerHTML = '';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = queryInput.value.trim();
    if (!q) return;
    doSearch(q, 1);
  });
});