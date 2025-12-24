// Menggunakan nodemailer untuk mengirim email SMTP
const nodemailer = require('nodemailer');

// Membaca konfigurasi SMTP dari variabel lingkungan
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env;


// Jika konfigurasi belum lengkap, beri peringatan di console
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    '[layananEmail] Konfigurasi SMTP belum lengkap di .env. Fitur email tidak akan berfungsi.'
  );
}

// Membuat transporter untuk mengirim email menggunakan SMTP
const pengirimEmail = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false, // true untuk port 465, false untuk 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Mengirim email APOD ke satu penerima
async function kirimEmailApod(kepada, dataApod) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Konfigurasi SMTP belum lengkap');
  }

  // Alamat pengirim; bila EMAIL_FROM tidak diisi, gunakan SMTP_USER
  const dari = EMAIL_FROM || SMTP_USER;

  const subjek = `AstroView APOD - ${dataApod.date}: ${dataApod.title}`;

  // Konten HTML sederhana untuk email
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>NASA Astronomy Picture of the Day (${dataApod.date})</h2>
      <h3>${dataApod.title}</h3>
      ${
        dataApod.media_type === 'image'
          ? `<img src="${dataApod.url}" alt="${dataApod.title}" style="max-width:100%;height:auto;border-radius:8px;" />`
          : `<p>Media type: ${dataApod.media_type}. <a href="${dataApod.url}">Klik di sini untuk melihat</a>.</p>`
      }
      <p style="margin-top:16px;white-space:pre-line;">${dataApod.explanation}</p>
      <hr />
      <p style="font-size:12px;color:#666;">
        Email ini dikirim otomatis oleh AstroView.
      </p>
    </div>
  `;

  // Versi teks biasa (tanpa HTML)
  const teks = `NASA Astronomy Picture of the Day (${dataApod.date})\n\n${dataApod.title}\n\n${dataApod.explanation}\n\nURL: ${dataApod.url}`;

  // Mengirim email menggunakan transporter
  const info = await pengirimEmail.sendMail({
    from: dari,
    to: kepada,
    subject: subjek,
    text: teks,
    html,
  });

  return info;
}

module.exports = {
  kirimEmailApod,
};