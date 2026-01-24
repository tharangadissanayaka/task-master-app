
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// CORS configuration for both local dev and production (S3 frontend)
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://taskmaster-frontend-taskmaster-frontend-loq-2026.s3-website-us-east-1.amazonaws.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// OPTIONS handler FIRST - before all other middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = corsOptions.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '3600');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return res.sendStatus(404);
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmaster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


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
  console.log('A user connected:', socket.id);

  // Join task room for targeted updates
  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
    console.log(`Socket ${socket.id} joined task-${taskId}`);
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
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Only start HTTP server when not running inside AWS Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/taskmaster'}`);
  });
}

module.exports = app;
