import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { InspectionData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting data restoration from backup...');
    
    const collection = await getCollection('Raw');
    const body = await request.json();
    let backupData = body;

    // Handle different backup formats
    if (backupData.data && Array.isArray(backupData.data)) {
      console.log(`📊 Processing enhanced backup with metadata`);
      console.log(`📊 Backup info: ${backupData.metadata?.totalMonths} months, ${backupData.metadata?.totalStages} stages`);
      console.log(`📊 Export date: ${backupData.metadata?.exportDate}`);
      backupData = backupData.data;
    } else if (!Array.isArray(backupData)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup data format. Expected array of months or backup object with data property.'
      }, { status: 400 });
    }

    // Check if this is a MongoDB export format (with _id and $oid)
    const isMongoDBExport = backupData.length > 0 && backupData[0]._id && backupData[0]._id.$oid;
    if (isMongoDBExport) {
      console.log(`📊 Detected MongoDB export format - cleaning data structure`);
    }

    console.log(`📊 Processing ${backupData.length} months of backup data`);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await collection.deleteMany({});

    // Process and restore the backup data
    const processedData = backupData.map((monthData: any, index: number) => {
      // Clean MongoDB export format if needed
      let cleanMonthData = { ...monthData };
      if (isMongoDBExport) {
        // Remove MongoDB _id field and keep the rest
        delete cleanMonthData._id;
      }

      // Use the stages directly from backup if available, otherwise reconstruct
      let stages = [];
      
      if (cleanMonthData.stages && Array.isArray(cleanMonthData.stages)) {
        // Direct restoration from backup format
        stages = cleanMonthData.stages.map((stage: any) => ({
          id: stage.id || `${stage.name.toLowerCase()}-${cleanMonthData.date}`,
          name: stage.name,
          inspected: stage.inspected || 0,
          faults: stage.faults || 0,
          dpu: stage.dpu || 0
        }));
      } else {
        // Fallback: reconstruct stages (for older backup formats)
        const stageNames = [
          'BOOMS', 'SIP1', 'SIP1A', 'SIP2', 'SIP3', 'SIP4', 'RR', 'UVI', 
          'SIP5', 'FTEST', 'LECREC', 'CT', 'UV2', 'CABWT', 'SIP6', 
          'CFC', 'CABSIP', 'UV3', 'SIGN'
        ];

        stages = stageNames.map(stageName => ({
          id: `${stageName.toLowerCase()}-${cleanMonthData.date}`,
          name: stageName,
          inspected: 0,
          faults: 0,
          dpu: 0
        }));
      }

      // Calculate totals (sum of stage DPUs)
      const totalInspections = stages.reduce((sum, stage) => sum + stage.inspected, 0);
      const totalFaults = stages.reduce((sum, stage) => sum + stage.faults, 0);
      const totalDpu = stages.reduce((sum, stage) => sum + stage.dpu, 0);

      return {
        id: cleanMonthData.id || `month-${cleanMonthData.date}`,
        date: cleanMonthData.date,
        totalInspections: cleanMonthData.totalInspections || totalInspections,
        totalFaults: cleanMonthData.totalFaults || totalFaults,
        totalDpu: cleanMonthData.totalDpu || Math.round(totalDpu * 100) / 100,
        stages
      };
    });

    // Insert the processed data
    console.log('💾 Inserting restored data...');
    const result = await collection.insertMany(processedData);

    console.log(`✅ Successfully restored ${result.insertedCount} months of data`);

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${result.insertedCount} months of backup data.`,
      details: {
        monthsRestored: result.insertedCount,
        totalStages: processedData[0]?.stages?.length || 0,
        dateRange: processedData.length > 0 ? 
          `${processedData[0].date} to ${processedData[processedData.length - 1].date}` : 
          'No data',
        formatDetected: isMongoDBExport ? 'MongoDB Export Format' : 'Standard Backup Format'
      }
    });

  } catch (error) {
    console.error('❌ Error restoring data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to restore backup data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
