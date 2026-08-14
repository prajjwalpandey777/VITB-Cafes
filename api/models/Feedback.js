const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 60, default: 'Anonymous VITian' },
    cafe: { type: String, trim: true, maxlength: 60, default: 'General' },
    type: { type: String, trim: true, maxlength: 80, default: 'General Feedback' },
    message: { type: String, required: true, trim: true, maxlength: 800 }
  },
  { timestamps: true, versionKey: false }
);

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
