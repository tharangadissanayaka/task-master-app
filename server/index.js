
require('dotenv').config();
const { validateEnv } = require('./config/validateEnv');
const logger = require('./config/logger');

// Validate environment variables before starting
validateEnv();

const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS configuration for both local dev and production
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmaster')
  .then(() => logger.info('✅ MongoDB connected successfully'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });


// Basic API route
app.get('/', (req, res) => {
  res.send('TaskMaster backend is running');
});

// Auth and Task routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
// Register new feature routes
app.use('/api/comments', require('./routes/comments'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/attachments', require('./routes/attachments'));


// Make io accessible to routes
app.set('io', io);

// Socket.IO setup
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join task room for targeted updates
  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
    logger.debug(`Socket ${socket.id} joined task-${taskId}`);
  });

  // Leave task room
  socket.on('leave-task', (taskId) => {
    socket.leave(`task-${taskId}`);
  });

  // Broadcast new task to all clients
  socket.on('task:add', (task) => {
    socket.broadcast.emit('task:add', task);
  });

  // Broadcast task update to all clients
  socket.on('task:update', ({ id, status }) => {
    socket.broadcast.emit('task:update', { id, status });
    io.to(`task-${id}`).emit('task:updated', { id, status });
  });

  // Broadcast new comment
  socket.on('comment:add', ({ taskId, comment }) => {
    socket.broadcast.to(`task-${taskId}`).emit('comment:add', comment);
  });

  // Broadcast new attachment
  socket.on('attachment:add', ({ taskId, attachment }) => {
    socket.broadcast.to(`task-${taskId}`).emit('attachment:add', attachment);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Serve client build if it exists (local demo)
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Only start HTTP server
server.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
  logger.info(`✅ MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/taskmaster'}`);
  logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
