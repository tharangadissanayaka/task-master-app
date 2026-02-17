const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  assignee: { type: String, maxlength: 100 },
  deadline: { type: Date },
  status: { type: String, default: 'Pending', index: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium', index: true },
  category: { type: String, maxlength: 50 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

// Compound index for common queries
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdBy: 1, priority: 1 });

module.exports = mongoose.model('Task', TaskSchema);
