import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Recalculating all totals with correct DPU formula...');
    
    const collection = await getCollection('Raw');
    
    // Get all existing data
    const allData = await collection.find({}).toArray();
    console.log(`📊 Found ${allData.length} months of data to recalculate`);

    let totalUpdates = 0;

    // Process each month
    for (const monthData of allData) {
      // Recalculate totals using correct formula
      const totalInspections = monthData.stages.reduce((sum: number, stage: any) => sum + stage.inspected, 0);
      const totalFaults = monthData.stages.reduce((sum: number, stage: any) => sum + stage.faults, 0);
      // CORRECT: Total DPU is sum of all stage DPUs for that month
      const totalDpu = monthData.stages.reduce((sum: number, stage: any) => sum + stage.dpu, 0);

      // Update the document
      await collection.updateOne(
        { _id: monthData._id },
        {
          $set: {
            totalInspections,
            totalFaults,
            totalDpu: Math.round(totalDpu * 100) / 100
          }
        }
      );

      console.log(`📝 Month ${monthData.date}: Updated totals - Inspections: ${totalInspections}, Faults: ${totalFaults}, DPU: ${Math.round(totalDpu * 100) / 100}`);
      totalUpdates++;
    }

    console.log(`✅ Successfully recalculated totals for ${totalUpdates} months`);

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated all totals with correct DPU formula.`,
      details: {
        monthsUpdated: totalUpdates,
        calculationMethod: 'Total DPU = Sum of all stage DPUs for each month'
      }
    });

  } catch (error) {
    console.error('❌ Error recalculating totals:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to recalculate totals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
