import { connectToDatabase } from '@/lib/mongodb';
import { INITIAL_DATA } from '@/types';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    const { db } = await connectToDatabase();
    const collection = db.collection('Raw');
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Insert initial data
    const result = await collection.insertMany(INITIAL_DATA);
    console.log(`✅ Inserted ${result.insertedCount} inspection records`);
    
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;

