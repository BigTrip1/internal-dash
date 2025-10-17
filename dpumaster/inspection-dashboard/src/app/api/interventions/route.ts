import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InterventionPlan } from '@/types/interventions';

// GET: Fetch intervention plan for a stage or all plans for a year
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const { db } = await connectToDatabase();
    const collection = db.collection<InterventionPlan>('interventions');

    // If no stage specified, return all plans for the year
    if (!stage) {
      const plans = await collection.find({ year }).toArray();
      return NextResponse.json({
        success: true,
        plans: plans || []
      });
    }

    // If stage specified, return specific plan
    const stageId = stage.toLowerCase().replace(/\s+/g, '_');
    const plan = await collection.findOne({ stageId, year });

    return NextResponse.json({
      success: true,
      plan: plan || null
    });
  } catch (error) {
    console.error('Error fetching intervention plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intervention plan' },
      { status: 500 }
    );
  }
}

// POST: Create or update intervention plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stageId, stageName, year, createdBy, currentState, interventions, projections } = body;

    // Validation
    if (!stageId || !stageName || !year || !interventions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<InterventionPlan>('interventions');

    // Check if plan already exists
    const existingPlan = await collection.findOne({ stageId, year });

    const planData: any = {
      stageId,
      stageName,
      year,
      createdBy: createdBy || 'Unknown',
      currentState,
      interventions,
      projections,
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Upsert the plan
    const result = await collection.replaceOne(
      { stageId, year },
      planData,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: result.upsertedCount > 0 ? 'Plan created successfully' : 'Plan updated successfully',
      plan: planData
    });
  } catch (error) {
    console.error('Error saving intervention plan:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save intervention plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove an intervention plan
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!stage) {
      return NextResponse.json(
        { success: false, error: 'Stage parameter is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<InterventionPlan>('interventions');

    const stageId = stage.toLowerCase().replace(/\s+/g, '_');
    const result = await collection.deleteOne({ stageId, year });

    return NextResponse.json({
      success: true,
      message: result.deletedCount > 0 ? 'Plan deleted successfully' : 'Plan not found'
    });
  } catch (error) {
    console.error('Error deleting intervention plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete intervention plan' },
      { status: 500 }
    );
  }
}

