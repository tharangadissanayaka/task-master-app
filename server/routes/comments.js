require('dotenv').config();
const express = require('express');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get comments for a task
router.get('/:taskId', auth, async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId });
  res.json(comments);
});

// Add comment to a task
router.post('/:taskId', auth, async (req, res) => {
  try {
    const { text } = req.body;
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
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
