const { mongoose } = require('./db');

const missionPhotoSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    photoId: {
      type: Number,
      required: true,
    },
    imgSrc: {
      type: String,
      required: true,
    },
    rover: {
      type: String,
      required: true,
    },
    camera: {
      type: String,
      required: true,
    },
    earthDate: {
      type: String,
    },
    fullData: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const MissionPhoto = mongoose.model('MissionPhoto', missionPhotoSchema);

module.exports = MissionPhoto;