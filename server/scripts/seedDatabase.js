const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@pos-system.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Food & Beverages', description: 'Food and drink items' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log('✅ Categories created');

    // Create sample products
    const products = [
      {
        name: 'Wireless Headphones',
        sku: 'WH-001',
        description: 'High-quality wireless headphones with noise cancellation',
        category: createdCategories[0]._id,
        price: 99.99,
        cost: 60.00,
        stock: { current: 50, minimum: 10, maximum: 100 },
        brand: 'TechBrand',
        tags: ['electronics', 'audio', 'wireless']
      },
      {
        name: 'Cotton T-Shirt',
        sku: 'TS-001',
        description: 'Comfortable cotton t-shirt in various sizes',
        category: createdCategories[1]._id,
        price: 19.99,
        cost: 12.00,
        stock: { current: 100, minimum: 20, maximum: 200 },
        brand: 'FashionBrand',
        tags: ['clothing', 'cotton', 'casual']
      },
      {
        name: 'Coffee Beans',
        sku: 'CB-001',
        description: 'Premium roasted coffee beans',
        category: createdCategories[2]._id,
        price: 15.99,
        cost: 8.00,
        stock: { current: 30, minimum: 5, maximum: 50 },
        brand: 'CoffeeBrand',
        tags: ['food', 'beverage', 'coffee']
      },
      {
        name: 'Programming Book',
        sku: 'PB-001',
        description: 'Complete guide to modern programming',
        category: createdCategories[3]._id,
        price: 49.99,
        cost: 25.00,
        stock: { current: 25, minimum: 5, maximum: 50 },
        brand: 'TechBooks',
        tags: ['books', 'programming', 'education']
      },
      {
        name: 'Garden Tools Set',
        sku: 'GT-001',
        description: 'Complete set of garden tools',
        category: createdCategories[4]._id,
        price: 79.99,
        cost: 45.00,
        stock: { current: 15, minimum: 3, maximum: 30 },
        brand: 'GardenPro',
        tags: ['garden', 'tools', 'outdoor']
      }
    ];

    await Product.insertMany(products);
    console.log('✅ Sample products created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@pos-system.com');
    console.log('Password: admin123');
    console.log('\n🚀 You can now start your application with: npm run dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();
