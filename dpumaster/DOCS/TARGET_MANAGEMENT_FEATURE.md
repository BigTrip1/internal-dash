# 🎯 Target Management Feature

## Overview

The Target Management feature allows administrators to set intelligent, data-driven DPU targets for future years with automatic proportional allocation to individual stages based on their current performance.

**Status:** ✅ Implemented (Ready for 2026 release)

---

## 🎯 Key Features

### 1. **Smart Target Allocation**
- **Proportional Strategy** (Recommended): Each stage's target proportional to its current DPU contribution
- **Fault-Weighted Strategy**: Higher targets for stages with more faults
- **Hybrid Strategy**: Performance tier-based with proportional adjustment

### 2. **Flexible Configuration**
- Set targets for any future year (2026, 2027, 2028+)
- Choose baseline month from historical data
- Configure separate targets for:
  - Combined DPU
  - Production DPU  
  - DPDI DPU

### 3. **Manual Override Capability**
- Auto-calculated targets can be manually adjusted per stage
- Perfect for strategic priorities or business-specific requirements

### 4. **Visual Preview**
- Real-time target calculation preview
- Shows current vs target DPU for each stage
- Displays required reduction percentage
- Performance tier indicators (Excellent/Good/Needs Improvement/Critical)

---

## 📊 Use Cases

### Scenario 1: Setting 2026 Targets

**Current Situation (Sep-25):**
- Combined DPU: 22.86
- Production DPU: 12.76
- DPDI DPU: 10.10

**Goal for 2026:**
- Combined DPU Target: 10.0 (56% reduction)

**System Auto-Calculates:**
- DPDI: 4.42 (from 10.10)
- SIP5: 0.76 (from 1.73)
- SIP3: 0.44 (from 1.01)
- BOOMS: 0.19 (from 0.43)
- ...and all other stages proportionally

### Scenario 2: Strategic Override

**Business Priority:** DPDI needs faster improvement than proportional

**Action:**
1. Use proportional calculation as baseline
2. Manually adjust DPDI target from 4.42 to 3.00
3. System saves with `isManual: true` flag

---

## 🚀 How to Use

### Step 1: Access Target Management

1. Navigate to **Admin Panel**
2. Click **"Set Targets"** button (yellow button with target icon)
3. Target Management modal opens

### Step 2: Configure Target

1. **Select Year**: Choose target year (2025, 2026, 2027, 2028)
2. **Choose Baseline**: Select baseline month (e.g., Oct-25)
   - Shows current month DPU for reference
3. **Set Overall Targets**:
   - Combined Target DPU: 10.0
     - Shows: Current month DPU / YTD Average DPU
   - Production Target DPU: 8.2
     - Shows: Current month DPU / YTD Average DPU
   - DPDI Target DPU: 1.8
     - Shows: Current month DPU / YTD Average DPU (when active)

### Step 3: Choose Allocation Strategy

**Each strategy has a help icon (?) with detailed tooltip explaining the calculation.**

**Proportional (Recommended):**
```
Stage Target = (Stage Current DPU / Total DPU) × Total Target
```
- Maintains relative performance
- Fair and transparent
- Auto-adjusts with data changes
- **Tooltip shows:** Formula and real example calculation

**Fault-Weighted:**
```
Stage Target = (Stage Faults / Total Faults) × Target × Volume Adjustment
```
- Focuses on biggest fault contributors
- Accounts for inspection volume
- **Tooltip shows:** Best use cases and calculation method

**Hybrid:**
- Performance tier-based multipliers:
  - Excellent (< 0.5 DPU): 20% reduction
  - Good (0.5-1.0): 40% reduction
  - Needs Improvement (1.0-2.0): 50% reduction
  - Critical (> 2.0): 60% reduction
- **Tooltip shows:** Tier breakdown and balanced approach benefits

### Step 4: Review & Adjust

1. System auto-calculates targets for all stages
2. Review stage-specific targets in preview table
3. Manually adjust any stage target if needed
4. Check required reduction percentages

### Step 5: Save

1. Click **"Save Targets"** button
2. Targets stored in MongoDB
3. Available for dashboard use in 2026

---

## 💾 Data Storage

### MongoDB Collection: `targets`

```json
{
  "_id": "...",
  "year": 2026,
  "combinedTarget": 10.0,
  "productionTarget": 8.2,
  "dpdiTarget": 1.8,
  "allocationStrategy": "proportional",
  "stageTargets": [
    {
      "stageName": "BOOMS",
      "targetDpu": 0.19,
      "isManual": false
    },
    {
      "stageName": "DPDI",
      "targetDpu": 4.42,
      "isManual": false
    }
    // ... all stages
  ],
  "baseline": {
    "month": "Sep-25",
    "combinedDpu": 22.86,
    "productionDpu": 12.76,
    "dpdiDpu": 10.10
  },
  "createdAt": "2025-12-15T10:30:00Z",
  "updatedAt": "2025-12-15T10:30:00Z"
}
```

---

## 🔧 API Endpoints

### GET `/api/targets?year=2026`
Fetch target configuration for a specific year

**Response:**
```json
{
  "success": true,
  "target": { /* YearTarget object */ }
}
```

### POST `/api/targets`
Create or update target configuration

**Request Body:**
```json
{
  "year": 2026,
  "combinedTarget": 10.0,
  "productionTarget": 8.2,
  "dpdiTarget": 1.8,
  "allocationStrategy": "proportional",
  "baseline": {
    "month": "Sep-25",
    "combinedDpu": 22.86,
    "productionDpu": 12.76,
    "dpdiDpu": 10.10
  },
  "stageTargets": [ /* array of StageTarget */ ]
}
```

### DELETE `/api/targets?year=2026`
Remove target configuration for a year

---

## 🎨 UI Components

### Target Management Modal
**Location:** `src/components/TargetManagementModal.tsx`

**Features:**
- Target configuration form
- Allocation strategy selector
- Real-time calculation preview
- Manual override inputs
- Save/Cancel actions

### Set Targets Button
**Location:** Admin Panel top-right
**Color:** Yellow (JCB branded)
**Icon:** Target icon

---

## 📐 Calculation Algorithms

**Location:** `src/utils/targetCalculations.ts`

### Functions:

1. `calculateProportionalTargets()` - Proportional allocation
2. `calculateWeightedTargets()` - Fault-weighted allocation
3. `calculateHybridTargets()` - Performance tier-based
4. `calculateReductionPercentage()` - Calculate % reduction needed
5. `getPerformanceTier()` - Determine stage performance level
6. `getStageTarget()` - Lookup target for specific stage

---

## 🔮 Future Dashboard Integration (Phase 2)

### Planned Features:
1. **Use stage-specific targets in trendline calculations**
   - Replace fixed 8.2 with stage-specific targets
   - Dynamic glide path per stage

2. **Target achievement tracking**
   - Progress bars per stage
   - Color-coded: Green (below target), Yellow (near target), Red (above target)

3. **KPI card updates**
   - Show "Target: X.XX | Current: Y.YY" badges
   - Traffic light indicators

4. **Target Achievement Dashboard**
   - Overall progress percentage
   - Top/bottom performers vs target
   - Projected year-end vs target

---

## ⚙️ Configuration

### Default Values (2025 → 2026)

- **Production Target**: 8.2 DPU (current 2025 year-end target)
- **Combined Target**: 10.0 DPU (updated for combined business view)
- **Baseline**: Sep-25 (latest actual data)
- **Strategy**: Proportional (most fair and transparent)

---

## ✅ Benefits

1. **Data-Driven**: Uses actual performance data, not arbitrary percentages
2. **Fair**: Proportional allocation maintains relative performance levels
3. **Flexible**: Manual override for strategic adjustments
4. **Transparent**: Clear calculations, easy to explain to stakeholders
5. **Scalable**: Works for any number of stages and future years
6. **Future-Ready**: Built for 2026+ with long-term vision

---

## 🚧 Limitations & Considerations

1. **Baseline Selection**: Choose a representative month (avoid anomalies)
2. **Inactive Stages**: Stages with 0 inspections get 0 target (auto-handled)
3. **Strategic Override**: Manual adjustments may break proportionality
4. **Database Dependency**: Requires MongoDB connection
5. **Year-End Only**: Current version sets year-end targets (not month-by-month)

---

## 📝 Example Calculation

**Baseline:** Sep-25
- Combined DPU: 22.86
- DPDI DPU: 10.10 (44.2% of combined)

**Target:** 2026 Year-End
- Combined DPU: 10.0 (56% reduction)

**Proportional Allocation:**

| Stage | Current DPU | % of Total | Target DPU | Reduction |
|-------|------------|------------|------------|-----------|
| DPDI | 10.10 | 44.2% | 4.42 | 56% |
| SIP5 | 1.73 | 7.6% | 0.76 | 56% |
| SIP3 | 1.01 | 4.4% | 0.44 | 56% |
| BOOMS | 0.43 | 1.9% | 0.19 | 56% |
| **Total** | **22.86** | **100%** | **10.0** | **56%** |

---

## 🎓 Training Notes

**For Administrators:**
1. Set targets annually (Q4 of previous year)
2. Use proportional strategy unless specific business reason
3. Review baseline month selection (avoid December/holidays)
4. Document any manual overrides with justification

**For Stakeholders:**
1. Targets are proportional to current performance
2. Better performers get lower reduction targets
3. All targets sum to overall business goal
4. Review and approve before year-end

---

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review calculation in preview table
3. Test with different strategies
4. Contact system administrator

**Feature Status:** Production-ready for 2026 rollout 🚀

