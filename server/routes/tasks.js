const express = require('express');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // Replace with env var in production

// Middleware to verify token
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

// Get all tasks
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Create task
router.post('/', auth, async (req, res) => {
  const { title, assignee, deadline, priority, category } = req.body;
  const task = new Task({ title, assignee, deadline, priority, category, createdBy: req.user.userId });
  await task.save();
  res.json(task);
});

// Update task status
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(task);
});

module.exports = router;
