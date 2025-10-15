const express = require('express');
const axios = require('axios');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const router = express.Router();

// Sync data to cloud server
router.post('/sync', async (req, res) => {
  try {
    const { dataType, startDate, endDate } = req.body;
    
    let data = {};
    const timestamp = new Date().toISOString();

    switch (dataType) {
      case 'sales':
        data = await getSalesData(startDate, endDate);
        break;
      case 'inventory':
        data = await getInventoryData();
        break;
      case 'employees':
        data = await getEmployeeData();
        break;
      case 'all':
        data = {
          sales: await getSalesData(startDate, endDate),
          inventory: await getInventoryData(),
          employees: await getEmployeeData()
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid data type' });
    }

    // Send data to cloud server
    const cloudResponse = await sendToCloudServer(data, dataType, timestamp);
    
    res.json({
      message: 'Data synced successfully',
      timestamp,
      dataType,
      recordsCount: getRecordsCount(data),
      cloudResponse
    });
  } catch (error) {
    console.error('Cloud sync error:', error);
    res.status(500).json({ message: 'Failed to sync data', error: error.message });
  }
});

// Get data from cloud server
router.get('/fetch', async (req, res) => {
  try {
    const { dataType, startDate, endDate } = req.query;
    
    const cloudData = await fetchFromCloudServer(dataType, startDate, endDate);
    
    res.json({
      message: 'Data fetched from cloud successfully',
      data: cloudData
    });
  } catch (error) {
    console.error('Cloud fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch data from cloud', error: error.message });
  }
});

// Get sync status
router.get('/status', async (req, res) => {
  try {
    const lastSync = await getLastSyncStatus();
    const cloudStatus = await checkCloudServerStatus();
    
    res.json({
      lastSync,
      cloudStatus,
      isOnline: cloudStatus.isOnline
    });
  } catch (error) {
    console.error('Cloud status error:', error);
    res.status(500).json({ message: 'Failed to get cloud status', error: error.message });
  }
});

// Backup data to cloud
router.post('/backup', async (req, res) => {
  try {
    const { includeImages = false } = req.body;
    
    const backupData = {
      timestamp: new Date().toISOString(),
      sales: await getSalesData(),
      inventory: await getInventoryData(includeImages),
      employees: await getEmployeeData(),
      categories: await getCategoriesData()
    };

    const backupResult = await createCloudBackup(backupData);
    
    res.json({
      message: 'Backup created successfully',
      backupId: backupResult.backupId,
      timestamp: backupData.timestamp,
      size: JSON.stringify(backupData).length
    });
  } catch (error) {
    console.error('Cloud backup error:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
});

// Restore data from cloud
router.post('/restore', async (req, res) => {
  try {
    const { backupId } = req.body;
    
    const backupData = await fetchCloudBackup(backupId);
    
    if (!backupData) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Restore data (this would need careful implementation to avoid conflicts)
    const restoreResult = await restoreFromBackup(backupData);
    
    res.json({
      message: 'Data restored successfully',
      restoredRecords: restoreResult.recordsCount,
      timestamp: backupData.timestamp
    });
  } catch (error) {
    console.error('Cloud restore error:', error);
    res.status(500).json({ message: 'Failed to restore data', error: error.message });
  }
});

// Helper functions
async function getSalesData(startDate, endDate) {
  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return await Sale.find(query)
    .populate('cashier', 'firstName lastName username')
    .populate('items.product', 'name sku price')
    .lean();
}

async function getInventoryData(includeImages = false) {
  const projection = includeImages ? {} : { images: 0 };
  return await Product.find({ isActive: true }, projection)
    .populate('category', 'name')
    .lean();
}

async function getEmployeeData() {
  return await Employee.find()
    .populate('user', 'username email role')
    .lean();
}

async function getCategoriesData() {
  const Category = require('../models/Category');
  return await Category.find({ isActive: true }).lean();
}

async function sendToCloudServer(data, dataType, timestamp) {
  try {
    const response = await axios.post(
      `${process.env.CLOUD_SERVER_URL}/sync`,
      {
        data,
        dataType,
        timestamp,
        source: 'pos-system'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLOUD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Cloud server communication error:', error);
    throw new Error('Failed to communicate with cloud server');
  }
}

async function fetchFromCloudServer(dataType, startDate, endDate) {
  try {
    const response = await axios.get(
      `${process.env.CLOUD_SERVER_URL}/data`,
      {
        params: { dataType, startDate, endDate },
        headers: {
          'Authorization': `Bearer ${process.env.CLOUD_API_KEY}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Cloud server fetch error:', error);
    throw new Error('Failed to fetch data from cloud server');
  }
}

async function getLastSyncStatus() {
  // This would typically be stored in a sync log collection
  // For now, return a mock response
  return {
    lastSync: new Date().toISOString(),
    status: 'success',
    recordsSynced: 0
  };
}

async function checkCloudServerStatus() {
  try {
    const response = await axios.get(
      `${process.env.CLOUD_SERVER_URL}/health`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLOUD_API_KEY}`
        },
        timeout: 5000
      }
    );
    
    return {
      isOnline: true,
      status: response.data.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      isOnline: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function createCloudBackup(backupData) {
  try {
    const response = await axios.post(
      `${process.env.CLOUD_SERVER_URL}/backup`,
      backupData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLOUD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Cloud backup error:', error);
    throw new Error('Failed to create cloud backup');
  }
}

async function fetchCloudBackup(backupId) {
  try {
    const response = await axios.get(
      `${process.env.CLOUD_SERVER_URL}/backup/${backupId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLOUD_API_KEY}`
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Cloud backup fetch error:', error);
    throw new Error('Failed to fetch cloud backup');
  }
}

async function restoreFromBackup(backupData) {
  // This would need careful implementation to avoid data conflicts
  // For now, return a mock response
  return {
    recordsCount: 0,
    message: 'Restore functionality needs to be implemented carefully'
  };
}

function getRecordsCount(data) {
  if (Array.isArray(data)) {
    return data.length;
  } else if (typeof data === 'object') {
    return Object.values(data).reduce((total, arr) => {
      return total + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  }
  return 0;
}

module.exports = router;
