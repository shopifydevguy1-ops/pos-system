const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    minimum: {
      type: Number,
      default: 0,
      min: 0
    },
    maximum: {
      type: Number,
      default: 1000,
      min: 0
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    name: String,
    value: String,
    priceAdjustment: {
      type: Number,
      default: 0
    }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm'],
      default: 'cm'
    }
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
    phone: String
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stock: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock.current <= 0) return 'out_of_stock';
  if (this.stock.current <= this.stock.minimum) return 'low_stock';
  return 'in_stock';
});

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.stock.current += quantity;
  } else if (operation === 'subtract') {
    this.stock.current = Math.max(0, this.stock.current - quantity);
  } else if (operation === 'set') {
    this.stock.current = Math.max(0, quantity);
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
