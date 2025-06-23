const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Task validation rules
const taskValidationRules = {
    create: [
        body('title')
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 1, max: 100 })
            .withMessage('Title must be between 1 and 100 characters')
            .trim(),
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters')
            .trim(),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
            .withMessage('Status must be pending, in-progress, completed, or cancelled'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Priority must be low, medium, high, or urgent'),
        body('category')
            .optional()
            .isIn(['work', 'personal', 'shopping', 'health', 'education', 'other'])
            .withMessage('Category must be work, personal, shopping, health, education, or other'),
        body('dueDate')
            .optional()
            .isISO8601()
            .withMessage('Due date must be a valid date')
            .custom((value) => {
                if (new Date(value) <= new Date()) {
                    throw new Error('Due date must be in the future');
                }
                return true;
            }),
        body('assignedTo')
            .optional()
            .isMongoId()
            .withMessage('Assigned user ID must be a valid MongoDB ObjectId'),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .isLength({ min: 1, max: 20 })
            .withMessage('Each tag must be between 1 and 20 characters')
            .trim(),
        body('estimatedHours')
            .optional()
            .isFloat({ min: 0, max: 1000 })
            .withMessage('Estimated hours must be between 0 and 1000'),
        body('actualHours')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Actual hours must be non-negative')
    ],
    
    update: [
        param('id')
            .isMongoId()
            .withMessage('Task ID must be a valid MongoDB ObjectId'),
        body('title')
            .optional()
            .notEmpty()
            .withMessage('Title cannot be empty')
            .isLength({ min: 1, max: 100 })
            .withMessage('Title must be between 1 and 100 characters')
            .trim(),
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters')
            .trim(),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
            .withMessage('Status must be pending, in-progress, completed, or cancelled'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Priority must be low, medium, high, or urgent'),
        body('category')
            .optional()
            .isIn(['work', 'personal', 'shopping', 'health', 'education', 'other'])
            .withMessage('Category must be work, personal, shopping, health, education, or other'),
        body('dueDate')
            .optional()
            .isISO8601()
            .withMessage('Due date must be a valid date'),
        body('assignedTo')
            .optional()
            .isMongoId()
            .withMessage('Assigned user ID must be a valid MongoDB ObjectId'),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .isLength({ min: 1, max: 20 })
            .withMessage('Each tag must be between 1 and 20 characters')
            .trim(),
        body('estimatedHours')
            .optional()
            .isFloat({ min: 0, max: 1000 })
            .withMessage('Estimated hours must be between 0 and 1000'),
        body('actualHours')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Actual hours must be non-negative')
    ],
    
    getById: [
        param('id')
            .isMongoId()
            .withMessage('Task ID must be a valid MongoDB ObjectId')
    ],
    
    query: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('status')
            .optional()
            .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
            .withMessage('Status must be pending, in-progress, completed, or cancelled'),
        query('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Priority must be low, medium, high, or urgent'),
        query('category')
            .optional()
            .isIn(['work', 'personal', 'shopping', 'health', 'education', 'other'])
            .withMessage('Category must be work, personal, shopping, health, education, or other'),
        query('assignedTo')
            .optional()
            .isMongoId()
            .withMessage('Assigned user ID must be a valid MongoDB ObjectId'),
        query('sortBy')
            .optional()
            .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'])
            .withMessage('Sort field must be createdAt, updatedAt, dueDate, priority, or title'),
        query('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc')
    ]
};

// User validation rules
const userValidationRules = {
    create: [
        body('name')
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters')
            .trim(),
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .toLowerCase(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
        body('role')
            .optional()
            .isIn(['admin', 'manager', 'user'])
            .withMessage('Role must be admin, manager, or user'),
        body('department')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Department cannot exceed 50 characters')
            .trim(),
        body('position')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Position cannot exceed 50 characters')
            .trim(),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/)
            .withMessage('Please provide a valid phone number')
    ],
    
    update: [
        param('id')
            .isMongoId()
            .withMessage('User ID must be a valid MongoDB ObjectId'),
        body('name')
            .optional()
            .notEmpty()
            .withMessage('Name cannot be empty')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters')
            .trim(),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .toLowerCase(),
        body('role')
            .optional()
            .isIn(['admin', 'manager', 'user'])
            .withMessage('Role must be admin, manager, or user'),
        body('department')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Department cannot exceed 50 characters')
            .trim(),
        body('position')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Position cannot exceed 50 characters')
            .trim(),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/)
            .withMessage('Please provide a valid phone number'),
        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean value')
    ],
    
    login: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .toLowerCase(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    
    getById: [
        param('id')
            .isMongoId()
            .withMessage('User ID must be a valid MongoDB ObjectId')
    ],
    
    query: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('role')
            .optional()
            .isIn(['admin', 'manager', 'user'])
            .withMessage('Role must be admin, manager, or user'),
        query('department')
            .optional()
            .isLength({ min: 1 })
            .withMessage('Department filter cannot be empty'),
        query('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean value'),
        query('search')
            .optional()
            .isLength({ min: 1 })
            .withMessage('Search query cannot be empty')
    ]
};

// General validation rules
const generalValidationRules = {
    mongoId: [
        param('id')
            .isMongoId()
            .withMessage('ID must be a valid MongoDB ObjectId')
    ]
};

module.exports = {
    handleValidationErrors,
    taskValidationRules,
    userValidationRules,
    generalValidationRules
};