require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('priority').optional().isIn(['High', 'Medium', 'Low']).withMessage('Priority must be High, Medium, or Low')
];

const statusValidation = [
  body('status').trim().notEmpty().withMessage('Status is required')
];

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, assignee, deadline, priority, category } = req.body;
    const task = new Task({ title, assignee, deadline, priority, category, createdBy: req.user.userId });
    await task.save();

    // Log activity
    const activity = new Activity({
      task: task._id,
      user: req.user.username,
      action: 'created task'
    });
    await activity.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('priority').optional().isIn(['High', 'Medium', 'Low']).withMessage('Priority must be High, Medium, or Low'),
  body('status').optional().notEmpty().withMessage('Status cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { title, assignee, deadline, priority, category, status } = req.body;

    // Authorization: Verify the user owns this task
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (existingTask.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own tasks' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (assignee) updates.assignee = assignee;
    if (deadline) updates.deadline = deadline;
    if (priority) updates.priority = priority;
    if (category) updates.category = category;
    if (status) updates.status = status;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Log activity
    const action = status ? `updated status to ${status}` : 'updated task details';
    const activity = new Activity({
      task: task._id,
      user: req.user.username,
      action: action
    });
    await activity.save();

    res.json(task);
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Authorization
    if (task.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Ideally, also delete comments, activities, attachments... skipping for now or assume cascade in schema if configured
    // Log activity (optional, but task is gone so activity might be orphaned if not deleted)
    // For now we just return success

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
