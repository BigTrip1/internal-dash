# 📤 CSV Upload Feature - Complete Documentation

## Overview

The CSV Upload feature allows administrators to bulk import inspection data from Excel/CSV files directly into the DPU Master system, eliminating manual data entry and ensuring data consistency.

---

## 🎯 Key Features

### ✅ **Implemented Features:**
1. **One-Click Upload** - Purple "Upload CSV" button in admin panel
2. **Automatic Parsing** - Intelligent CSV structure detection with three separate totals
3. **Stage Detection** - Automatically identifies production and DPDI stages
4. **New Stage Addition** - Automatically adds stages not in database
5. **Data Validation** - Validates DPU calculations and data integrity
6. **Detailed Summary** - Shows months updated, new stages, and warnings
7. **MongoDB Integration** - Complete data replacement directly to database
8. **Empty Month Handling** - Creates placeholder months with 0 values
9. **Three Totals Sections** - Tracks Production, DPDI, and Combined totals separately
10. **Signout Volume** - Separate build volume metric for accurate production tracking

---

## 📊 Expected CSV Structure

### Header Row Format:
```
DATE,
[STAGE] INSPECTED,[STAGE] FAULTS,[STAGE] DPU,
...repeat for all stages...,
PRODUCTION TOTAL INSPECTIONS,PRODUCTION TOTAL FAULTS,PRODUCTION TOTAL DPU,
DPDI INSPECTED,DPDI FAULTS,DPDI DPU,
DVAL INSPECTED,DVAL FAULTS,DVAL DPU,
DCONF INSPECTED,DCONF FAULTS,DCONF DPU,
DPDI TOTAL INSPECTIONS,DPDI TOTAL FAULTS,DPDI TOTAL DPU,
COMBINED INSPECTIONS,COMBINED FAULTS,COMBINED DPU INC DPDI,
SIGNOUT VOLUME
```

### Production Stages:
- BOOMS, SIP1, SIP1A, SIP2, SIP3, SIP4, RR, UV1, SIP5
- FTEST, LECREC, CT, UV2, CABWT, SIP6, CFC, CABSIP, UV3

### DPDI Stages (3 stages):
- DPDI (Dealer Pre-Delivery Inspection)
- DVAL (DPDI Validation)
- DCONF (DPDI Configuration)

### Data Row Format:
```
Jan-25,1446,1018,0.70,... (continues for all stages)
```

---

## 🚀 How to Use

### Step 1: Prepare Your CSV File
1. Export data from Excel to CSV format
2. Ensure headers match expected structure
3. Include all required columns
4. Use format: `[STAGE] INSPECTED`, `[STAGE] FAULTS`, `[STAGE] DPU`

### Step 2: Upload to System
1. Navigate to **Admin Panel**
2. Click **"Upload CSV"** button (purple, top-right)
3. Select your CSV file from file explorer
4. Wait for upload and processing (spinner shows progress)

### Step 3: Review Summary
Upload summary modal will show:
- ✅ Number of months processed
- 📅 List of months updated (tags)
- ➕ New stages added (if any)
- ⚠️ Warnings (DPU calculation differences, etc.)

### Step 4: Verify Data
- Check admin table for updated data
- Verify new stages appear in stage list
- Dashboard will reflect updated data immediately

---

## 🔍 Validation Rules

### ✅ **Passes Validation:**
- DATE column present
- Stage INSPECTED/FAULTS/DPU columns exist
- DPU calculation within 0.1 tolerance
- CSV format valid

### ❌ **Blocks Import:**
- Missing DATE column
- No stage columns found
- Invalid file format (not .csv)
- Corrupted file structure
- Empty CSV file

### ⚠️ **Warns But Allows:**
- DPU calculation mismatch (>0.1 difference)
- New stages detected
- Inactive stages (0 inspected)
- Partial month data

---

## 📈 Data Processing Logic

### Stage Type Classification:
```typescript
Production Stages: All stages except DPDI, DVAL, DCONF
DPDI Stages: DPDI, DVAL, DCONF

stageType: 'production' | 'dpdi'
```

### Inactive Stage Handling:
```typescript
inspected = 0 → isActive: false
inspected > 0 → isActive: true
```

### Month Data Structure:
```javascript
{
  id: "jan-25",
  date: "Jan-25",
  year: 2025,
  stages: [
    {
      id: "booms",
      name: "BOOMS",
      inspected: 1446,
      faults: 1018,
      dpu: 0.70,
      stageType: "production",
      isActive: true,
      order: 0  // Preserves CSV column order
    },
    // ... more stages in CSV column order
  ],
  plantTotalInspections: 24446,
  plantTotalFaults: 28460,
  plantTotalDpu: 20.17,
  dpdiTotalInspections: 0,
  dpdiTotalFaults: 0,
  dpdiTotalDpu: 0,
  totalInspections: 24446,
  totalFaults: 28460,
  totalDpu: 20.17
}
```

---

## 🛠️ Technical Implementation

### API Route: `/api/upload-csv`
**Location:** `inspection-dashboard/src/app/api/upload-csv/route.ts`

**Method:** POST (multipart/form-data)

**Request:**
```typescript
FormData {
  file: File (CSV file)
}
```

**Response (Success):**
```json
{
  "success": true,
  "monthsProcessed": 11,
  "monthsUpdated": ["Jan-25", "Feb-25", ...],
  "newStagesAdded": ["DPDI", "DVAL", "DCONF"],
  "errors": [],
  "warnings": ["Mar-25 - BOOMS: DPU calculation mismatch..."]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Missing DATE column in CSV header",
  "errors": ["..."],
  "warnings": []
}
```

### CSV Parser Function
**Key Features:**
- Header parsing and column mapping
- Stage name extraction and normalization
- Data validation (DPU calculations)
- Total columns extraction (Plant, DPDI, Combined)
- Error and warning collection

### MongoDB Operations
**Collection:** `dpu_master.inspections`

**Operation:** Complete Replacement
```javascript
// Step 1: Clear all existing data
await collection.deleteMany({});

// Step 2: Insert all new data from CSV
await collection.insertMany(parsedMonths);
```

**⚠️ Important:** This is a COMPLETE REPLACEMENT strategy. All existing data is removed before importing the CSV data.

---

## 📋 Example CSV Upload Scenarios

### Scenario 1: New Month Data
**Action:** Upload CSV with Oct-25 data  
**Result:** Oct-25 month created in database  
**Summary:** "1 month processed, 1 month updated (Oct-25)"

### Scenario 2: Replace All Data
**Action:** Upload CSV with updated data  
**Result:** ALL existing data cleared, new data imported  
**Summary:** "11 months processed, all data replaced"  
**Note:** This is a COMPLETE REPLACEMENT strategy

### Scenario 3: New Stage Introduction
**Action:** Upload CSV with new "NEWSTAGE" column  
**Result:** NEWSTAGE added to all months (historical = 0)  
**Summary:** "11 months processed, 1 new stage added (NEWSTAGE)"

### Scenario 4: DPDI Rollout
**Action:** Upload CSV with DPDI data starting Apr-25  
**Result:** 
- Jan-Mar: DPDI stages with 0 values, isActive: false
- Apr onwards: DPDI stages with actual data, isActive: true  
**Summary:** "11 months processed, 3 new stages added (DPDI, DVAL, DCONF)"

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Missing DATE column"
**Cause:** First column not labeled "DATE"  
**Solution:** Ensure first column header is "DATE"

### Issue 2: "No stage columns found"
**Cause:** Headers don't follow [STAGE] INSPECTED format  
**Solution:** Ensure headers match: `BOOMS INSPECTED`, `BOOMS FAULTS`, `BOOMS DPU`

### Issue 3: "DPU calculation mismatch"
**Cause:** DPU value doesn't match faults/inspected  
**Solution:** Recalculate DPU in Excel: `=FAULTS/INSPECTED`  
**Note:** Warnings for differences <0.1 are allowed (rounding)

### Issue 4: Upload shows success but data not appearing
**Cause:** Browser cache  
**Solution:** Hard refresh (Ctrl+Shift+R) or wait for auto-reload

### Issue 5: "Failed to upload CSV file"
**Cause:** File too large, network error, or MongoDB connection issue  
**Solution:** Check file size (<5MB), internet connection, MongoDB status

---

## 🔐 Security Considerations

### File Type Validation
- Only .csv files accepted
- File extension checked server-side
- Content-type validation

### Data Validation
- All numeric values validated
- Date format validation
- Stage name sanitization
- SQL injection prevention (MongoDB parameterized queries)

### Access Control
- Upload button visible to all admin panel users
- Consider adding authentication layer if needed

---

## 🚀 Future Enhancements

### Phase 2 Features (Potential):
1. **Preview Before Import** - Show data preview before committing
2. **Selective Import** - Choose which months to import
3. **Conflict Resolution** - Merge vs Replace options
4. **Download Template** - Generate CSV template from current data
5. **Drag & Drop** - Drag CSV file onto upload area
6. **Batch Validation Report** - Detailed validation results as PDF
7. **Undo Last Import** - Rollback capability
8. **Import History** - Log of all uploads with timestamps
9. **Excel Direct Upload** - Support .xlsx files
10. **Column Mapping UI** - Map CSV columns if structure differs

---

## 📊 Testing Checklist

### ✅ Test Cases:
- [ ] Upload CSV with all months (Jan-Oct)
- [ ] Upload CSV with only new month (Nov-25)
- [ ] Upload CSV with new stage (verify auto-add)
- [ ] Upload CSV with DPDI data
- [ ] Upload CSV with empty future months
- [ ] Upload invalid file type (.xlsx, .txt)
- [ ] Upload CSV with missing DATE column
- [ ] Upload CSV with incorrect DPU values
- [ ] Upload CSV with special characters in stage names
- [ ] Upload very large CSV (stress test)
- [ ] Verify summary modal shows correctly
- [ ] Verify data appears in admin table
- [ ] Verify dashboard updates after upload
- [ ] Test concurrent uploads
- [ ] Test network error handling

---

## 📞 Support

### For Issues:
1. Check console for error messages (F12)
2. Verify CSV format matches template
3. Check MongoDB connection
4. Review API logs in terminal

### Contact:
- Technical issues: Check GitHub issues
- Data questions: Review this documentation
- Bug reports: Create detailed issue with CSV sample

---

**Feature Version:** 1.0  
**Last Updated:** October 2025  
**Status:** ✅ Production Ready

