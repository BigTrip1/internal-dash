import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { InspectionData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting data restoration from backup...');
    
    const collection = await getCollection('Raw');
    const body = await request.json();
    let backupData = body;

    // Handle both old format (array) and new format (object with metadata)
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

    console.log(`📊 Processing ${backupData.length} months of backup data`);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await collection.deleteMany({});

    // Process and restore the backup data
    const processedData = backupData.map((monthData: any, index: number) => {
      // Use the stages directly from backup if available, otherwise reconstruct
      let stages = [];
      
      if (monthData.stages && Array.isArray(monthData.stages)) {
        // Direct restoration from backup format
        stages = monthData.stages.map((stage: any) => ({
          id: stage.id || `${stage.name.toLowerCase()}-${monthData.date}`,
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
          id: `${stageName.toLowerCase()}-${monthData.date}`,
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
        id: monthData.id || `month-${monthData.date}`,
        date: monthData.date,
        totalInspections: monthData.totalInspections || totalInspections,
        totalFaults: monthData.totalFaults || totalFaults,
        totalDpu: monthData.totalDpu || Math.round(totalDpu * 100) / 100,
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
          'No data'
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
