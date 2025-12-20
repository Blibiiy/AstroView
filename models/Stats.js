const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    totalVisits: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const Stats = mongoose.model('Stats', statsSchema);

async function getOrCreateStatsDoc() {
  let doc = await Stats.findOne({ key: 'global' });
  if (!doc) {
    doc = await Stats.create({ key: 'global', totalVisits: 0 });
  }
  return doc;
}

module.exports = {
  Stats,
  getOrCreateStatsDoc,
};