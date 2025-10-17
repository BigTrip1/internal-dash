# 🎯 Target Management - Quick User Guide

## Overview
Set intelligent, data-driven DPU targets for any year with automatic stage-by-stage allocation.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Open Target Management
**Location:** Admin Panel → "Set Targets" button (yellow, top-right)

### Step 2: Select Configuration
```
┌─────────────────────────────────┐
│ Target Year:        [2025 ▼]   │
│ Baseline Month:     [Oct-25 ▼] │
│   Current: 25.51 Combined DPU   │
└─────────────────────────────────┘
```

### Step 3: Enter Targets
```
┌──────────────────────────────────────────────────────────┐
│ Combined Target DPU:  [10.0]                             │
│   Current month: 25.51 Combined DPU / YTD Avg: 20.54 DPU│
│                                                           │
│ Production Target DPU: [8.2]                             │
│   Current month: 12.76 Production DPU / YTD Avg: 15.32  │
│                                                           │
│ DPDI Target DPU:      [1.8]                              │
│   Current month: 10.10 DPDI DPU / YTD Avg: 8.45 DPU     │
└──────────────────────────────────────────────────────────┘
```

### Step 4: Choose Strategy

```
┌────────────────────────────────────────────┐
│ ○ Proportional (Recommended)         [?]  │
│   Each stage's target proportional to DPU  │
│                                             │
│ ○ Fault-Weighted                     [?]  │
│   Higher targets for stages with faults    │
│                                             │
│ ○ Hybrid                             [?]  │
│   Performance tier-based allocation        │
└────────────────────────────────────────────┘
```

**💡 Hover over [?] for detailed explanations**

### Step 5: Review & Save
- Preview table shows all calculated stage targets
- Manually adjust any stage if needed
- Click "Save Targets"

---

## 📊 Understanding the Metrics

### Current Month DPU
The DPU value for the selected baseline month.

**Example:** Oct-25 shows 25.51 Combined DPU

### YTD Average DPU
Average DPU across all months in the selected year with data.

**Example:** (Jan + Feb + ... + Oct) / 10 months = 20.54 YTD Avg

**Why it matters:**
- Shows if current month is typical or outlier
- Provides realistic benchmark for targets
- Indicates actual year-to-date performance

---

## 🎓 Allocation Strategies Explained

### 1️⃣ Proportional (Recommended)

**How it works:**
```
Stage Target = (Stage DPU / Total DPU) × Overall Target
```

**Example:**
- DPDI: 10.10 DPU (44% of 22.86 total)
- Target: 10.0 overall
- **DPDI Target = 4.42 DPU**

**Best for:**
✅ Fair allocation maintaining relative performance  
✅ Transparent and easy to explain  
✅ Default choice for most scenarios  

**Hover tooltip shows:**
- Full formula
- Real example calculation
- Why it's proportional

---

### 2️⃣ Fault-Weighted

**How it works:**
```
Stage Target = (Stage Faults / Total Faults) × Target × Volume Adj
```

**Example:**
- CFC: 12,630 faults (44% of total)
- Higher fault contributors get higher targets
- **CFC gets proportionally higher reduction goal**

**Best for:**
✅ Focusing on biggest problem areas  
✅ Fault-reduction priority approach  
✅ When some stages dominate fault counts  

**Hover tooltip shows:**
- Calculation method
- Volume adjustment explanation
- Best use cases

---

### 3️⃣ Hybrid

**How it works:**
Performance tier-based with blended proportional adjustment.

**Tier Reductions:**
- 🟢 Excellent (<0.5 DPU): 20% reduction
- 🔵 Good (0.5-1.0): 40% reduction  
- 🟡 Needs Improvement (1.0-2.0): 50% reduction
- 🔴 Critical (>2.0): 60% reduction

**Example:**
- BOOMS (0.47 DPU, Excellent): Gets 20% reduction
- SIP5 (1.73 DPU, Needs Improvement): Gets 50% reduction

**Best for:**
✅ Balanced approach  
✅ Rewarding good performers  
✅ Pushing critical areas harder  

**Hover tooltip shows:**
- Tier breakdown
- Reduction percentages
- Balanced approach benefits

---

## 💡 Pro Tips

### Tip 1: Check YTD Context
```
Current month: 25.51 / YTD Avg: 20.54
                ↑                ↑
           Higher than        Real avg
            usual
```
**Action:** Consider using YTD average as baseline, not just current month.

### Tip 2: Use Tooltips
Hover over every [?] icon to understand:
- How calculations work
- Why strategy is recommended
- What the numbers mean

### Tip 3: Start with Proportional
- Most fair and transparent
- Easy to explain to stakeholders
- Can always switch strategies and recalculate

### Tip 4: Manual Override
Don't like a calculated target? Edit it!
- Click into any stage target cell
- Type new value
- System marks as "manual override"

### Tip 5: Trial with 2025
Before setting official 2026 targets:
1. Set year to 2025
2. Try different strategies
3. See how allocations work
4. Build confidence
5. Delete and repeat as needed

---

## 📋 Example Workflow

### Scenario: Setting 2025 Year-End Targets

**Current State (Oct-25):**
- Combined: 25.51 DPU (current) / 20.54 (YTD avg)
- Production: 12.76 DPU (current) / 15.32 (YTD avg)
- DPDI: 10.10 DPU (current) / 8.45 (YTD avg)

**Goal:**
Set aggressive but achievable targets for year-end.

**Steps:**

1. **Open Target Management**
   - Admin Panel → "Set Targets"

2. **Configure**
   - Year: 2025
   - Baseline: Oct-25

3. **Set Targets** (guided by YTD)
   - Combined: 10.0 (51% below YTD of 20.54)
   - Production: 8.2 (46% below YTD of 15.32)
   - DPDI: 1.8 (79% below YTD of 8.45)

4. **Choose Strategy**
   - Select "Proportional"
   - Hover over [?] to review formula
   - System calculates stage targets

5. **Review Preview**
   ```
   Stage    Current   Target   Reduction   Tier
   ─────────────────────────────────────────────
   DPDI     10.10     4.42     56%        Critical
   SIP5     1.73      0.76     56%        Needs Improvement
   BOOMS    0.47      0.19     56%        Excellent
   ...
   ```

6. **Manual Adjustments** (optional)
   - DPDI looking too aggressive? Edit to 3.00
   - Marked as "manual override"

7. **Save**
   - Click "Save Targets"
   - Stored in MongoDB
   - Ready for future dashboard use

---

## ❓ FAQs

**Q: What if my baseline month is unusual?**  
A: Use YTD average as your reference point, not just current month.

**Q: Can I change targets after saving?**  
A: Yes! Just open again, modify, and save. It updates the record.

**Q: Why use 2025 for testing?**  
A: To validate calculations with real data before official 2026 rollout.

**Q: Which strategy should I choose?**  
A: Start with Proportional (recommended). It's fair and transparent.

**Q: What if I don't trust calculated targets?**  
A: You can manually edit any stage target. Just click and type.

**Q: Do targets affect the dashboard now?**  
A: Not yet. Phase 2 (Q1 2026) will integrate targets into glide paths.

**Q: Can I delete targets?**  
A: Yes, via MongoDB or API. Or just overwrite by saving new ones.

**Q: What if DPDI wasn't active in baseline?**  
A: System automatically sets inactive stages to 0 target.

---

## 🎯 Success Indicators

You'll know you've done it right when:

✅ YTD averages provide context for your targets  
✅ You understand why each stage got its target  
✅ Reduction percentages seem reasonable  
✅ You can explain the strategy to management  
✅ Targets are saved successfully in MongoDB  
✅ You feel confident in the allocations  

---

## 📞 Need Help?

**Issue:** Targets seem wrong  
**Solution:** Hover over strategy [?] icon, review calculation

**Issue:** YTD showing 0  
**Solution:** Check if year has any data with DPU > 0

**Issue:** Can't save targets  
**Solution:** Check MongoDB connection, verify all fields filled

**Issue:** Want to change strategy  
**Solution:** Select different radio button, click "Recalculate"

---

## 🎉 You're Ready!

The Target Management system is intuitive and powerful. 

**Remember:**
- 📊 YTD averages give context
- 🎓 Tooltips teach calculations  
- 🧪 Test with 2025 data
- 🎯 Start with Proportional
- ✏️ Manual override anytime

**Happy target setting!** 🚀

