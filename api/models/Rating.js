const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    cafeId: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    itemName: { type: String, required: true, trim: true, maxlength: 150 },
    itemKey: { type: String, required: true, trim: true, maxlength: 150 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    name: { type: String, trim: true, maxlength: 60, default: 'Anonymous VITian' },
    review: { type: String, trim: true, maxlength: 400, default: '' }
  },
  { timestamps: true, versionKey: false }
);

ratingSchema.index({ cafeId: 1, itemKey: 1, createdAt: -1 });

module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
