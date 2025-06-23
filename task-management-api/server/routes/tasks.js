const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { taskValidationRules, handleValidationErrors } = require('../middleware/validation');
const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks with filtering, sorting, and pagination
// @access  Public
router.get('/', taskValidationRules.query, handleValidationErrors, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            category,
            assignedTo,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            overdue
        } = req.query;

        // Build query object
        const query = {};
        
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (assignedTo) query.assignedTo = assignedTo;
        
        // Handle search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Handle overdue filter
        if (overdue === 'true') {
            query.dueDate = { $lt: new Date() };
            query.status = { $ne: 'completed' };
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query with pagination and sorting
        const tasks = await Task.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
            
        // Get total count for pagination info
        const total = await Task.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.json({
            success: true,
            data: tasks,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalTasks: total,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching tasks'
        });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Public
router.get('/:id', taskValidationRules.params, handleValidationErrors, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
            
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task'
        });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', taskValidationRules.create, handleValidationErrors, async (req, res) => {
    try {
        const {
            title,
            description,
            status = 'pending',
            priority = 'medium',
            category,
            assignedTo,
            dueDate,
            tags
        } = req.body;
        
        // Verify assigned user exists if provided
        if (assignedTo) {
            const user = await User.findById(assignedTo);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user not found'
                });
            }
        }
        
        const newTask = new Task({
            title,
            description,
            status,
            priority,
            category,
            assignedTo,
            dueDate,
            tags,
            createdBy: req.user?.id // Assuming auth middleware sets req.user
        });
        
        const savedTask = await newTask.save();
        
        // Populate the response
        await savedTask.populate('assignedTo', 'name email');
        await savedTask.populate('createdBy', 'name email');
        
        res.status(201).json({
            success: true,
            data: savedTask,
            message: 'Task created successfully'
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating task'
        });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', taskValidationRules.update, handleValidationErrors, async (req, res) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            category,
            assignedTo,
            dueDate,
            tags
        } = req.body;
        
        // Find the task
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        // Verify assigned user exists if provided
        if (assignedTo) {
            const user = await User.findById(assignedTo);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user not found'
                });
            }
        }
        
        // Update task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                status,
                priority,
                category,
                assignedTo,
                dueDate,
                tags,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
        
        res.json({
            success: true,
            data: updatedTask,
            message: 'Task updated successfully'
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating task'
        });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', taskValidationRules.params, handleValidationErrors, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        await Task.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting task'
        });
    }
});

// @route   PATCH /api/tasks/:id/status
// @desc    Update task status only
// @access  Private
router.patch('/:id/status', taskValidationRules.status, handleValidationErrors, async (req, res) => {
    try {
        const { status } = req.body;
        
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                updatedAt: new Date(),
                ...(status === 'completed' && { completedAt: new Date() })
            },
            { new: true, runValidators: true }
        )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
        
        res.json({
            success: true,
            data: updatedTask,
            message: 'Task status updated successfully'
        });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating task status'
        });
    }
});

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics summary
// @access  Public
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await Task.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lt: ['$dueDate', new Date()] },
                                        { $ne: ['$status', 'completed'] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const summary = stats[0] || {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0
        };
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching task stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task statistics'
        });
    }
});

module.exports = router;