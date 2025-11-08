const express = require('express');
const Attachment = require('../models/Attachment');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

// Upload attachment for a task
router.post('/:taskId', auth, upload.single('file'), async (req, res) => {
  const attachment = new Attachment({
    task: req.params.taskId,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
  await attachment.save();
  res.json(attachment);
});

// Get attachments for a task
router.get('/:taskId', auth, async (req, res) => {
  const files = await Attachment.find({ task: req.params.taskId });
  res.json(files);
});

module.exports = router;
