import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { InspectionData } from '@/types';

// GET - Fetch all inspection data
export async function GET() {
  try {
    const collection = await getCollection('Raw');
    const data = await collection.find({}).toArray();
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inspection data' },
      { status: 500 }
    );
  }
}

// POST - Create new inspection data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = await getCollection('Raw');
    
    const result = await collection.insertOne(body);
    
    return NextResponse.json({ 
      success: true, 
      data: { ...body, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Error creating inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inspection data' },
      { status: 500 }
    );
  }
}

// PUT - Update all inspection data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { data }: { data: InspectionData[] } = body;
    
    const collection = await getCollection('Raw');
    
    // Clear existing data
    await collection.deleteMany({});
    
    // Insert new data
    if (data.length > 0) {
      const result = await collection.insertMany(data);
      console.log(`Inserted ${result.insertedCount} documents`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${data.length} inspection records` 
    });
  } catch (error) {
    console.error('Error updating inspection data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inspection data' },
      { status: 500 }
    );
  }
}

