# JCB Digital Factory - Quality Performance Dashboard

## 📊 **Overview**

A comprehensive quality management dashboard for JCB Digital Factory, featuring monthly performance reporting, DPU (Defects Per Unit) tracking, and automated glide path calculations to achieve quality targets.

## 🎯 **Key Features**

### **Dashboard Analytics**
- **Real-time KPI Cards**: Current DPU, Build Volume, Fault Tracking (all stage-specific)
- **Interactive Charts**: DPU trends with trendline analysis and build volume correlation
- **Stage Performance**: Detailed breakdown by inspection stage
- **Monthly Summary Tables**: Complete data overview with trend indicators
- **Trajectory Performance Analysis**: 4 interactive cards (Target Glide Path, Performance Trajectory, Gap Analysis, Forecast)
- **Enhanced Reports Dropdown**: Professional 21-report system with search and filtering

### **Monthly Quality Reports**
- **21-Report System**: Comprehensive reporting suite with dynamic content
- **Individual Stage Reports**: Detailed analysis for each production stage
- **Automated Report Generation**: Professional PDF reports for management
- **Glide Path Analysis**: Monthly reduction targets to achieve 8.2 DPU by year-end
- **Executive Summary**: Key metrics and performance indicators
- **Critical Actions**: Management attention items with priority levels
- **JCB Branding**: Corporate styling with logo integration

### **Data Management**
- **MongoDB Integration**: Persistent data storage with fallback to localStorage
- **Admin Panel**: Real-time data editing and stage management with three separate totals sections
- **CSV Upload**: Bulk import inspection data from Excel/CSV files with automatic stage detection
- **Data Export**: JSON and CSV formats for external analysis
- **Real-time Updates**: Live dashboard updates with data changes
- **Separate Totals Tracking**: Production, DPDI, and Combined totals with signout volume metrics

### **Intervention Tracking System** 🆕
- **Add Improvement Plans**: Document initiatives per stage (training, process changes, tooling, etc.)
- **Dual-Scenario Forecasting**: Compare "baseline trajectory" vs "with interventions"
- **Confidence-Based Projections**: Weight interventions by confidence level and status
- **Interactive Cards**: Click any of the 4 trajectory cards to add/edit improvement plans
- **Impact Tracking**: Record estimated and actual DPU reductions
- **Ownership & Timelines**: Assign owners and cut-in dates for accountability
- **Progress Monitoring**: Track intervention status (Planned → In Progress → Completed)
- **Strategic Planning**: Transform from reactive monitoring to proactive quality management

## 🆕 **Recent Updates (December 2024)**

### **Major Improvements**
- ✅ **Runtime Error Fixes**: Resolved critical TypeError crashes with comprehensive null safety
- ✅ **Individual Stage Reports**: Fixed all 18 stage reports to populate data correctly
- ✅ **Enhanced Reports Dropdown**: Complete rebuild with search, filtering, and professional UI
- ✅ **TypeScript Error Resolution**: Fixed 16+ compilation errors for better code quality
- ✅ **Bulletproof Error Handling**: Graceful handling of empty data and edge cases

### **New Features**
- 🔍 **Smart Search**: Real-time search and filtering in reports dropdown
- 📊 **21-Report System**: Complete reporting suite with dynamic content
- 🎨 **Professional UI**: Modern, enterprise-grade design with JCB branding
- 📱 **Responsive Design**: Works perfectly on all screen sizes
- ⚡ **Performance Optimized**: Faster loading and smoother interactions

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or cloud instance)
- Git

### **Installation**
```bash
# Clone the repository
git clone https://github.com/BigTrip1/dpumaster.git
cd dpumaster/inspection-dashboard

# Create .env.local file (recommended for corporate networks)
echo "PUPPETEER_SKIP_DOWNLOAD=true" > .env.local
echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> .env.local
echo "MONGODB_URI=mongodb://127.0.0.1:27017/dpu_master" >> .env.local

# Install dependencies (Puppeteer will be skipped if .env.local is configured)
npm install

# Start MongoDB (if running locally)
mongod

# Run the development server
npm run dev
```

**Note:** If you encounter Puppeteer installation errors, see the [Troubleshooting](#-troubleshooting) section below.

### **Environment Variables**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/dpu_master
NODE_ENV=development
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## 📋 **Usage**

### **Dashboard Navigation**
- **Dashboard**: Main performance overview with KPI cards and charts
- **Admin Panel**: Data management, report generation, and system configuration
- **Reports Dropdown**: 21 different report types with search and filtering capabilities

### **Reports System**
1. **Access Reports**: Click the "Reports" dropdown in the navigation bar
2. **Search & Filter**: Use the search bar and category filters to find specific reports
3. **Report Types Available**:
   - **Overview Reports**: Combined, Production, DPDI performance analysis
   - **Stage Reports**: Individual analysis for each production stage (18 stages)
4. **Professional UI**: Modern dropdown with JCB branding and smooth interactions

### **Monthly Reporting Process**
1. Navigate to **Admin Panel → Monthly Report Generator**
2. Click **"Preview Report"** to review content
3. Click **"Download & Print PDF"** to generate report
4. Attach PDF to monthly management emails

### **Data Management**
1. Use **Admin Panel** to edit inspection data
2. Add/remove inspection stages as needed
3. **Bulk Import**: Click **"Upload CSV"** button to import inspection data from Excel
4. Export data using **Download Data** button (JSON + CSV formats)

### **CSV Upload Process**
1. **⚠️ Export current data first** (Download JSON/CSV for backup)
2. Prepare your CSV file with inspection data (see `DOCS/CSV_UPLOAD_FEATURE.md`)
   - **Required columns**: `PRODUCTION TOTAL INSPECTIONS`, `PRODUCTION TOTAL FAULTS`, `PRODUCTION TOTAL DPU`
   - **Required columns**: `DPDI TOTAL INSPECTIONS`, `DPDI TOTAL FAULTS`, `DPDI TOTAL DPU`
   - **Required columns**: `COMBINED INSPECTIONS`, `COMBINED FAULTS`, `COMBINED DPU INC DPDI`
   - **Required column**: `SIGNOUT VOLUME` (used for build volume tracking in charts)
3. Navigate to **Admin Panel**
4. Click **"Upload CSV"** button (purple button, top-right)
5. Select your CSV file
6. Review upload summary (months updated, new stages added)
7. Click **"Close & Reload Data"** to refresh the page
8. Verify new data appears in admin table with three separate totals sections

**⚠️ Important:** CSV upload uses a **complete replacement strategy** - all existing data is cleared before importing. Always backup first!

## 🎯 **Quality Targets**

### **Current Performance**
- **Current DPU**: 12.87 (September 2025)
- **Year-end Target**: 8.2 DPU by December 2025
- **Required Monthly Reduction**: 1.17 DPU per month
- **Risk Assessment**: "At Risk" - Enhanced measures required

### **Glide Path Targets**
```
Oct-25: 11.70 DPU
Nov-25: 10.53 DPU  
Dec-25: 9.36 DPU
Jan-26: 8.20 DPU ✅ TARGET ACHIEVED
```

## 🏭 **JCB Branding**

The system features complete JCB corporate branding:
- **JCB Logo Integration**: Header and footer placement
- **Corporate Colors**: JCB Yellow (#FCB026) and Black
- **Industrial Styling**: Professional gradients and shadows
- **Company Information**: Full corporate details and location

## 📊 **Technical Architecture**

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with JCB theme
- **Recharts**: Interactive data visualizations

### **Backend**
- **MongoDB**: NoSQL database for data persistence
- **API Routes**: Next.js serverless functions
- **Data Context**: React Context for global state management

### **Key Components**
- `Dashboard.tsx`: Main performance dashboard
- `AdminTable.tsx`: Data management interface
- `MonthlyReportGenerator.tsx`: Report generation system
- `Navigation.tsx`: JCB-branded navigation header

### **Utilities**
- `glidePath.ts`: Target calculation algorithms
- `reportGenerator.ts`: PDF report creation
- `dataUtils.ts`: Data formatting and calculations

## 📈 **Data Structure**

### **Inspection Data**
```typescript
interface InspectionData {
  id: string;
  date: string; // Format: "Jan-25"
  totalInspections: number;
  totalFaults: number;
  totalDpu: number;
  stages: InspectionStage[];
}

interface InspectionStage {
  id: string;
  name: string; // e.g., "UV2", "CABWT", "SIP6"
  inspected: number;
  faults: number;
  dpu: number;
}
```

## 🛠️ **Troubleshooting**

### **Puppeteer Installation Issues (Corporate Networks)**

If you encounter SSL certificate errors or Puppeteer download failures:

#### **Solution 1: Skip Puppeteer Download (Recommended)**
```bash
# Set environment variables before npm install
set PUPPETEER_SKIP_DOWNLOAD=true
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Then run npm install
npm install
```

#### **Solution 2: Create .env.local file**
Create a `.env.local` file in the `inspection-dashboard` directory:
```env
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
MONGODB_URI=mongodb://127.0.0.1:27017/dpu_master
```

#### **Solution 3: Clear npm cache and retry**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Set environment variables and reinstall
set PUPPETEER_SKIP_DOWNLOAD=true
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm install
```

#### **Solution 4: Corporate Proxy Issues**
If behind a corporate firewall:
```bash
# Configure npm proxy (if needed)
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port

# Set strict SSL to false (temporary)
npm config set strict-ssl false

# Run installation
npm install

# Re-enable strict SSL after installation
npm config set strict-ssl true
```

### **MongoDB Connection Issues**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# If MongoDB is not installed locally, use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env.local with your Atlas connection string
```

### **Port Already in Use**
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### **Node.js Version Issues**
```bash
# Check Node.js version (requires 18+)
node --version

# If using older version, install Node.js 18+ from nodejs.org
```

## 🔧 **Development**

### **Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### **Database Setup**
```bash
# Seed initial data
node scripts/seed-database.js

# Check MongoDB connection
node scripts/check-mongodb.js
```

## 📧 **Monthly Report Distribution**

### **Email Template**
```
Subject: JCB Digital Factory - Monthly Quality Performance Report - Month Ending [DATE]

Dear Management Team,

Please find attached the monthly quality performance report for the month ending [DATE].

KEY HIGHLIGHTS:
• Current DPU: 12.87 (Target: 11.70) - AT RISK
• Critical Focus: CFC stage performance
• Achievement: UV3 stage improvement

IMMEDIATE ACTIONS:
1. Quality Management: Enhanced CFC protocols
2. Production: Review process controls  
3. Management: Resource allocation approval

Dashboard screenshots with analysis attached.
```

## 🤝 **Contributing**

1. Fork the dpumaster repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is proprietary software for JCB Digital Factory.

## 📞 **Support**

For technical support or questions:
- **Repository**: [https://github.com/BigTrip1/dpumaster](https://github.com/BigTrip1/dpumaster)
- **Issues**: Create a GitHub issue for bug reports or feature requests

---

**JCB Digital Factory Quality Management System**  
*Rocester, Staffordshire, UK*  
*© 2025 J.C.Bamford Excavators Limited*