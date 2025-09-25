import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// Parse CSV content into structured data
function parseCSV(csvContent: string) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Convert numeric values
      if (header.includes('Inspected') || header.includes('Faults') || header.includes('DPU')) {
        value = parseFloat(value) || 0;
      }
      
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return { headers, data };
}

// Convert CSV data to our database format
function convertCSVToDatabaseFormat(csvData: any[]) {
  // Group data by month
  const monthsMap = new Map();
  
  csvData.forEach(row => {
    const month = row['Month'] || row['month'];
    if (!month) return;
    
    if (!monthsMap.has(month)) {
      monthsMap.set(month, {
        id: `month-${month}`,
        date: month,
        stages: [],
        totalInspections: 0,
        totalFaults: 0,
        totalDpu: 0
      });
    }
    
    const monthData = monthsMap.get(month);
    
    // Extract stage data from columns
    const stageNames = [
      'BOOMS', 'SIP1', 'SIP1A', 'SIP2', 'SIP3', 'SIP4', 'RR', 'UVI', 
      'SIP5', 'FTEST', 'LECREC', 'CT', 'UV2', 'CABWT', 'SIP6', 
      'CFC', 'CABSIP', 'UV3', 'SIGN'
    ];
    
    stageNames.forEach(stageName => {
      const inspectedKey = `${stageName} Inspected`;
      const faultsKey = `${stageName} Faults`;
      const dpuKey = `${stageName} DPU`;
      
      if (row[inspectedKey] !== undefined || row[faultsKey] !== undefined || row[dpuKey] !== undefined) {
        const inspected = parseFloat(row[inspectedKey]) || 0;
        const faults = parseFloat(row[faultsKey]) || 0;
        const dpu = parseFloat(row[dpuKey]) || 0;
        
        monthData.stages.push({
          id: `${stageName.toLowerCase()}-${month}`,
          name: stageName,
          inspected,
          faults,
          dpu
        });
        
        monthData.totalInspections += inspected;
        monthData.totalFaults += faults;
        monthData.totalDpu += dpu;
      }
    });
    
    // Round total DPU
    monthData.totalDpu = Math.round(monthData.totalDpu * 100) / 100;
  });
  
  return Array.from(monthsMap.values());
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting CSV data restoration...');
    
    const collection = await getCollection('Raw');
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSV content'
      }, { status: 400 });
    }

    console.log('📊 Parsing CSV content...');
    const { headers, data } = parseCSV(csvContent);
    
    console.log(`📊 Found ${headers.length} columns and ${data.length} rows`);
    console.log(`📊 Headers: ${headers.slice(0, 5).join(', ')}...`);

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data found in CSV file'
      }, { status: 400 });
    }

    console.log('🔄 Converting CSV to database format...');
    const processedData = convertCSVToDatabaseFormat(data);

    if (processedData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid monthly data found in CSV file'
      }, { status: 400 });
    }

    console.log(`📊 Processed ${processedData.length} months of data`);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await collection.deleteMany({});

    // Insert the processed data
    console.log('💾 Inserting restored data...');
    const result = await collection.insertMany(processedData);

    console.log(`✅ Successfully restored ${result.insertedCount} months of CSV data`);

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${result.insertedCount} months of CSV data.`,
      details: {
        monthsRestored: result.insertedCount,
        totalStages: processedData[0]?.stages?.length || 0,
        dateRange: processedData.length > 0 ? 
          `${processedData[0].date} to ${processedData[processedData.length - 1].date}` : 
          'No data',
        csvRows: data.length,
        csvColumns: headers.length
      }
    });

  } catch (error) {
    console.error('❌ Error restoring CSV data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to restore CSV data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
