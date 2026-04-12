const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['present', 'absent', 'holiday', 'cl', 'pl', 'halfday']
  },
  otStart: {
    type: String,
    default: ''
  },
  otEnd: {
    type: String,
    default: ''
  },
  otHours: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index — one record per user per date
recordSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Record', recordSchema);
