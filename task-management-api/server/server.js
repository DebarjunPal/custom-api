const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, minlength: 6 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  dueDate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  color: { type: String, match: /^#[0-9A-F]{6}$/i, default: '#007bff' },
  createdAt: { type: Date, default: Date.now }
});

// Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Category = mongoose.model('Category', categorySchema);
const Project = mongoose.model('Project', projectSchema);

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// API Routes

// 1. USERS API
// GET /api/users - Get all users
app.get('/api/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = status ? { isActive: status === 'active' } : {};
  
  const users = await User.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(query);
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// POST /api/users - Create a new user
app.post('/api/users', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required'
    });
  }
  
  const user = new User({ username, email, password });
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userResponse
  });
}));

// PUT /api/users/:id - Update a user
app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const { username, email, isActive } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { username, email, isActive },
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
}));

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Also delete user's tasks and projects
  await Task.deleteMany({ userId: req.params.id });
  await Project.deleteMany({ userId: req.params.id });
  
  res.json({
    success: true,
    message: 'User and associated data deleted successfully'
  });
}));

// 2. TASKS API
// GET /api/tasks - Get all tasks with filtering
app.get('/api/tasks', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, userId } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (userId) query.userId = userId;
  
  const tasks = await Task.find(query)
    .populate('userId', 'username email')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await Task.countDocuments(query);
  
  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// POST /api/tasks - Create a new task
app.post('/api/tasks', asyncHandler(async (req, res) => {
  const { title, description, priority, status, dueDate, userId } = req.body;
  
  if (!title || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Title and userId are required'
    });
  }
  
  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId'
    });
  }
  
  const task = new Task({
    title,
    description,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    userId
  });
  
  await task.save();
  await task.populate('userId', 'username email');
  
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task
  });
}));

// PUT /api/tasks/:id - Update a task
app.put('/api/tasks/:id', asyncHandler(async (req, res) => {
  const { title, description, priority, status, dueDate } = req.body;
  
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { 
      title, 
      description, 
      priority, 
      status, 
      dueDate: dueDate ? new Date(dueDate) : undefined,
      updatedAt: Date.now()
    },
    { new: true, runValidators: true }
  ).populate('userId', 'username email');
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Task updated successfully',
    data: task
  });
}));

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// 3. CATEGORIES API
// GET /api/categories - Get all categories
app.get('/api/categories', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  
  res.json({
    success: true,
    data: categories
  });
}));

// POST /api/categories - Create a new category
app.post('/api/categories', asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required'
    });
  }
  
  const category = new Category({ name, description, color });
  await category.save();
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
}));

// PUT /api/categories/:id - Update a category
app.put('/api/categories/:id', asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, color },
    { new: true, runValidators: true }
  );
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
}));

// DELETE /api/categories/:id - Delete a category
app.delete('/api/categories/:id', asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// 4. PROJECTS API
// GET /api/projects - Get all projects
app.get('/api/projects', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, userId } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;
  
  const projects = await Project.find(query)
    .populate('userId', 'username email')
    .populate('tasks', 'title status priority')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await Project.countDocuments(query);
  
  res.json({
    success: true,
    data: projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// POST /api/projects - Create a new project
app.post('/api/projects', asyncHandler(async (req, res) => {
  const { name, description, status, startDate, endDate, userId } = req.body;
  
  if (!name || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Project name and userId are required'
    });
  }
  
  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId'
    });
  }
  
  const project = new Project({
    name,
    description,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    userId
  });
  
  await project.save();
  await project.populate('userId', 'username email');
  
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project
  });
}));

// PUT /api/projects/:id - Update a project
app.put('/api/projects/:id', asyncHandler(async (req, res) => {
  const { name, description, status, endDate } = req.body;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { 
      name, 
      description, 
      status, 
      endDate: endDate ? new Date(endDate) : undefined
    },
    { new: true, runValidators: true }
  ).populate('userId', 'username email');
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Project updated successfully',
    data: project
  });
}));

// DELETE /api/projects/:id - Delete a project
app.delete('/api/projects/:id', asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Task Management API Documentation',
    version: '1.0.0',
    description: 'RESTful API for managing tasks, users, categories, and projects',
    baseURL: `http://localhost:${PORT}/api`,
    endpoints: {
      users: {
        'GET /users': 'Get all users with pagination',
        'POST /users': 'Create a new user',
        'PUT /users/:id': 'Update a user by ID',
        'DELETE /users/:id': 'Delete a user by ID'
      },
      tasks: {
        'GET /tasks': 'Get all tasks with filtering options',
        'POST /tasks': 'Create a new task',
        'PUT /tasks/:id': 'Update a task by ID',
        'DELETE /tasks/:id': 'Delete a task by ID'
      },
      categories: {
        'GET /categories': 'Get all categories',
        'POST /categories': 'Create a new category',
        'PUT /categories/:id': 'Update a category by ID',
        'DELETE /categories/:id': 'Delete a category by ID'
      },
      projects: {
        'GET /projects': 'Get all projects with filtering options',
        'POST /projects': 'Create a new project',
        'PUT /projects/:id': 'Update a project by ID',
        'DELETE /projects/:id': 'Delete a project by ID'
      }
    }
  });
});

// Root route - serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏠 Frontend: http://localhost:${PORT}`);
});
