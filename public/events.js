document.addEventListener('DOMContentLoaded', () => {
  const daysSelect = document.getElementById('events-days');
  const refreshBtn = document.getElementById('events-refresh');
  const msgEl = document.getElementById('events-message');
  const listEl = document.getElementById('events-list');

  if (!daysSelect || !refreshBtn || !msgEl || !listEl) {
    return;
  }

  function formatShortDate(iso) {
    if (!iso) return '-';
    // 2025-12-18T13:46:00Z -> 2025-12-18
    return iso.split('T')[0] || iso;
  }

  async function loadEvents() {
    const days = daysSelect.value || '7';

    msgEl.textContent = 'Memuat data EONET...';
    listEl.innerHTML = '';

    const params = new URLSearchParams({
      days,
      limit: '20',
      status: 'open',
    });

    try {
      const res = await fetch(`/api/eonet/events?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data EONET.');
      }

      const events = data.events || [];
      if (events.length === 0) {
        msgEl.textContent = 'Tidak ada event untuk rentang hari ini.';
        listEl.innerHTML = '';
        return;
      }

      msgEl.textContent = `Menampilkan ${events.length} event dalam ${data.days} hari terakhir.`;

      listEl.innerHTML = events
        .map((ev) => {
          const title = ev.title || 'Untitled event';
          const cat = ev.categoryTitle || 'Uncategorized';
          const date = formatShortDate(ev.date);
          const sourceTitle = ev.sourceTitle || '';
          const sourceUrl = ev.sourceUrl || '';
          const fullDesc = ev.description || '';

          const desc =
            fullDesc.length > 140
              ? fullDesc.slice(0, 140) + '...'
              : fullDesc;

          let coordText = '';
          if (Array.isArray(ev.coordinates) && ev.coordinates.length >= 2) {
            const [lon, lat] = ev.coordinates;
            coordText = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
          }

          return `
            <article class="rounded-md border border-slate-800 bg-black/92 px-3 py-3 flex flex-col h-full">
              <p class="text-[0.7rem] text-slate-400">
                ${cat}${date && date !== '-' ? ` • ${date}` : ''}
              </p>
              <h2 class="mt-1 text-sm font-semibold text-slate-50 line-clamp-2">
                ${title}
              </h2>
              ${
                desc
                  ? `<p class="mt-1 text-[0.75rem] text-slate-300 leading-relaxed line-clamp-3">
                       ${desc}
                     </p>`
                  : ''
              }

              <div class="mt-2 flex items-center justify-between text-[0.7rem] text-slate-400">
                <span class="mr-2 truncate">
                  ${coordText}
                </span>
                ${
                  sourceUrl
                    ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">
                         Source${sourceTitle ? `: ${sourceTitle}` : ''}
                       </a>`
                    : sourceTitle
                    ? `<span>Source: ${sourceTitle}</span>`
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('');
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Gagal memuat data EONET.';
      listEl.innerHTML = '';
    }
  }

  refreshBtn.addEventListener('click', () => loadEvents());
  daysSelect.addEventListener('change', () => loadEvents());

  loadEvents();
});