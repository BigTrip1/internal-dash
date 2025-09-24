import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'dpu_master';
const collectionName = 'Raw';

// Sample data for seeding
const generateSeedData = () => {
  const months = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
  ];

  const stageNames = ['UV2', 'CABWT', 'SIP6', 'CFC', 'CABSIP', 'UV3', 'SIGN'];

  return months.map((month, index) => {
    // Create progressive improvement toward 8.2 target
    const baseDPU = 20.17 - (index * 1.2); // Gradual improvement
    const isCurrentMonth = index <= 8; // Jan to Sep have data, Oct-Dec are future
    
    if (!isCurrentMonth) {
      // Future months have no data
      const stages = stageNames.map(stageName => ({
        id: `${stageName.toLowerCase()}-${month}`,
        name: stageName,
        inspected: 0,
        faults: 0,
        dpu: 0
      }));

      return {
        id: `month-${month}`,
        date: month,
        totalInspections: 0,
        totalFaults: 0,
        totalDpu: 0,
        stages
      };
    }

    // Generate realistic stage data for current months
    const stages = stageNames.map(stageName => {
      let inspected, faults, dpu;
      
      switch (stageName) {
        case 'UV2':
          inspected = Math.floor(1400 + Math.random() * 200);
          faults = Math.floor(inspected * (0.02 + Math.random() * 0.01));
          break;
        case 'CABWT':
          inspected = Math.floor(1400 + Math.random() * 200);
          faults = Math.floor(inspected * (0.001 + Math.random() * 0.002));
          break;
        case 'SIP6':
          inspected = Math.floor(1350 + Math.random() * 250);
          faults = Math.floor(inspected * (0.15 + Math.random() * 0.1));
          break;
        case 'CFC':
          inspected = Math.floor(1300 + Math.random() * 300);
          faults = Math.floor(inspected * (0.4 + Math.random() * 0.2));
          break;
        case 'CABSIP':
          inspected = index >= 3 ? Math.floor(1500 + Math.random() * 200) : 0;
          faults = inspected > 0 ? Math.floor(inspected * (0.001 + Math.random() * 0.002)) : 0;
          break;
        case 'UV3':
          inspected = index >= 7 ? Math.floor(1300 + Math.random() * 400) : 0;
          faults = inspected > 0 ? Math.floor(inspected * (0.01 + Math.random() * 0.02)) : 0;
          break;
        case 'SIGN':
          inspected = Math.floor(1400 + Math.random() * 300);
          faults = Math.floor(inspected * (0.0001 + Math.random() * 0.0005));
          break;
        default:
          inspected = Math.floor(1400 + Math.random() * 200);
          faults = Math.floor(inspected * (0.01 + Math.random() * 0.02));
      }

      dpu = inspected > 0 ? Number((faults / inspected).toFixed(2)) : 0;

      return {
        id: `${stageName.toLowerCase()}-${month}`,
        name: stageName,
        inspected,
        faults,
        dpu
      };
    });

    // Calculate totals
    const totalInspections = stages.reduce((sum, stage) => sum + stage.inspected, 0);
    const totalFaults = stages.reduce((sum, stage) => sum + stage.faults, 0);
    const totalDpu = totalInspections > 0 ? Number((totalFaults / totalInspections).toFixed(2)) : 0;

    return {
      id: `month-${month}`,
      date: month,
      totalInspections,
      totalFaults,
      totalDpu,
      stages
    };
  });
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let client: MongoClient | null = null;

  try {
    console.log('🌱 Starting database seeding process...');
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing records`);

    // Generate and insert seed data
    console.log('📊 Generating seed data...');
    const seedData = generateSeedData();
    
    console.log('💾 Inserting seed data...');
    const insertResult = await collection.insertMany(seedData);
    
    const duration = `${Date.now() - startTime}ms`;
    const stagesCreated = seedData.reduce((sum, month) => sum + month.stages.length, 0);
    
    console.log(`✅ Seeding completed in ${duration}`);
    console.log(`📊 Created ${insertResult.insertedCount} month records`);
    console.log(`🏭 Created ${stagesCreated} stage records`);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      recordsCreated: insertResult.insertedCount,
      stagesCreated,
      duration,
      summary: `Successfully seeded ${insertResult.insertedCount} months of inspection data with ${stagesCreated} stage records. Database is ready for quality tracking.`
    });

  } catch (error) {
    console.error('❌ Seeding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  let client: MongoClient | null = null;

  try {
    const url = new URL(request.url);
    const shouldClear = url.searchParams.get('clear') === 'true';

    if (!shouldClear) {
      return NextResponse.json(
        { success: false, error: 'Clear parameter not provided' },
        { status: 400 }
      );
    }

    console.log('🗑️ Starting database clearing process...');
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Clear all data
    console.log('🗑️ Clearing all data...');
    const deleteResult = await collection.deleteMany({});
    
    const duration = `${Date.now() - startTime}ms`;
    
    console.log(`✅ Clearing completed in ${duration}`);
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} records`);

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      recordsDeleted: deleteResult.deletedCount,
      duration,
      summary: `Successfully deleted ${deleteResult.deletedCount} records. Database is now empty.`
    });

  } catch (error) {
    console.error('❌ Clearing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear database', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}
