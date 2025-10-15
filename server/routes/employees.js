const express = require('express');
const Employee = require('../models/Employee');
const User = require('../models/User');
const router = express.Router();

// Get all employees with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      department, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query['employmentInfo.department'] = department;
    }
    
    if (status) {
      query['employmentInfo.status'] = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const employees = await Employee.find(query)
      .populate('user', 'username email role isActive')
      .populate('employmentInfo.manager', 'personalInfo.firstName personalInfo.lastName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Employee.countDocuments(query);

    res.json({
      employees,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'username email role isActive lastLogin')
      .populate('employmentInfo.manager', 'personalInfo.firstName personalInfo.lastName employeeId');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Failed to fetch employee', error: error.message });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Check if email already exists
    const existingEmployee = await Employee.findOne({ 
      'personalInfo.email': employeeData.personalInfo.email 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        message: 'Employee with this email already exists' 
      });
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({ 
      message: 'Employee created successfully', 
      employee 
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Failed to create employee', error: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email is being changed and if it already exists
    if (req.body.personalInfo?.email && 
        req.body.personalInfo.email !== employee.personalInfo.email) {
      const existingEmployee = await Employee.findOne({ 
        'personalInfo.email': req.body.personalInfo.email 
      });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
    }

    // Deep merge the update
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        Object.assign(employee[key], req.body[key]);
      } else {
        employee[key] = req.body[key];
      }
    });

    await employee.save();

    res.json({ 
      message: 'Employee updated successfully', 
      employee 
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Failed to update employee', error: error.message });
  }
});

// Update attendance
router.post('/:id/attendance', async (req, res) => {
  try {
    const { status, date } = req.body;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.updateAttendance(status, date ? new Date(date) : new Date());
    
    res.json({ 
      message: 'Attendance updated successfully', 
      employee 
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Failed to update attendance', error: error.message });
  }
});

// Get attendance report
router.get('/:id/attendance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // This would typically come from a separate attendance collection
    // For now, return the employee's attendance summary
    res.json({
      employee: {
        id: employee._id,
        name: employee.fullName,
        employeeId: employee.employeeId
      },
      attendance: {
        totalWorkingDays: employee.attendance.totalWorkingDays,
        totalPresentDays: employee.attendance.totalPresentDays,
        totalAbsentDays: employee.attendance.totalAbsentDays,
        totalLateDays: employee.attendance.totalLateDays,
        attendancePercentage: employee.attendancePercentage
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
});

// Get payroll report
router.get('/:id/payroll', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const salary = employee.calculateSalary(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    res.json({
      employee: {
        id: employee._id,
        name: employee.fullName,
        employeeId: employee.employeeId
      },
      payroll: {
        salary,
        payFrequency: employee.compensation.payFrequency,
        benefits: employee.compensation.benefits,
        attendance: {
          totalWorkingDays: employee.attendance.totalWorkingDays,
          totalPresentDays: employee.attendance.totalPresentDays,
          attendancePercentage: employee.attendancePercentage
        }
      }
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Failed to fetch payroll', error: error.message });
  }
});

// Get HR analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ 
      'employmentInfo.status': 'active' 
    });
    const inactiveEmployees = await Employee.countDocuments({ 
      'employmentInfo.status': 'inactive' 
    });

    // Get employees by department
    const employeesByDepartment = await Employee.aggregate([
      {
        $group: {
          _id: '$employmentInfo.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get employees by employment type
    const employeesByType = await Employee.aggregate([
      {
        $group: {
          _id: '$employmentInfo.employmentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get average attendance
    const averageAttendance = await Employee.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' }
        }
      }
    ]);

    res.json({
      overview: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees
      },
      employeesByDepartment,
      employeesByType,
      averageAttendance: averageAttendance[0]?.avgAttendance || 0
    });
  } catch (error) {
    console.error('Get HR analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch HR analytics', error: error.message });
  }
});

// Get departments
router.get('/departments/list', async (req, res) => {
  try {
    const departments = await Employee.distinct('employmentInfo.department');
    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
  }
});

module.exports = router;
