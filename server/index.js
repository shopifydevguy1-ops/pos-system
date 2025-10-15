const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Sample API endpoints
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Laptop Computer', price: 45000, stock: 15, currency: '₱' },
    { id: 2, name: 'Office Chair', price: 8500, stock: 3, currency: '₱' },
    { id: 3, name: 'Wireless Mouse', price: 1200, stock: 0, currency: '₱' }
  ]);
});

app.get('/api/sales', (req, res) => {
  res.json([
    { id: 1, total: 46200, date: '2024-01-15', cashier: 'John Doe' },
    { id: 2, total: 8500, date: '2024-01-15', cashier: 'Jane Smith' },
    { id: 3, total: 12100, date: '2024-01-14', cashier: 'Bob Johnson' }
  ]);
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
});