const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB || 'dpu_master';
  
  console.log('🔍 Checking MongoDB connection...');
  console.log(`URI: ${uri}`);
  console.log(`Database: ${dbName}`);
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.map(c => c.name).join(', ')}`);
    
    const rawCollection = db.collection('Raw');
    const count = await rawCollection.countDocuments();
    console.log(`📊 Documents in 'Raw' collection: ${count}`);
    
    await client.close();
    console.log('🎉 MongoDB check completed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure MongoDB is running: mongod');
    console.log('2. Check if the service is started: net start MongoDB');
    console.log('3. Verify the connection string in .env.local');
    console.log('4. The app will work in offline mode using localStorage');
  }
}

checkMongoDB();
