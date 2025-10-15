# POS System - Point of Sale Management

A comprehensive Point of Sale (POS) system built with Node.js, Express, MongoDB, and React. This system includes inventory management, sales tracking, HRIS (Human Resources Information System), and cloud connectivity.

## 🚀 Features

### 📦 Inventory Management
- Product catalog with categories and variants
- Stock tracking with low stock alerts
- Barcode support
- Supplier management
- Advanced search and filtering

### 💰 Sales Management
- Point of sale interface
- Multiple payment methods (cash, card, digital wallet)
- Receipt generation
- Sales analytics and reporting
- Refund processing

### 👥 HRIS (Human Resources)
- Employee management
- Attendance tracking
- Payroll calculations
- Performance reviews
- Document management

### ☁️ Cloud Integration
- Real-time data synchronization
- Backup and restore functionality
- Multi-location support
- Remote access capabilities

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd POS
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   mongod
   
   # The application will create the database automatically
   ```

5. **Start the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately:
   # Server: npm run server
   # Client: npm run client
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pos_system
DB_NAME=pos_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Cloud Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloud Server Configuration
CLOUD_SERVER_URL=https://your-cloud-server.com/api
CLOUD_API_KEY=your_cloud_api_key
```

## 📱 Usage

### Initial Setup

1. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The server runs on `http://localhost:5000`

2. **Create Admin User**
   - Register the first user with admin privileges
   - This user will have full system access

3. **Configure Settings**
   - Go to Settings page
   - Configure store information
   - Set up cloud connectivity (optional)

### Daily Operations

1. **Inventory Management**
   - Add products and categories
   - Set stock levels and alerts
   - Manage suppliers

2. **Sales Processing**
   - Use the POS interface for transactions
   - Process different payment methods
   - Generate receipts

3. **Employee Management**
   - Add employees and set roles
   - Track attendance
   - Manage payroll

4. **Reports & Analytics**
   - View sales reports
   - Monitor inventory levels
   - Track employee performance

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session management
- Input validation and sanitization
- Rate limiting
- CORS protection

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Inventory
- `GET /api/inventory/products` - Get products
- `POST /api/inventory/products` - Create product
- `PUT /api/inventory/products/:id` - Update product
- `DELETE /api/inventory/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/refund` - Process refund

### Employees
- `GET /api/employees` - Get employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `POST /api/employees/:id/attendance` - Update attendance

### Cloud
- `POST /api/cloud/sync` - Sync data to cloud
- `GET /api/cloud/fetch` - Fetch data from cloud
- `POST /api/cloud/backup` - Create backup

## 🚀 Deployment

### Production Build

```bash
# Build the client
cd client
npm run build
cd ..

# Start production server
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@pos-system.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release
  - Basic POS functionality
  - Inventory management
  - Sales tracking
  - Employee management
  - Cloud integration

## 📞 Contact

- **Developer**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

---

**Note**: This is a comprehensive POS system designed for small to medium businesses. Make sure to configure all security settings properly before deploying to production.
