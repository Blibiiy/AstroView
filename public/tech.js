document.addEventListener('DOMContentLoaded', () => {
      const titleEl = document.getElementById('tech-title');
      const centerEl = document.getElementById('tech-center');
      const descEl = document.getElementById('tech-description');
      const linkWrapperEl = document.getElementById('tech-link-wrapper');
      const nextBtn = document.getElementById('tech-next-btn');
    
      if (!titleEl || !centerEl || !descEl || !linkWrapperEl || !nextBtn) return;
    
      async function loadTech() {
        try {
          titleEl.textContent = 'Loading...';
          centerEl.textContent = '';
          descEl.textContent = '';
          linkWrapperEl.innerHTML = '';
    
          const res = await fetch('/api/tech/random');
          const data = await res.json();
    
          if (!res.ok) {
            throw new Error(data.error || 'Gagal mengambil data TechTransfer');
          }
    
          const tech = data.tech;
          if (!tech) {
            titleEl.textContent = 'Tidak ada data TechTransfer.';
            descEl.textContent =
              'Coba lagi nanti. Server NASA kadang tidak selalu mengembalikan data.';
            centerEl.textContent = '';
            linkWrapperEl.innerHTML = '';
            return;
          }
    
          titleEl.textContent = tech.title || 'NASA Technology';
          centerEl.textContent = tech.center
            ? `Center: ${tech.center}`
            : '';
          descEl.textContent = tech.description || 'No description from NASA.';
    
          if (tech.url) {
            linkWrapperEl.innerHTML = `
              <a
                href="${tech.url}"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-400 hover:underline"
              >
                View on NASA TechTransfer
              </a>
            `;
          } else {
            linkWrapperEl.innerHTML = '';
          }
        } catch (err) {
          console.error(err);
          titleEl.textContent = 'Error';
          centerEl.textContent = '';
          descEl.textContent = 'Gagal memuat fakta teknologi. Coba lagi.';
          linkWrapperEl.innerHTML = '';
        }
      }
    
      nextBtn.addEventListener('click', () => {
        loadTech();
      });
    
      // load pertama
      loadTech();
    });