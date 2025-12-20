// =======================
// 1) Load APOD Today
// =======================
async function loadApod() {
      const apodDiv = document.getElementById('apod-content');
      apodDiv.innerHTML = '<p>Memuat data APOD...</p>';
    
      try {
        const res = await fetch('/api/apod/today');
        if (!res.ok) {
          throw new Error('Gagal mengambil APOD');
        }
        const data = await res.json();
    
        let mediaHtml = '';
        if (data.media_type === 'image') {
          mediaHtml = `<img src="${data.url}" alt="${data.title}" />`;
        } else {
          mediaHtml = `<p>Media type: ${data.media_type}. <a href="${data.url}" target="_blank" rel="noopener noreferrer">Lihat di sini</a>.</p>`;
        }
    
        apodDiv.innerHTML = `
          <h3>${data.title}</h3>
          <p><strong>Tanggal:</strong> ${data.date}</p>
          ${mediaHtml}
          <p>${data.explanation}</p>
        `;
      } catch (err) {
        console.error(err);
        apodDiv.innerHTML =
          '<p style="color:#f87171;">Gagal memuat APOD. Coba refresh halaman.</p>';
      }
    }
    
    // =======================
    // 2) Subscribe form
    // =======================
    function setupSubscribeForm() {
      const form = document.getElementById('subscribe-form');
      const emailInput = document.getElementById('email');
      const messageEl = document.getElementById('subscribe-message');
    
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = '';
        const email = emailInput.value.trim();
    
        if (!email) {
          messageEl.textContent = 'Email wajib diisi.';
          messageEl.style.color = '#f87171';
          return;
        }
    
        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
    
          const data = await res.json();
          if (!res.ok) {
            messageEl.textContent = data.error || 'Terjadi kesalahan.';
            messageEl.style.color = '#f87171';
          } else {
            messageEl.textContent = data.message || 'Berhasil subscribe.';
            messageEl.style.color = '#4ade80';
            emailInput.value = '';
          }
        } catch (err) {
          console.error(err);
          messageEl.textContent = 'Gagal menghubungi server.';
          messageEl.style.color = '#f87171';
        }
      });
    }
    
    // =======================
    // 3) Chat AstroBot (Socket.IO)
    // =======================
    function setupChat() {
      const socket = io(); // default ke origin yang sama
    
      const messagesDiv = document.getElementById('chat-messages');
      const form = document.getElementById('chat-form');
      const input = document.getElementById('chat-input');
    
      function appendMessage({ sender, text }) {
        const div = document.createElement('div');
        div.classList.add('chat-message');
        div.classList.add(sender === 'user' ? 'user' : 'bot');
    
        const label = document.createElement('span');
        label.classList.add('label');
        label.textContent = sender === 'user' ? 'Kamu' : 'AstroBot';
    
        const content = document.createElement('span');
        content.textContent = text;
    
        div.appendChild(label);
        div.appendChild(content);
        messagesDiv.appendChild(div);
    
        // Scroll ke bawah
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    
      // Terima pesan dari bot (server)
      socket.on('botMessage', (msg) => {
        // msg bisa jadi { sender, text, type, data, ...}
        appendMessage({ sender: msg.sender || 'bot', text: msg.text || '' });
      });
    
      // Kirim pesan user
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
    
        // Tampilkan di UI
        appendMessage({ sender: 'user', text });
    
        // Kirim ke server
        socket.emit('userMessage', { text });
    
        input.value = '';
        input.focus();
      });
    }
    
    // =======================
    // 4) Init
    // =======================
    document.addEventListener('DOMContentLoaded', () => {
      loadApod();
      setupSubscribeForm();
      setupChat();
    });