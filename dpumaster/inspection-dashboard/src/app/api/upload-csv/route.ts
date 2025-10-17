import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface ParsedStage {
  id: string;
  name: string;
  inspected: number;
  faults: number;
  dpu: number;
  stageType: 'production' | 'dpdi';
  isActive: boolean;
  order?: number; // Preserve CSV column order
}

interface ParsedMonth {
  id: string;
  date: string;
  year: number;
  stages: ParsedStage[];
  productionTotalInspections: number;
  productionTotalFaults: number;
  productionTotalDpu: number;
  dpdiTotalInspections: number;
  dpdiTotalFaults: number;
  dpdiTotalDpu: number;
  combinedTotalInspections: number;
  combinedTotalFaults: number;
  combinedTotalDpu: number;
  signoutVolume: number;
}

interface UploadSummary {
  success: boolean;
  monthsProcessed: number;
  monthsUpdated: string[];
  newStagesAdded: string[];
  errors: string[];
  warnings: string[];
}

// Helper function to normalize stage names
function normalizeStageId(stageName: string): string {
  return stageName.toLowerCase().replace(/\s+/g, '');
}

// Helper function to determine if a stage is DPDI type
function isDpdiStage(stageName: string): boolean {
  const dpdiStages = ['DPDI', 'DVAL', 'DCONF'];
  return dpdiStages.includes(stageName.toUpperCase());
}

// Parse CSV content
function parseCSV(csvContent: string): { data: ParsedMonth[], errors: string[], warnings: string[] } {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsedData: ParsedMonth[] = [];

  if (lines.length < 2) {
    errors.push('CSV file is empty or has no data rows');
    return { data: [], errors, warnings };
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Validate critical columns exist
  if (!headers[0].toUpperCase().includes('DATE')) {
    errors.push('Missing DATE column in CSV header');
    return { data: [], errors, warnings };
  }

  // Extract stage information from headers
  const stageColumns: { name: string; inspectedIndex: number; faultsIndex: number; dpuIndex: number }[] = [];
  let productionTotalInspectionsIndex = -1;
  let productionTotalFaultsIndex = -1;
  let productionTotalDpuIndex = -1;
  let dpdiTotalInspectionsIndex = -1;
  let dpdiTotalFaultsIndex = -1;
  let dpdiTotalDpuIndex = -1;
  let combinedTotalInspectionsIndex = -1;
  let combinedTotalFaultsIndex = -1;
  let combinedTotalDpuIndex = -1;
  let signoutVolumeIndex = -1;

  // Parse stage columns
  for (let i = 1; i < headers.length; i++) {
    const header = headers[i].toUpperCase();
    
    // Check for totals columns
    if (header.includes('PRODUCTION TOTAL INSPECTIONS')) {
      productionTotalInspectionsIndex = i;
    } else if (header.includes('PRODUCTION TOTAL FAULTS')) {
      productionTotalFaultsIndex = i;
    } else if (header.includes('PRODUCTION TOTAL DPU')) {
      productionTotalDpuIndex = i;
    } else if (header === 'DPDI TOTAL INSPECTIONS') {
      dpdiTotalInspectionsIndex = i;
    } else if (header === 'DPDI TOTAL FAULTS') {
      dpdiTotalFaultsIndex = i;
    } else if (header === 'DPDI TOTAL DPU') {
      dpdiTotalDpuIndex = i;
    } else if (header.includes('COMBINED INSPECTIONS')) {
      combinedTotalInspectionsIndex = i;
    } else if (header.includes('COMBINED FAULTS')) {
      combinedTotalFaultsIndex = i;
    } else if (header.includes('COMBINED DPU')) {
      combinedTotalDpuIndex = i;
    } else if (header.includes('SIGNOUT VOLUME')) {
      signoutVolumeIndex = i;
    } else if (header.includes('INSPECTED')) {
      // Extract stage name
      const stageName = header.replace('INSPECTED', '').trim();
      const faultsIndex = i + 1;
      const dpuIndex = i + 2;
      
      if (stageName && stageName !== 'SIGNOUT') { // Exclude SIGNOUT VOLUME from stages
        stageColumns.push({
          name: stageName,
          inspectedIndex: i,
          faultsIndex,
          dpuIndex
        });
      }
    }
  }

  // Validate we found stages
  if (stageColumns.length === 0) {
    errors.push('No stage columns found in CSV. Expected format: [STAGE] INSPECTED, [STAGE] FAULTS, [STAGE] DPU');
    return { data: [], errors, warnings };
  }

  console.log(`Found ${stageColumns.length} stages in CSV:`, stageColumns.map(s => s.name).join(', '));

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim());
    
    const date = values[0];
    
    // Skip empty rows
    if (!date) continue;

    // Parse year from date (e.g., "Jan-25" -> 2025)
    const yearMatch = date.match(/-(\d{2})$/);
    const year = yearMatch ? 2000 + parseInt(yearMatch[1]) : new Date().getFullYear();

    // Generate month ID
    const monthId = date.toLowerCase().replace(/\s+/g, '-');

    // Parse stages
    const stages: ParsedStage[] = [];
    
    for (let stageIndex = 0; stageIndex < stageColumns.length; stageIndex++) {
      const stageCol = stageColumns[stageIndex];
      const inspected = parseFloat(values[stageCol.inspectedIndex]) || 0;
      const faults = parseFloat(values[stageCol.faultsIndex]) || 0;
      const dpu = parseFloat(values[stageCol.dpuIndex]) || 0;
      
      const stageName = stageCol.name;
      const stageId = normalizeStageId(stageName);
      
      stages.push({
        id: stageId,
        name: stageName,
        inspected,
        faults,
        dpu,
        stageType: isDpdiStage(stageName) ? 'dpdi' : 'production',
        isActive: inspected > 0,
        order: stageIndex // Preserve CSV column order
      });

      // Validate DPU calculation (with tolerance for rounding)
      if (inspected > 0) {
        const calculatedDpu = faults / inspected;
        const dpuDifference = Math.abs(calculatedDpu - dpu);
        if (dpuDifference > 0.1) {
          warnings.push(`${date} - ${stageName}: DPU calculation mismatch (CSV: ${dpu}, Calculated: ${calculatedDpu.toFixed(2)})`);
        }
      }
    }

    // Parse totals
    const productionTotalInspections = productionTotalInspectionsIndex >= 0 ? (parseFloat(values[productionTotalInspectionsIndex]) || 0) : 0;
    const productionTotalFaults = productionTotalFaultsIndex >= 0 ? (parseFloat(values[productionTotalFaultsIndex]) || 0) : 0;
    const productionTotalDpu = productionTotalDpuIndex >= 0 ? (parseFloat(values[productionTotalDpuIndex]) || 0) : 0;
    
    const dpdiTotalInspections = dpdiTotalInspectionsIndex >= 0 ? (parseFloat(values[dpdiTotalInspectionsIndex]) || 0) : 0;
    const dpdiTotalFaults = dpdiTotalFaultsIndex >= 0 ? (parseFloat(values[dpdiTotalFaultsIndex]) || 0) : 0;
    const dpdiTotalDpu = dpdiTotalDpuIndex >= 0 ? (parseFloat(values[dpdiTotalDpuIndex]) || 0) : 0;
    
    const combinedTotalInspections = combinedTotalInspectionsIndex >= 0 ? (parseFloat(values[combinedTotalInspectionsIndex]) || 0) : 0;
    const combinedTotalFaults = combinedTotalFaultsIndex >= 0 ? (parseFloat(values[combinedTotalFaultsIndex]) || 0) : 0;
    const combinedTotalDpu = combinedTotalDpuIndex >= 0 ? (parseFloat(values[combinedTotalDpuIndex]) || 0) : 0;
    
    const signoutVolume = signoutVolumeIndex >= 0 ? (parseFloat(values[signoutVolumeIndex]) || 0) : 0;

    parsedData.push({
      id: monthId,
      date,
      year,
      stages,
      productionTotalInspections,
      productionTotalFaults,
      productionTotalDpu,
      dpdiTotalInspections,
      dpdiTotalFaults,
      dpdiTotalDpu,
      combinedTotalInspections,
      combinedTotalFaults,
      combinedTotalDpu,
      signoutVolume
    });
  }

  return { data: parsedData, errors, warnings };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();
    
    // Parse CSV
    const { data: parsedMonths, errors, warnings } = parseCSV(csvContent);
    
    // If there are blocking errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        warnings
      }, { status: 400 });
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const collection = db.collection('Raw'); // Use same collection as main API

    // Get existing data to determine new stages
    const existingData = await collection.find({}).toArray();
    const existingStages = new Set<string>();
    
    existingData.forEach((month: any) => {
      month.stages?.forEach((stage: any) => {
        existingStages.add(stage.name);
      });
    });

    // Determine new stages
    const allNewStages = new Set<string>();
    parsedMonths.forEach(month => {
      month.stages.forEach(stage => {
        if (!existingStages.has(stage.name)) {
          allNewStages.add(stage.name);
        }
      });
    });

    const newStagesAdded = Array.from(allNewStages);
    const monthsUpdated: string[] = [];

    // CLEAR ALL EXISTING DATA - Complete replacement strategy
    await collection.deleteMany({});
    console.log('Cleared all existing data from database');

    // Insert all new data
    if (parsedMonths.length > 0) {
      await collection.insertMany(parsedMonths);
      console.log(`Inserted ${parsedMonths.length} months of data`);
      monthsUpdated.push(...parsedMonths.map(m => m.date));
    }

    // Prepare summary
    const summary: UploadSummary = {
      success: true,
      monthsProcessed: parsedMonths.length,
      monthsUpdated,
      newStagesAdded,
      errors: [],
      warnings
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

