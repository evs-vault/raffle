# RazzWars Deployment Guide - Render

This guide will help you deploy your RazzWars memory game application to Render.

## 🚀 Quick Deploy (Recommended)

### Option 1: One-Click Deploy with render.yaml

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository and branch
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to deploy all services

### Option 2: Manual Deploy (Step by Step)

#### Step 1: Create Database
1. Go to [render.com](https://render.com)
2. Click "New +" → "PostgreSQL"
3. Name: `razzwars-db`
4. Plan: Free
5. Click "Create Database"

#### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `razzwars-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-super-secret-jwt-key
   DEFAULT_ADMIN_PASSWORD=admin123
   DB_HOST=from-database
   DB_PORT=from-database
   DB_NAME=from-database
   DB_USER=from-database
   DB_PASSWORD=from-database
   CLIENT_URL=https://razzwars-admin.onrender.com,https://razzwars-player.onrender.com
   ```

5. Click "Create Web Service"

#### Step 3: Deploy Admin Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `razzwars-admin`
   - **Build Command**: `cd admin && npm install && npm run build`
   - **Publish Directory**: `admin/build`
   - **Plan**: Free

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://razzwars-backend.onrender.com
   ```

5. Click "Create Static Site"

#### Step 4: Deploy Player Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `razzwars-player`
   - **Build Command**: `cd player && npm install && npm run build`
   - **Publish Directory**: `player/build`
   - **Plan**: Free

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://razzwars-backend.onrender.com
   REACT_APP_ADMIN_URL=https://razzwars-admin.onrender.com
   ```

5. Click "Create Static Site"

## 🔧 Configuration Details

### Backend Service
- **Runtime**: Node.js
- **Port**: 10000 (Render assigns this)
- **Health Check**: `/api/health`
- **Database**: PostgreSQL (free tier)

### Frontend Services
- **Admin Panel**: Static site with React build
- **Player Interface**: Static site with React build
- **CDN**: Global CDN for fast loading

## 🌐 URLs After Deployment

- **Backend API**: `https://razzwars-backend.onrender.com`
- **Admin Panel**: `https://razzwars-admin.onrender.com`
- **Player Interface**: `https://razzwars-player.onrender.com`

## 🔐 Security Notes

1. **Change Default Password**: Update `DEFAULT_ADMIN_PASSWORD` in production
2. **JWT Secret**: Use a strong, unique JWT secret
3. **CORS**: Configured for your specific domains
4. **Rate Limiting**: Currently disabled for development

## 📊 Monitoring

- **Health Check**: Visit `https://razzwars-backend.onrender.com/api/health`
- **Logs**: Available in Render dashboard
- **Metrics**: Basic metrics in free tier

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Render dashboard

2. **Database Connection**:
   - Ensure database is created first
   - Check environment variables are set correctly
   - Verify database credentials

3. **CORS Issues**:
   - Update CLIENT_URL with actual deployed URLs
   - Check CORS configuration in server/index.js

4. **Static Site Issues**:
   - Verify build command and publish directory
   - Check environment variables for API URLs

### Debug Steps:

1. Check Render service logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for errors

## 💰 Cost Breakdown

- **Database**: Free (512MB storage)
- **Backend**: Free (750 hours/month)
- **Admin Frontend**: Free
- **Player Frontend**: Free
- **Total**: $0/month (Free tier)

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Render automatically redeploys (if auto-deploy is enabled)
3. Or manually trigger redeploy from Render dashboard

## 📝 Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic with Render)
3. Set up monitoring and alerts
4. Configure backup strategy for database
5. Set up CI/CD pipeline for automated testing

---

**Need Help?** Check the [Render Documentation](https://render.com/docs) or contact support.
