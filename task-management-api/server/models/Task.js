// Task model
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'in-progress', 'completed', 'cancelled'],
            message: 'Status must be pending, in-progress, completed, or cancelled'
        },
        default: 'pending'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Priority must be low, medium, high, or urgent'
        },
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['work', 'personal', 'shopping', 'health', 'education', 'other'],
        default: 'other'
    },
    dueDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return !date || date > new Date();
            },
            message: 'Due date must be in the future'
        }
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    attachments: [{
        filename: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    completedAt: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        min: [0, 'Estimated hours cannot be negative'],
        max: [1000, 'Estimated hours cannot exceed 1000']
    },
    actualHours: {
        type: Number,
        min: [0, 'Actual hours cannot be negative']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for task age in days
taskSchema.virtual('ageInDays').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
    return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Pre-save middleware to set completedAt when status changes to completed
taskSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status !== 'completed' && this.completedAt) {
            this.completedAt = undefined;
        }
    }
    next();
});

// Indexes for better query performance
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ createdAt: -1 });

// Static methods
taskSchema.statics.getTasksByStatus = function(status) {
    return this.find({ status }).populate('assignedTo', 'name email');
};

taskSchema.statics.getOverdueTasks = function() {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'completed' }
    }).populate('assignedTo', 'name email');
};

taskSchema.statics.getTaskStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const priorityStats = await this.aggregate([
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 }
            }
        }
    ]);

    const categoryStats = await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byCategory: categoryStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

// Instance methods
taskSchema.methods.markAsCompleted = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

taskSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        return this.save();
    }
    return this;
};

taskSchema.methods.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
};

module.exports = mongoose.model('Task', taskSchema);