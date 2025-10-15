# Deploy POS System to Render

This guide will help you deploy your POS system to Render for free.

## 🚀 Quick Deployment Steps

### 1. Connect to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository: `https://github.com/atShopifyDevGuy/pos-system`

### 2. Configure Build Settings

**Build Command:**
```bash
npm install && cd client && npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment:**
- Node.js

### 3. Environment Variables

Add these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_system
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=365d
CLOUD_SERVER_URL=https://your-cloud-server.com/api
CLOUD_API_KEY=your_cloud_api_key
```

### 4. Database Setup

1. In Render dashboard, go to "New +" → "PostgreSQL" (or MongoDB Atlas)
2. Create a new database
3. Copy the connection string to `MONGODB_URI` environment variable

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Your app will be available at: `https://your-app-name.onrender.com`

## 🔧 Alternative: Using render.yaml

You can also use the included `render.yaml` file for automatic configuration:

1. Push the `render.yaml` file to your repository
2. In Render dashboard, select "Infrastructure as Code"
3. Connect your repository
4. Render will automatically configure everything

## 📝 Post-Deployment

### 1. Access Your Application
- Your POS system will be live at the provided Render URL
- The first user you register will have admin privileges

### 2. Configure Settings
- Go to Settings page in your deployed app
- Update store information
- Configure cloud sync (optional)

### 3. Set Up Database
- The application will create necessary collections automatically
- You can add sample data through the admin interface

## 🔒 Security Considerations

1. **Change Default Secrets**: Update JWT_SECRET and other sensitive values
2. **Database Security**: Use strong passwords for database connections
3. **HTTPS**: Render provides HTTPS by default
4. **Environment Variables**: Keep sensitive data in environment variables

## 📊 Monitoring

Render provides:
- Automatic deployments on git push
- Health checks
- Logs and metrics
- SSL certificates

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in package.json
2. **Database Connection**: Verify MONGODB_URI is correct
3. **Environment Variables**: Ensure all required variables are set

### Debug Steps:

1. Check Render logs in the dashboard
2. Verify environment variables
3. Test database connection
4. Check build logs for errors

## 🔄 Updates

To update your application:
1. Push changes to your GitHub repository
2. Render will automatically rebuild and deploy
3. No manual intervention required

## 💰 Cost

- **Free Tier**: 750 hours/month
- **Database**: Free PostgreSQL or MongoDB Atlas free tier
- **Custom Domain**: Optional (paid)

Your POS system will run completely free on Render's free tier!
