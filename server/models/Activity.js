const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  user: { type: String, required: true },
  action: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
