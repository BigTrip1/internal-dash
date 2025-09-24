import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { InspectionData } from '@/types';

// GET - Fetch specific inspection data by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await getCollection('Raw');
    const data = await collection.findOne({ id: params.id });
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Inspection data not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inspection data' },
      { status: 500 }
    );
  }
}

// PUT - Update specific inspection data
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const collection = await getCollection('Raw');
    
    const result = await collection.updateOne(
      { id: params.id },
      { $set: body }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Inspection data not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inspection data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inspection data' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific inspection data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await getCollection('Raw');
    
    const result = await collection.deleteOne({ id: params.id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Inspection data not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inspection data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete inspection data' },
      { status: 500 }
    );
  }
}

