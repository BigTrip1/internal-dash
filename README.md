# JCB Digital Factory - Quality Performance Dashboard

## 📊 **Overview**

A comprehensive quality management dashboard for JCB Digital Factory, featuring monthly performance reporting, DPU (Defects Per Unit) tracking, and automated glide path calculations to achieve quality targets.

## 🎯 **Key Features**

### **Dashboard Analytics**
- **Real-time KPI Cards**: Current DPU, Build Volume, Fault Tracking
- **Interactive Charts**: DPU trends with trendline analysis and build volume correlation
- **Stage Performance**: Detailed breakdown by inspection stage
- **Monthly Summary Tables**: Complete data overview with trend indicators

### **Monthly Quality Reports**
- **Automated Report Generation**: Professional PDF reports for management
- **Glide Path Analysis**: Monthly reduction targets to achieve 8.2 DPU by year-end
- **Executive Summary**: Key metrics and performance indicators
- **Critical Actions**: Management attention items with priority levels
- **JCB Branding**: Corporate styling with logo integration

### **Data Management**
- **MongoDB Integration**: Persistent data storage with fallback to localStorage
- **Admin Panel**: Real-time data editing and stage management
- **Data Export**: JSON and CSV formats for external analysis
- **Real-time Updates**: Live dashboard updates with data changes

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or cloud instance)
- Git

### **Installation**
```bash
# Clone the repository
git clone https://github.com/BigTrip1/internal-dash.git
cd internal-dash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string

# Start MongoDB (if running locally)
mongod

# Run the development server
npm run dev
```

### **Environment Variables**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/dpu_master
NODE_ENV=development
```

## 📋 **Usage**

### **Dashboard Navigation**
- **Dashboard**: Main performance overview with KPI cards and charts
- **Admin Panel**: Data management, report generation, and system configuration

### **Monthly Reporting Process**
1. Navigate to **Admin Panel → Monthly Report Generator**
2. Click **"Preview Report"** to review content
3. Click **"Download & Print PDF"** to generate report
4. Attach PDF to monthly management emails

### **Data Management**
1. Use **Admin Panel** to edit inspection data
2. Add/remove inspection stages as needed
3. Export data using **Download Data** button (JSON + CSV formats)

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

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is proprietary software for JCB Digital Factory.

## 📞 **Support**

For technical support or questions:
- **Repository**: [https://github.com/BigTrip1/internal-dash](https://github.com/BigTrip1/internal-dash)
- **Issues**: Create a GitHub issue for bug reports or feature requests

---

**JCB Digital Factory Quality Management System**  
*Rocester, Staffordshire, UK*  
*© 2025 J.C.Bamford Excavators Limited*