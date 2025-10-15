const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const router = express.Router();

// Get all products with pagination and filters
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      if (status === 'low_stock') {
        query.$expr = { $lte: ['$stock.current', '$stock.minimum'] };
      } else if (status === 'out_of_stock') {
        query['stock.current'] = 0;
      } else if (status === 'in_stock') {
        query['stock.current'] = { $gt: 0 };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ 
      message: 'Product created successfully', 
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if SKU is being changed and if it already exists
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({ 
      message: 'Product updated successfully', 
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Update product stock
router.put('/products/:id/stock', async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.updateStock(quantity, operation);
    
    res.json({ 
      message: 'Stock updated successfully', 
      product 
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});

// Get low stock products
router.get('/products/low-stock', async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock.current', '$stock.minimum'] },
      isActive: true
    }).populate('category', 'name');

    res.json({ products });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({ 
      message: 'Category created successfully', 
      category 
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    Object.assign(category, req.body);
    await category.save();

    res.json({ 
      message: 'Category updated successfully', 
      category 
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
});

// Get inventory analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock.current', '$cost'] } } } }
    ]);
    
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock.current', '$stock.minimum'] },
      isActive: true
    });

    const outOfStockCount = await Product.countDocuments({
      'stock.current': 0,
      isActive: true
    });

    res.json({
      totalProducts,
      totalValue: totalValue[0]?.total || 0,
      lowStockCount,
      outOfStockCount,
      stockStatus: {
        inStock: totalProducts - lowStockCount - outOfStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

module.exports = router;
