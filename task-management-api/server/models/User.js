// User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: function() {
            // Generate a default avatar URL using the user's initials
            const initials = this.name.split(' ').map(n => n[0]).join('').toUpperCase();
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
        }
    },
    department: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            taskAssigned: {
                type: Boolean,
                default: true
            },
            taskDue: {
                type: Boolean,
                default: true
            }
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
    return this.name;
});

// Virtual for initials
userSchema.virtual('initials').get(function() {
    return this.name.split(' ').map(n => n[0]).join('').toUpperCase();
});

// Virtual for task count
userSchema.virtual('taskCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'assignedTo',
    count: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update avatar if name changes
userSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.avatar.startsWith('http')) {
        const initials = this.name.split(' ').map(n => n[0]).join('').toUpperCase();
        this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
    }
    next();
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

userSchema.methods.toggleActive = function() {
    this.isActive = !this.isActive;
    return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true }).select('-password');
};

userSchema.statics.getUserStats = async function() {
    const totalUsers = await this.countDocuments();
    const activeUsers = await this.countDocuments({ isActive: true });
    const usersByRole = await this.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);

    const usersByDepartment = await this.aggregate([
        {
            $match: { department: { $ne: null, $ne: '' } }
        },
        {
            $group: {
                _id: '$department',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byDepartment: usersByDepartment.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

userSchema.statics.searchUsers = function(query, options = {}) {
    const { limit = 10, skip = 0, role, department, isActive } = options;
    
    let searchQuery = {};
    
    if (query) {
        searchQuery.$or = [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { department: { $regex: query, $options: 'i' } },
            { position: { $regex: query, $options: 'i' } }
        ];
    }
    
    if (role) searchQuery.role = role;
    if (department) searchQuery.department = department;
    if (isActive !== undefined) searchQuery.isActive = isActive;
    
    return this.find(searchQuery)
        .select('-password')
        .limit(limit)
        .skip(skip)
        .sort({ name: 1 });
};

module.exports = mongoose.model('User', userSchema);