const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    }
  },
  employmentInfo: {
    position: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    hireDate: {
      type: Date,
      required: true
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'on-leave'],
      default: 'active'
    },
    terminationDate: Date,
    terminationReason: String
  },
  compensation: {
    salary: {
      type: Number,
      min: 0
    },
    hourlyRate: {
      type: Number,
      min: 0
    },
    payFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      default: 'bi-weekly'
    },
    benefits: [{
      type: String,
      name: String,
      amount: Number,
      isActive: Boolean
    }]
  },
  workSchedule: {
    type: {
      type: String,
      enum: ['fixed', 'flexible', 'shift'],
      default: 'fixed'
    },
    workingDays: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      breakDuration: Number // in minutes
    }],
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  attendance: {
    totalWorkingDays: {
      type: Number,
      default: 0
    },
    totalPresentDays: {
      type: Number,
      default: 0
    },
    totalAbsentDays: {
      type: Number,
      default: 0
    },
    totalLateDays: {
      type: Number,
      default: 0
    },
    lastAttendanceDate: Date
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    lastReviewDate: Date,
    nextReviewDate: Date,
    goals: [{
      description: String,
      targetDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
      }
    }]
  },
  documents: [{
    type: {
      type: String,
      enum: ['contract', 'id', 'certificate', 'other']
    },
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true
  }
}, {
  timestamps: true
});

// Indexes
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ 'personalInfo.email': 1 });
employeeSchema.index({ 'employmentInfo.status': 1 });
employeeSchema.index({ 'employmentInfo.department': 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for attendance percentage
employeeSchema.virtual('attendancePercentage').get(function() {
  if (this.attendance.totalWorkingDays === 0) return 0;
  return ((this.attendance.totalPresentDays / this.attendance.totalWorkingDays) * 100).toFixed(2);
});

// Method to update attendance
employeeSchema.methods.updateAttendance = function(status, date = new Date()) {
  this.attendance.totalWorkingDays += 1;
  
  switch (status) {
    case 'present':
      this.attendance.totalPresentDays += 1;
      break;
    case 'absent':
      this.attendance.totalAbsentDays += 1;
      break;
    case 'late':
      this.attendance.totalLateDays += 1;
      this.attendance.totalPresentDays += 1;
      break;
  }
  
  this.attendance.lastAttendanceDate = date;
  return this.save();
};

// Method to calculate salary for period
employeeSchema.methods.calculateSalary = function(startDate, endDate) {
  const daysWorked = this.attendance.totalPresentDays;
  const hourlyRate = this.compensation.hourlyRate;
  const salary = this.compensation.salary;
  
  if (this.employmentInfo.employmentType === 'full-time' && salary) {
    return salary;
  } else if (hourlyRate) {
    // Assuming 8 hours per day
    return daysWorked * 8 * hourlyRate;
  }
  
  return 0;
};

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
