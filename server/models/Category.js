const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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

// Index for hierarchical queries
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  // This would need to be populated with parent categories
  return this.name;
});

// Method to get all subcategories
categorySchema.methods.getSubcategories = async function() {
  return this.constructor.find({ parent: this._id, isActive: true });
};

// Method to get all products in this category and subcategories
categorySchema.methods.getAllProducts = async function() {
  const subcategories = await this.getSubcategories();
  const subcategoryIds = subcategories.map(sub => sub._id);
  const allCategoryIds = [this._id, ...subcategoryIds];
  
  return mongoose.model('Product').find({ 
    category: { $in: allCategoryIds },
    isActive: true 
  });
};

module.exports = mongoose.model('Category', categorySchema);
