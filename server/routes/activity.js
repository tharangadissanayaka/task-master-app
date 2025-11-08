const express = require('express');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

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

// Get activity log for a task
router.get('/:taskId', auth, async (req, res) => {
  const logs = await Activity.find({ task: req.params.taskId });
  res.json(logs);
});

module.exports = router;
