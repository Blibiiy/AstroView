const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    '[emailService] Konfigurasi SMTP belum lengkap di .env. Fitur email tidak akan berfungsi.'
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false, // true untuk port 465, false untuk 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Kirim email APOD ke 1 penerima
async function sendApodEmail(to, apod) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Konfigurasi SMTP belum lengkap');
  }

  const from = EMAIL_FROM || SMTP_USER;

  const subject = `AstroBot APOD - ${apod.date}: ${apod.title}`;

  // HTML sederhana
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>NASA Astronomy Picture of the Day (${apod.date})</h2>
      <h3>${apod.title}</h3>
      ${
        apod.media_type === 'image'
          ? `<img src="${apod.url}" alt="${apod.title}" style="max-width:100%;height:auto;border-radius:8px;" />`
          : `<p>Media type: ${apod.media_type}. <a href="${apod.url}">Klik di sini untuk melihat</a>.</p>`
      }
      <p style="margin-top:16px;white-space:pre-line;">${apod.explanation}</p>
      <hr />
      <p style="font-size:12px;color:#666;">
        Email ini dikirim otomatis oleh AstroBot. 
      </p>
    </div>
  `;

  const text = `NASA Astronomy Picture of the Day (${apod.date})\n\n${apod.title}\n\n${apod.explanation}\n\nURL: ${apod.url}`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return info;
}

module.exports = {
  sendApodEmail,
};