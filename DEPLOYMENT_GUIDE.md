# JCB Quality Intelligence Platform - Deployment Guide

## 🚀 **COMPLETE SETUP GUIDE FOR NEW ASSETS**

This guide provides step-by-step instructions for deploying the JCB Quality Intelligence Platform on a new asset/machine.

---

## 📋 **PREREQUISITES**

### **System Requirements:**
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher  
- **MongoDB**: Version 6.0 or higher
- **Git**: Latest version
- **RAM**: Minimum 8GB recommended
- **Storage**: Minimum 2GB free space

### **Required Software Installation:**

#### **1. Install Node.js & npm**
```bash
# Download from: https://nodejs.org/
# Verify installation:
node --version  # Should show v18.0+
npm --version   # Should show v8.0+
```

#### **2. Install MongoDB**
```bash
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: Follow MongoDB official installation guide

# Verify installation:
mongod --version  # Should show MongoDB version
```

#### **3. Install Git**
```bash
# Download from: https://git-scm.com/downloads
# Verify installation:
git --version  # Should show Git version
```

---

## 🔧 **INITIAL DEPLOYMENT SETUP**

### **Step 1: Clone the Repository**
```bash
# Navigate to your desired directory
cd C:\Projects  # Windows example
# or
cd ~/Projects   # macOS/Linux example

# Clone the repository
git clone https://github.com/BigTrip1/internal-dash.git

# Navigate to project directory
cd internal-dash
```

### **Step 2: Install Dependencies**
```bash
# Install all required packages
npm install

# Verify installation completed successfully
npm list --depth=0
```

### **Step 3: Environment Configuration**
```bash
# Create environment variables file
# Windows:
copy .env.example .env.local
# macOS/Linux:
cp .env.example .env.local

# Edit the .env.local file with your MongoDB connection string
# Default local MongoDB connection:
MONGODB_URI=mongodb://127.0.0.1:27017/dpu_master
```

### **Step 4: Start MongoDB Service**
```bash
# Windows (as Administrator):
net start MongoDB
# Alternative:
mongod --dbpath "C:\data\db"

# macOS:
brew services start mongodb-community
# Alternative:
mongod --config /usr/local/etc/mongod.conf

# Linux:
sudo systemctl start mongod
# Alternative:
sudo service mongod start

# Verify MongoDB is running:
mongo --eval "db.stats()"
```

### **Step 5: Initial Database Setup**
```bash
# Build the Next.js application
npm run build

# Start the development server
npm run dev

# The application will be available at: http://localhost:3000
```

### **Step 6: Seed the Database**
```bash
# Option 1: Use the web interface
# Navigate to: http://localhost:3000/seed
# Click "Seed Database" button

# Option 2: Use direct API call
curl -X POST http://localhost:3000/api/seed

# Option 3: Use the seed script directly
npm run seed  # If available in package.json
```

---

## 🔄 **ONGOING UPDATES & MAINTENANCE**

### **Regular Update Process**
```bash
# Navigate to project directory
cd path/to/internal-dash

# Fetch latest changes from repository
git fetch origin main

# Check for updates
git status

# Pull latest updates
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart the development server
npm run dev
```

### **Update Verification Checklist**
- [ ] Application starts without errors: `http://localhost:3000`
- [ ] Dashboard displays correctly with all KPI cards
- [ ] Admin panel loads and shows data table
- [ ] Chart displays with proper trend line and data
- [ ] Monthly report generation works
- [ ] Database seeding functions properly

---

## 🗄️ **DATABASE MANAGEMENT**

### **Database Backup**
```bash
# Create backup of current database
mongodump --db dpu_master --out ./backups/$(date +%Y%m%d_%H%M%S)

# Windows PowerShell:
mongodump --db dpu_master --out "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### **Database Restore**
```bash
# Restore from backup
mongorestore --db dpu_master ./backups/YYYYMMDD_HHMMSS/dpu_master

# Clear and reseed database
# Navigate to: http://localhost:3000/seed
# Click "Clear Database" then "Seed Database"
```

### **Database Connection Troubleshooting**
```bash
# Test MongoDB connection
mongo dpu_master --eval "db.stats()"

# Check if MongoDB service is running
# Windows:
sc query MongoDB
# macOS/Linux:
ps aux | grep mongod

# Restart MongoDB service
# Windows:
net stop MongoDB && net start MongoDB
# macOS:
brew services restart mongodb-community
# Linux:
sudo systemctl restart mongod
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Build for Production**
```bash
# Clean previous builds
npm run clean  # If available

# Build optimized production version
npm run build

# Start production server
npm start

# Application will be available at: http://localhost:3000
```

### **Production Environment Variables**
```bash
# Create production environment file
# .env.production.local

NODE_ENV=production
MONGODB_URI=mongodb://your-production-server:27017/dpu_master
PORT=3000

# For production MongoDB (if using MongoDB Atlas):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpu_master?retryWrites=true&w=majority
```

### **Production Server Setup (Windows Service)**
```bash
# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'jcb-quality-dashboard',
    script: 'npm',
    args: 'start',
    cwd: './internal-dash',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Issue: "Module not found" errors**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json  # macOS/Linux
# Windows:
rmdir /s node_modules && del package-lock.json

npm install
```

#### **Issue: MongoDB connection failed**
```bash
# Check MongoDB status
# Windows:
sc query MongoDB
# macOS/Linux:
sudo systemctl status mongod

# Restart MongoDB
# Windows:
net stop MongoDB && net start MongoDB
# macOS:
brew services restart mongodb-community
# Linux:
sudo systemctl restart mongod

# Check MongoDB logs
# Windows: C:\Program Files\MongoDB\Server\6.0\log\mongod.log
# macOS: /usr/local/var/log/mongodb/mongo.log
# Linux: /var/log/mongodb/mongod.log
```

#### **Issue: Port 3000 already in use**
```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000
# macOS/Linux:
lsof -i :3000

# Kill the process
# Windows:
taskkill /PID <PID> /F
# macOS/Linux:
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### **Issue: Build fails**
```bash
# Clear Next.js cache
npx next clean

# Remove and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

---

## 📊 **TESTING DEPLOYMENT**

### **Deployment Verification Script**
```bash
#!/bin/bash
# save as verify-deployment.sh

echo "🔍 Verifying JCB Quality Dashboard Deployment..."

# Check Node.js
echo "✅ Node.js version: $(node --version)"

# Check npm
echo "✅ npm version: $(npm --version)"

# Check MongoDB
if mongod --version > /dev/null 2>&1; then
    echo "✅ MongoDB installed"
else
    echo "❌ MongoDB not found"
fi

# Check if application starts
echo "🚀 Starting application..."
timeout 30 npm run dev &
sleep 10

# Check if port 3000 is responding
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running on http://localhost:3000"
else
    echo "❌ Application not responding"
fi

echo "🎉 Deployment verification complete!"
```

### **Run Verification**
```bash
# Make executable (macOS/Linux)
chmod +x verify-deployment.sh
./verify-deployment.sh

# Windows (PowerShell)
# Create verify-deployment.ps1 and run:
PowerShell -ExecutionPolicy Bypass -File verify-deployment.ps1
```

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation Files**
- `README.md` - Project overview and quick start
- `MONTHLY_REPORT_GUIDE.md` - Monthly reporting system guide
- `FUTURE_ROADMAP.md` - Development roadmap and future plans

### **Key Directories**
- `/src/components/` - React components
- `/src/app/api/` - API endpoints
- `/src/utils/` - Utility functions and data processing
- `/public/` - Static assets (JCB logo, etc.)

### **Important URLs**
- **Dashboard**: `http://localhost:3000/`
- **Admin Panel**: `http://localhost:3000/admin`
- **Database Seeding**: `http://localhost:3000/seed`
- **API Health Check**: `http://localhost:3000/api/test`

### **Support Contacts**
- **Repository**: https://github.com/BigTrip1/internal-dash
- **Issues**: https://github.com/BigTrip1/internal-dash/issues

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Daily Operations**
```bash
# Start development server
npm run dev

# Pull latest updates
git pull origin main && npm install && npm run build

# Backup database
mongodump --db dpu_master --out ./backup-$(date +%Y%m%d)

# Restart application
pm2 restart jcb-quality-dashboard  # If using PM2
```

### **Emergency Commands**
```bash
# Complete reset (nuclear option)
git reset --hard origin/main
rm -rf node_modules package-lock.json
npm install
npm run build
npm run dev

# Database reset
mongo dpu_master --eval "db.dropDatabase()"
# Then reseed via http://localhost:3000/seed
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Node.js 18+ installed
- [ ] MongoDB 6.0+ installed and running
- [ ] Git installed and configured
- [ ] Repository access confirmed

### **Initial Setup**
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] MongoDB service started
- [ ] Database seeded with initial data

### **Post-Deployment**
- [ ] Application accessible at `http://localhost:3000`
- [ ] Dashboard displays correctly
- [ ] Admin panel functional
- [ ] Chart rendering properly
- [ ] Monthly report generation working
- [ ] All API endpoints responding

### **Production Readiness**
- [ ] Production build successful (`npm run build`)
- [ ] Production environment variables set
- [ ] Process manager configured (PM2)
- [ ] Backup strategy implemented
- [ ] Update procedure documented
- [ ] Monitoring configured

---

**🎉 CONGRATULATIONS! Your JCB Quality Intelligence Platform is now deployed and ready for use!**

For any issues or questions, refer to the troubleshooting section or check the project repository for updates.
