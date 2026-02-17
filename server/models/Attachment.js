const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  filename: { type: String, required: true },
  url: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Attachment', AttachmentSchema);
