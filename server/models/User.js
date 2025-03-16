const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'technician', 'patient'],
    default: 'nurse'
  },
  specialty: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    enum: [
      'read:patients',
      'write:patients',
      'read:vitals',
      'write:vitals',
      'read:alerts',
      'write:alerts',
      'read:users',
      'write:users',
      'read:devices',
      'write:devices',
      'manage:settings'
    ]
  }],
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  },
  contactNumber: {
    type: String,
    trim: true
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set default permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'read:patients', 'write:patients',
          'read:vitals', 'write:vitals',
          'read:alerts', 'write:alerts',
          'read:users', 'write:users',
          'read:devices', 'write:devices',
          'manage:settings'
        ];
        break;
      case 'doctor':
        this.permissions = [
          'read:patients', 'write:patients',
          'read:vitals', 'write:vitals',
          'read:alerts', 'write:alerts',
          'read:devices'
        ];
        break;
      case 'nurse':
        this.permissions = [
          'read:patients',
          'read:vitals', 'write:vitals',
          'read:alerts', 'write:alerts',
          'read:devices'
        ];
        break;
      case 'technician':
        this.permissions = [
          'read:patients',
          'read:vitals',
          'read:alerts',
          'read:devices', 'write:devices'
        ];
        break;
      case 'patient':
        this.permissions = [
          'read:patients'
        ];
        break;
    }
  }
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      permissions: this.permissions
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '1h'
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create indexes for efficient querying
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);