import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { updateInspectionData } from '@/utils/dataUtils';

// PUT - Update specific stage data within a month
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const body = await request.json();
    const { inspected, faults } = body;
    
    const collection = await getCollection('Raw');
    
    // Get the current month data
    const monthData = await collection.findOne({ id: params.id });
    
    if (!monthData) {
      return NextResponse.json(
        { success: false, error: 'Month data not found' },
        { status: 404 }
      );
    }
    
    // Update the stage data and recalculate totals
    const updatedData = updateInspectionData(
      monthData as any,
      params.stageId,
      inspected,
      faults
    );
    
    // Update in database
    const result = await collection.updateOne(
      { id: params.id },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update data' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedData,
      message: 'Stage data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating stage data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stage data' },
      { status: 500 }
    );
  }
}
