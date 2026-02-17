const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  user: { type: String, required: true },
  text: { type: String, required: true, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
