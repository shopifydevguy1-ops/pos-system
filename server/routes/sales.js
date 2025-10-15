const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const router = express.Router();

// Get all sales with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      cashier, 
      status,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (cashier) {
      query.cashier = cashier;
    }
    
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sales = await Sale.find(query)
      .populate('cashier', 'firstName lastName username')
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name sku price')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'firstName lastName username')
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'name sku price cost');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Failed to fetch sale', error: error.message });
  }
});

// Create new sale
router.post('/', async (req, res) => {
  try {
    const saleData = req.body;
    
    // Validate products and update stock
    for (const item of saleData.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `Product with ID ${item.product} not found` 
        });
      }
      
      if (product.stock.current < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock.current}` 
        });
      }
    }

    // Create sale
    const sale = new Sale(saleData);
    sale.calculateTotals();
    await sale.save();

    // Update product stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'stock.current': -item.quantity } }
      );
    }

    // Populate the sale for response
    await sale.populate([
      { path: 'cashier', select: 'firstName lastName username' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name sku price' }
    ]);

    res.status(201).json({ 
      message: 'Sale created successfully', 
      sale 
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Failed to create sale', error: error.message });
  }
});

// Process refund
router.post('/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    await sale.processRefund(amount, reason, req.user.userId);
    
    res.json({ 
      message: 'Refund processed successfully', 
      sale 
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
});

// Get sales analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const analytics = await Sale.aggregate([
      { $match: { ...matchQuery, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$profit' },
          averageSale: { $avg: '$total' }
        }
      }
    ]);

    // Get sales by payment method
    const salesByPaymentMethod = await Sale.aggregate([
      { $match: { ...matchQuery, status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    // Get daily sales for the last 30 days
    const dailySales = await Sale.aggregate([
      { 
        $match: { 
          ...matchQuery, 
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: analytics[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageSale: 0
      },
      salesByPaymentMethod,
      dailySales
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch sales analytics', error: error.message });
  }
});

// Get top selling products
router.get('/analytics/top-products', async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const topProducts = await Sale.aggregate([
      { $match: { ...matchQuery, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productSku: '$product.sku',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ topProducts });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ message: 'Failed to fetch top products', error: error.message });
  }
});

// Get sales by cashier
router.get('/analytics/by-cashier', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const salesByCashier = await Sale.aggregate([
      { $match: { ...matchQuery, status: 'completed' } },
      {
        $group: {
          _id: '$cashier',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'cashier'
        }
      },
      { $unwind: '$cashier' },
      {
        $project: {
          cashierName: { $concat: ['$cashier.firstName', ' ', '$cashier.lastName'] },
          totalSales: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ salesByCashier });
  } catch (error) {
    console.error('Get sales by cashier error:', error);
    res.status(500).json({ message: 'Failed to fetch sales by cashier', error: error.message });
  }
});

module.exports = router;
