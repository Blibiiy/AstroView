const axios = require('axios');

const NASA_BASE_URL = 'https://api.nasa.gov';
const NASA_API_KEY = process.env.NASA_API_KEY;

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// APOD dasar
async function getApod(date = null) {
  if (!NASA_API_KEY) {
    throw new Error('NASA_API_KEY belum di-set di .env');
  }

  const params = { api_key: NASA_API_KEY };
  if (date) params.date = date;

  const url = `${NASA_BASE_URL}/planetary/apod`;
  const response = await axios.get(url, { params });
  return response.data;
}

// APOD dengan fallback: coba today, kalau gagal -> yesterday
async function getApodWithFallback() {
  const today = new Date();
  const todayStr = formatDate(today);

  try {
    const apodToday = await getApod(todayStr);
    return { apod: apodToday, usedDate: todayStr };
  } catch (err) {
    console.error(
      'APOD untuk hari ini gagal, coba fallback ke yesterday:',
      err.message
    );

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yStr = formatDate(yesterday);

    const apodYesterday = await getApod(yStr);
    return { apod: apodYesterday, usedDate: yStr };
  }
}

// NASA Image and Video Library - search images
async function searchNasaImages(query, page = 1) {
  if (!query) return { items: [], total: 0, perPage: 0 };

  const url = 'https://images-api.nasa.gov/search';
  const params = {
    q: query,
    media_type: 'image',
    page,
  };

  const res = await axios.get(url, { params });
  const collection = res.data?.collection || {};
  const itemsRaw = collection.items || [];
  const meta = collection.metadata || {};
  const total = meta.total_hits || itemsRaw.length;
  const perPage = itemsRaw.length;

  const items = itemsRaw.map((item) => {
    const data = item.data && item.data[0] ? item.data[0] : {};
    const linksArr = item.links || [];
    const firstLink = linksArr[0] || {};

    const nasaId = data.nasa_id || '';
    const title = data.title || 'Untitled';
    const description = data.description || '';

    // thumbnail / preview (gambar kecil)
    const thumbUrl = firstLink.href || '';

    // halaman / koleksi NASA (bisa JSON / list file) – simpan kalau mau pakai nanti
    const nasaPageUrl = item.href || '';

    return {
      nasaId,
      title,
      description,
      thumbUrl,
      nasaPageUrl,
    };
  });

  return { items, total, perPage };
}

// EONET: recent natural events
async function getRecentEonetEvents({
  days = 10,
  limit = 20,
  status = 'open',
  categoryId = null,
} = {}) {
  const baseUrl = 'https://eonet.gsfc.nasa.gov/api/v2.1/events';

  const params = {
    days,
    limit,
    status,
  };

  if (categoryId) {
    params.category = categoryId;
  }

  const res = await axios.get(baseUrl, { params });
  const events = res.data?.events || [];

  return events.map((ev) => {
    const id = ev.id;
    const title = ev.title || 'Untitled event';
    const description = ev.description || '';
    const link = ev.link || '';
    const categories = ev.categories || [];
    const sources = ev.sources || [];
    const geometries = ev.geometries || [];

    const mainCategory = categories[0] || null;
    const categoryTitle = mainCategory?.title || 'Uncategorized';

    const lastGeometry =
      geometries.length > 0 ? geometries[geometries.length - 1] : null;

    let date = null;
    let coordinates = null;
    let geometryType = null;
    if (lastGeometry) {
      date = lastGeometry.date || null;
      geometryType = lastGeometry.type || null;
      coordinates = lastGeometry.coordinates || null;
    }

    const primarySource = sources[0] || null;

    return {
      id,
      title,
      description,
      link,
      categoryTitle,
      categories,
      date,
      geometryType,
      coordinates,
      sourceId: primarySource?.id || null,
      sourceTitle: primarySource?.title || null,
      sourceUrl: primarySource?.url || null,
    };
  });
}

module.exports = {
  getApod,              // dipakai cron & endpoint manual
  getApodWithFallback,  // dipakai /api/apod/today
  formatDate,
  searchNasaImages,
  getRecentEonetEvents,
};