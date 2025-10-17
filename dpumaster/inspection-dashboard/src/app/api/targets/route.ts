import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { YearTarget } from '@/types';

// GET - Fetch target for a specific year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const { db } = await connectToDatabase();
    const collection = db.collection<YearTarget>('targets');

    const target = await collection.findOne({ year });

    if (!target) {
      return NextResponse.json(
        { success: false, error: `No target found for year ${year}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, target });
  } catch (error) {
    console.error('Error fetching target:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch target',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create or update target for a year
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      year,
      combinedTarget,
      productionTarget,
      dpdiTarget,
      allocationStrategy,
      baseline,
      stageTargets
    } = body;

    // Validation
    if (!year || !combinedTarget || !productionTarget || !allocationStrategy || !baseline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<YearTarget>('targets');

    // Check if target already exists
    const existingTarget = await collection.findOne({ year });
    
    const targetData: any = {
      year,
      combinedTarget,
      productionTarget,
      dpdiTarget: dpdiTarget || 0,
      allocationStrategy,
      stageTargets: stageTargets || [],
      baseline,
      createdAt: existingTarget?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Use replaceOne for cleaner upsert
    const result = await collection.replaceOne(
      { year },
      targetData,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: result.upsertedCount > 0 ? 'Target created successfully' : 'Target updated successfully',
      target: targetData
    });
  } catch (error) {
    console.error('Error saving target:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save target',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove target for a year
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');

    if (!year) {
      return NextResponse.json(
        { success: false, error: 'Year parameter is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('targets');

    const result = await collection.deleteOne({ year });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: `No target found for year ${year}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Target for ${year} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting target:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete target',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

