const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'check', 'mixed'],
    required: true
  },
  paymentDetails: {
    cashReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    change: {
      type: Number,
      default: 0,
      min: 0
    },
    cardLast4: String,
    transactionId: String
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  refundedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundedAt: {
    type: Date
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundReason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Indexes for performance
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ cashier: 1, createdAt: -1 });
saleSchema.index({ status: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });

// Pre-save middleware to generate sale number
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of sales today
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    
    this.saleNumber = `SALE-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for profit
saleSchema.virtual('profit').get(function() {
  let totalCost = 0;
  this.items.forEach(item => {
    // This would need product cost from the product document
    // For now, assuming 60% cost ratio
    totalCost += (item.unitPrice * 0.6) * item.quantity;
  });
  return this.total - totalCost;
});

// Method to calculate totals
saleSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = (item.unitPrice - item.discount) * item.quantity;
    return sum + itemTotal;
  }, 0);
  
  this.tax = this.items.reduce((sum, item) => {
    return sum + (item.tax * item.quantity);
  }, 0);
  
  this.total = this.subtotal + this.tax - this.discount;
  
  return this;
};

// Method to process refund
saleSchema.methods.processRefund = function(amount, reason, refundedBy) {
  if (this.status !== 'completed') {
    throw new Error('Only completed sales can be refunded');
  }
  
  if (amount > this.total - this.refundedAmount) {
    throw new Error('Refund amount exceeds available amount');
  }
  
  this.refundedAmount += amount;
  this.refundedBy = refundedBy;
  this.refundReason = reason;
  this.refundedAt = new Date();
  
  if (this.refundedAmount >= this.total) {
    this.status = 'refunded';
  }
  
  return this.save();
};

module.exports = mongoose.model('Sale', saleSchema);
