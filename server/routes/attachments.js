require('dotenv').config();
const express = require('express');
const Attachment = require('../models/Attachment');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File upload with size limit (5MB) and file type validation
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDFs, documents, text files, and zips'));
    }
  }
});

// Upload attachment for a task
router.post('/:taskId', auth, upload.single('file'), async (req, res) => {
  try {
    // Verify file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify task exists
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const attachment = new Attachment({
      task: req.params.taskId,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    });
    await attachment.save();

    // Log activity
    const activity = new Activity({
      task: req.params.taskId,
      user: req.user.username,
      action: `uploaded file ${req.file.originalname}`
    });
    await activity.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`task-${req.params.taskId}`).emit('attachment:add', attachment);

    res.json(attachment);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get attachments for a task
router.get('/:taskId', auth, async (req, res) => {
  const files = await Attachment.find({ task: req.params.taskId });
  res.json(files);
});

module.exports = router;
