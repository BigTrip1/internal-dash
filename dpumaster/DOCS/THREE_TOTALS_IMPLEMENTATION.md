# Three Separate Totals Implementation

## Overview

The DPU Master system now tracks three separate totals sections to provide comprehensive quality analytics across different stages of production and inspection:

1. **PRODUCTION TOTALS** - Main production line quality metrics
2. **DPDI TOTALS** - Dealer Pre-Delivery Inspection metrics
3. **COMBINED TOTALS** - Overall quality metrics including both production and DPDI

## Data Structure

### InspectionData Interface

Each monthly record now includes separate totals:

```typescript
interface InspectionData {
  id: string;
  date: string;
  year: number;
  stages: InspectionStage[];
  
  // Production Totals
  productionTotalInspections: number;
  productionTotalFaults: number;
  productionTotalDpu: number;
  
  // DPDI Totals
  dpdiTotalInspections: number;
  dpdiTotalFaults: number;
  dpdiTotalDpu: number;
  
  // Combined Totals
  combinedTotalInspections: number;
  combinedTotalFaults: number;
  combinedTotalDpu: number;
  
  // Signout Volume (Build Volume Metric)
  signoutVolume: number;
}
```

## CSV Structure

### Required Columns

The CSV upload expects the following totals columns (in addition to individual stage columns):

1. **Production Totals**:
   - `PRODUCTION TOTAL INSPECTIONS`
   - `PRODUCTION TOTAL FAULTS`
   - `PRODUCTION TOTAL DPU`

2. **DPDI Totals**:
   - `DPDI TOTAL INSPECTIONS`
   - `DPDI TOTAL FAULTS`
   - `DPDI TOTAL DPU`

3. **Combined Totals**:
   - `COMBINED INSPECTIONS`
   - `COMBINED FAULTS`
   - `COMBINED DPU INC DPDI`

4. **Build Volume**:
   - `SIGNOUT VOLUME` (last column)

### Example CSV Layout

```csv
DATE,BOOMS INSPECTED,BOOMS FAULTS,BOOMS DPU,...,PRODUCTION TOTAL INSPECTIONS,PRODUCTION TOTAL FAULTS,PRODUCTION TOTAL DPU,DPDI INSPECTED,DPDI FAULTS,DPDI DPU,DVAL INSPECTED,DVAL FAULTS,DVAL DPU,DCONF INSPECTED,DCONF FAULTS,DCONF DPU,DPDI TOTAL INSPECTIONS,DPDI TOTAL FAULTS,DPDI TOTAL DPU,COMBINED INSPECTIONS,COMBINED FAULTS,COMBINED DPU INC DPDI,SIGNOUT VOLUME
Jan-25,1446,1018,0.70,...,24446,28460,20.17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1434
```

## Admin Table Display

The admin table now displays three separate totals columns with color-coded styling:

1. **PRODUCTION TOTALS** - Yellow gradient (primary production focus)
2. **DPDI TOTALS** - Blue gradient (DPDI differentiation)
3. **COMBINED TOTALS** - Green gradient (overall metrics)

Each totals column displays:
- Inspected count
- Faults count
- DPU value

## Dashboard Integration

### Filter Options

The dashboard stage filter dropdown now includes:

1. **PRODUCTION TOTALS** - Shows production-only quality metrics
2. **DPDI TOTALS** - Shows DPDI-only quality metrics
3. **COMBINED TOTALS** - Shows overall quality metrics (default)
4. Individual stages (BOOMS, SIP1, etc.) - Shows stage-specific metrics

### Chart Behavior

#### When Totals Filter is Selected:
- **DPU**: Uses the corresponding total DPU (production/DPDI/combined)
- **Build Volume (Y-axis right)**: Uses **SIGNOUT VOLUME** from CSV
- **Chart Title**: "[TOTALS TYPE] DPU vs Signout Volume"
- **KPI Cards**: Display the corresponding totals data

#### When Individual Stage is Selected:
- **DPU**: Uses stage-specific DPU
- **Build Volume (Y-axis right)**: Uses **stage INSPECTED** count
- **Chart Title**: "[STAGE NAME] DPU vs [STAGE NAME] Inspected"
- **KPI Cards**: Display stage-specific data

## DPDI Context

**DPDI** (Dealer Pre-Delivery Inspection) represents a separate quality inspection facility that mimics dealership standards:

- **Purpose**: Capture final product quality issues before customer delivery
- **Location**: Separate building from main production line
- **Standards**: Aligned with dealer inspection criteria
- **Benefit**: Identify and resolve quality issues before reaching dealers/customers

## Implementation Details

### CSV Parser Updates

The `upload-csv/route.ts` API endpoint now:
- Parses three separate totals sections from CSV
- Extracts `SIGNOUT VOLUME` for build volume tracking
- Stores all totals in MongoDB `Raw` collection
- Validates totals columns exist before import

### Dashboard Logic Updates

The `Dashboard.tsx` component now:
- Includes `isTotalsFilter()` helper function
- Conditionally displays signout volume vs stage inspected
- Updates KPI cards based on selected filter type
- Adjusts chart labels and legends dynamically

### Admin Table Updates

The `AdminTable.tsx` component now:
- Renders three separate totals columns
- Color-codes each totals section
- Updates export functions to include all three totals
- Maintains backward compatibility with existing features

## Migration Notes

### From Single Totals to Three Totals

If migrating existing data:

1. **Backup existing data** using admin panel export
2. **Update CSV format** to include three separate totals sections
3. **Add SIGNOUT VOLUME column** at the end
4. **Re-upload data** via CSV upload feature
5. **Verify data** appears correctly in admin table

### Default Values

For months without DPDI data:
- Set all DPDI totals to `0`
- COMBINED TOTALS = PRODUCTION TOTALS
- System will display zeros in DPDI columns

## Benefits

1. **Granular Tracking**: Separate visibility into production vs DPDI quality
2. **Comprehensive Analysis**: Overall metrics through combined totals
3. **Flexible Filtering**: Dashboard can analyze any totals perspective
4. **Build Volume Accuracy**: Signout volume provides accurate production output metric
5. **Data Integrity**: Three totals sections ensure complete quality coverage

## Future Enhancements

Potential future improvements:
- Trendline analysis for each totals type
- Comparative charts (Production vs DPDI)
- DPDI-specific quality targets
- Stage-by-stage DPDI breakdown
- Automated alerts for totals discrepancies

