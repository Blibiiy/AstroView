document.addEventListener('DOMContentLoaded', () => {
      const mainImageEl = document.getElementById('epic-main-image');
      const titleEl = document.getElementById('epic-main-title');
      const dateEl = document.getElementById('epic-main-date');
      const captionEl = document.getElementById('epic-main-caption');
      const thumbsEl = document.getElementById('epic-thumbs');
    
      if (!mainImageEl || !titleEl || !dateEl || !captionEl || !thumbsEl) return;
    
      let epicData = [];
    
      function setMain(index) {
        const item = epicData[index];
        if (!item) return;
    
        // Gambar utama
        mainImageEl.innerHTML = `
          <img src="${item.imageUrl}" alt="Earth from EPIC" class="w-full h-full object-cover" />
        `;
    
        // Judul simpel + tanggal
        titleEl.textContent = 'Full Earth view from EPIC';
        dateEl.textContent = `Date: ${item.dateTime}`;
    
        const cap = item.caption || 'No caption from EPIC.';
        captionEl.textContent = cap;
      }
    
      function renderThumbs() {
        if (epicData.length === 0) {
          thumbsEl.innerHTML =
            '<p class="text-[0.75rem] text-slate-400 text-center col-span-3">Tidak ada data EPIC.</p>';
          return;
        }
    
        thumbsEl.innerHTML = epicData
          .map((item, idx) => {
            return `
              <button
                type="button"
                data-idx="${idx}"
                class="group rounded-md border border-slate-700 bg-black/80 overflow-hidden focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <div class="w-full h-24 bg-slate-900 overflow-hidden">
                  <img
                    src="${item.imageUrl}"
                    alt="EPIC ${item.date}"
                    class="w-full h-full object-cover group-hover:brightness-110 transition"
                  />
                </div>
                <div class="px-2 py-1 text-left">
                  <p class="text-[0.7rem] text-slate-200">${item.date}</p>
                </div>
              </button>
            `;
          })
          .join('');
    
        // event click
        Array.from(thumbsEl.querySelectorAll('button[data-idx]')).forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
            setMain(idx);
          });
        });
      }
    
      async function loadEpic() {
        try {
          mainImageEl.innerHTML =
            '<p class="text-xs text-slate-400">Loading Earth image...</p>';
          thumbsEl.innerHTML = '';
    
          const res = await fetch('/api/epic/latest?limit=6');
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Gagal mengambil data EPIC');
          }
    
          epicData = data.results || [];
          if (epicData.length === 0) {
            mainImageEl.innerHTML =
              '<p class="text-xs text-slate-400">Tidak ada data EPIC.</p>';
            titleEl.textContent = '-';
            dateEl.textContent = 'Date: -';
            captionEl.textContent = '';
            return;
          }
    
          setMain(0);
          renderThumbs();
        } catch (err) {
          console.error(err);
          mainImageEl.innerHTML =
            '<p class="text-xs text-red-400">Gagal memuat data EPIC.</p>';
          titleEl.textContent = 'Error';
          dateEl.textContent = 'Date: -';
          captionEl.textContent = '';
        }
      }
    
      loadEpic();
    });