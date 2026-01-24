const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  filename: { type: String },
  url: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attachment', AttachmentSchema);
