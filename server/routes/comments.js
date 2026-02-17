require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const commentValidation = [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
];

// Get comments for a task
router.get('/:taskId', auth, async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId });
  res.json(comments);
});

// Add comment to a task
router.post('/:taskId', auth, commentValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { text } = req.body;
    // Verify task exists
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = new Comment({
      task: req.params.taskId,
      user: req.user.username,
      text
    });
    await comment.save();

    // Log activity
    const activity = new Activity({
      task: req.params.taskId,
      user: req.user.username,
      action: 'added a comment'
    });
    await activity.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`task-${req.params.taskId}`).emit('comment:add', comment);

    res.json(comment);
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
