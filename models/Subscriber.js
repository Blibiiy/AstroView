const { mongoose } = require('./db');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // otomatis ada createdAt, updatedAt
  }
);

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

module.exports = Subscriber;