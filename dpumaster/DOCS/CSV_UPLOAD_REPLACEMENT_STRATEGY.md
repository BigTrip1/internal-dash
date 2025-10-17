# 🔄 CSV Upload - Complete Replacement Strategy

## Overview

The CSV upload feature now implements a **COMPLETE REPLACEMENT** strategy to ensure data consistency and prevent conflicts between old and new data structures.

---

## 🎯 What This Means

### **Before Upload:**
- Database contains existing inspection data
- Admin table displays current data
- May include old stage structures

### **During Upload:**
1. CSV file is parsed and validated
2. **ALL existing data is DELETED from MongoDB**
3. New data from CSV is inserted
4. Summary modal shows results

### **After Upload:**
- Click "Close & Reload Data" button
- Page refreshes automatically
- Admin table displays NEW data from CSV
- All new stages (like DPDI, DVAL, DCONF) appear
- All old data is replaced

---

## ✅ Why Complete Replacement?

### **Advantages:**
1. **No Data Conflicts** - Clean slate ensures consistency
2. **Stage Structure Updates** - New stages properly initialized
3. **Total Recalculation** - All totals recalculated from scratch
4. **Simplified Logic** - No complex merge/update logic needed
5. **Predictable Results** - Always know exact state after upload

### **Considerations:**
- ⚠️ **Backup First** - Always export current data before uploading
- ⚠️ **Complete CSV Required** - CSV must contain ALL months you want to keep
- ⚠️ **No Partial Updates** - Cannot update just one month

---

## 📊 Data Flow

```
User Clicks "Upload CSV"
        ↓
CSV File Selected
        ↓
File Sent to API
        ↓
Parse & Validate CSV
        ↓
✓ Validation Passes
        ↓
┌─────────────────────────┐
│  MongoDB Operations     │
│  1. deleteMany({})      │ ← Clears ALL existing data
│  2. insertMany(newData) │ ← Inserts CSV data
└─────────────────────────┘
        ↓
Summary Modal Displayed
        ↓
User Clicks "Close & Reload Data"
        ↓
window.location.reload()
        ↓
Page Refreshes
        ↓
DataContext Fetches from MongoDB
        ↓
Admin Table Displays New Data
```

---

## 🔧 Technical Implementation

### API Route Changes:

**File:** `inspection-dashboard/src/app/api/upload-csv/route.ts`

```typescript
// OLD (Upsert Strategy - NOT USED):
for (const monthData of parsedMonths) {
  await collection.updateOne(
    { id: monthData.id },
    { $set: monthData },
    { upsert: true }
  );
}

// NEW (Complete Replacement):
// Step 1: Clear everything
await collection.deleteMany({});
console.log('Cleared all existing data from database');

// Step 2: Insert all new data
if (parsedMonths.length > 0) {
  await collection.insertMany(parsedMonths);
  console.log(`Inserted ${parsedMonths.length} months of data`);
}
```

### UI Changes:

**File:** `inspection-dashboard/src/components/AdminTable.tsx`

```typescript
// Summary Modal Close Button
<button
  onClick={() => {
    setShowUploadSummary(false);
    window.location.reload(); // Force page reload
  }}
>
  Close & Reload Data
</button>
```

**Button Text Updated:**
- Old: "Close"
- New: "Close & Reload Data"
- Makes it clear that closing will refresh the page

---

## 📋 Best Practices

### **Before Upload:**

1. **Export Current Data**
   ```
   Admin Panel → Download JSON
   Admin Panel → Download CSV
   ```
   Keep backup in case you need to restore

2. **Verify CSV Structure**
   - Check all required columns present
   - Ensure DATE column is first
   - Verify stage names match format
   - Include ALL months (including future placeholders)

3. **Test with Small File First**
   - Try with 1-2 months to verify format
   - Check stages appear correctly
   - Verify totals calculate properly

### **During Upload:**

1. **Wait for Summary Modal**
   - Review months processed
   - Check new stages added
   - Read any warnings

2. **Don't Navigate Away**
   - Wait for "Upload successful" message
   - Let modal display completely

### **After Upload:**

1. **Click "Close & Reload Data"**
   - Page will refresh automatically
   - Wait for data to load

2. **Verify Data Integrity**
   - Check admin table shows new data
   - Verify all months present
   - Confirm new stages visible
   - Check totals are correct

3. **Test Dashboard**
   - Navigate to dashboard
   - Verify charts update
   - Check KPI cards reflect new data

---

## 🚨 Important Warnings

### ⚠️ **Data Loss Risk**
- Upload REPLACES all data
- Partial CSVs will result in data loss
- Always backup before upload

### ⚠️ **No Undo**
- Cannot revert after upload
- Must re-upload previous data to restore
- Keep backups of important data

### ⚠️ **Complete CSV Required**
If your CSV only has Jan-Mar data:
- ✅ Jan, Feb, Mar will be imported
- ❌ Apr-Dec will be DELETED
- **Solution:** Include all months in CSV (even with 0 values)

---

## 💡 Common Scenarios

### Scenario 1: Adding New Month
**Goal:** Add October data  
**CSV Must Include:** Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, **Oct**  
**Result:** All 10 months in database

### Scenario 2: Correcting One Month
**Goal:** Fix February data  
**CSV Must Include:** Jan, **Feb (corrected)**, Mar, Apr, May, Jun, Jul, Aug, Sep  
**Result:** All 9 months, Feb with corrected data

### Scenario 3: Adding DPDI Stages
**Goal:** Add DPDI data starting Apr-25  
**CSV Must Include:** 
- Jan-Mar: All stages including DPDI columns with 0 values
- Apr-Sep: All stages including DPDI columns with actual values  
**Result:** All months with DPDI stages, marked inactive for Jan-Mar

---

## 🔍 Verification Checklist

After upload, verify:

- [ ] All expected months appear in admin table
- [ ] New stages (DPDI, DVAL, DCONF) visible
- [ ] Totals columns correct
- [ ] DPU calculations accurate
- [ ] Dashboard reflects new data
- [ ] Charts show updated trends
- [ ] KPI cards updated
- [ ] No console errors
- [ ] MongoDB contains correct data (check with MongoDB Compass)

---

## 🛠️ Troubleshooting

### Issue: Old data still showing
**Solution:** 
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check MongoDB data directly
4. Try uploading again

### Issue: New stages not visible
**Solution:**
1. Verify stages in CSV headers
2. Check MongoDB data
3. Reload page completely
4. Check stage name format matches

### Issue: Data partially missing
**Cause:** CSV didn't include all months  
**Solution:** Re-upload with complete CSV

---

## 📞 Support

If you encounter issues:
1. Check MongoDB directly to verify data
2. Review console logs for errors
3. Verify CSV format matches template
4. Try exporting current data and comparing structure

---

**Last Updated:** October 2025  
**Strategy Version:** 2.0 (Complete Replacement)

