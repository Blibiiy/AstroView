// APOD
async function loadApod() {
  const mediaContainer = document.getElementById('apod-media');
  const titleEl = document.getElementById('apod-title');
  const dateEl = document.getElementById('apod-date');
  const excerptEl = document.getElementById('apod-excerpt');

  if (!mediaContainer || !titleEl || !dateEl || !excerptEl) return;

  mediaContainer.innerHTML =
    '<p class="text-xs text-slate-400">Loading...</p>';

  try {
    const res = await fetch('/api/apod/today');
    if (!res.ok) throw new Error('Gagal ambil APOD');

    const data = await res.json();

    let mediaHtml = '';
    if (data.media_type === 'image') {
      mediaHtml = `
        <img src="${data.url}" alt="${data.title}" class="w-full h-full object-cover" />
      `;
    } else {
      mediaHtml = `
        <div class="flex flex-col items-center justify-center gap-2 text-xs text-slate-200">
          <span>Media type: ${data.media_type}</span>
          <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">
            Open media
          </a>
        </div>
      `;
    }
    mediaContainer.innerHTML = mediaHtml;

    titleEl.textContent = data.title || 'Astronomy Picture of the Day';

    // gunakan usedDate kalau ada (bisa fallback ke yesterday)
    const showDate = data.usedDate || data.date || '-';
    dateEl.textContent = `Date: ${showDate}`;

    excerptEl.textContent = data.explanation || '';
  } catch (err) {
    console.error(err);
    mediaContainer.innerHTML =
      '<p class="text-xs text-red-400">Gagal memuat APOD.</p>';
    titleEl.textContent = 'Error loading APOD';
    dateEl.textContent = 'Date: -';
    excerptEl.textContent = '';
  }
}

// Subscribe
function setupSubscribeForm() {
  const form = document.getElementById('subscribe-form');
  const emailInput = document.getElementById('email');
  const msgEl = document.getElementById('subscribe-message');
  if (!form || !emailInput || !msgEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    const email = emailInput.value.trim();
    if (!email) {
      msgEl.textContent = 'Email belum diisi.';
      msgEl.className = 'text-[0.75rem] text-red-400';
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        msgEl.textContent = data.error || 'Gagal menyimpan.';
        msgEl.className = 'text-[0.75rem] text-red-400';
      } else {
        msgEl.textContent = data.message || 'Berhasil subscribe.';
        msgEl.className = 'text-[0.75rem] text-emerald-400';
        emailInput.value = '';
      }
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Tidak bisa konek ke server.';
      msgEl.className = 'text-[0.75rem] text-red-400';
    }
  });
}

// Socket: current online + total visits (per sesi/tab)
function setupVisitorStats() {
  if (typeof io === 'undefined') return;
  const socket = io();

  const currentEl = document.getElementById('visitor-count');
  const totalEl = document.getElementById('visitor-total');

  function update(payload) {
    if (!payload) return;
    if (currentEl) currentEl.textContent = String(payload.current ?? 0);
    if (totalEl) totalEl.textContent = String(payload.total ?? 0);
  }

  socket.on('visitorStats', update); // saat connect pertama
  socket.on('visitorCount', update); // update saat ada perubahan total / current

  // Gunakan sessionStorage: firstVisit hanya sekali per sesi/tab
  try {
    const key = 'astrobot_session_first_visit';
    const hasSent = sessionStorage.getItem(key);
    if (!hasSent) {
      socket.emit('firstVisit');
      sessionStorage.setItem(key, '1');
    }
  } catch (e) {
    console.warn('sessionStorage tidak tersedia untuk visitor stats:', e);
    // fallback: tetap kirim firstVisit
    socket.emit('firstVisit');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadApod();
  setupSubscribeForm();
  setupVisitorStats();
});