const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/astrobot';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      // opsi default Mongoose v6+ biasanya cukup tanpa config tambahan
    });
    console.log('Terhubung ke MongoDB:', MONGO_URI);
  } catch (err) {
    console.error('Gagal konek MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  mongoose,
};