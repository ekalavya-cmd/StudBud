const mongoose = require("mongoose");

async function connectToDatabase() {
  try {
    console.log("🔄 Attempting to connect to MongoDB Atlas...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    
    // Add database name to Atlas URI if not present
    let mongoUri = process.env.MONGO_URI;
    if (mongoUri.includes('mongodb+srv') && !mongoUri.includes('net/studyBuddy')) {
      mongoUri = mongoUri.replace('net/', 'net/studyBuddy');
    }
    
    // Connect to MongoDB Atlas
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // 15 second timeout for Atlas
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log("✅ Connected to MongoDB Atlas successfully!");
    console.log(`📍 Database: studyBuddy`);
    
  } catch (error) {
    console.error(`❌ MongoDB Atlas connection failed: ${error.message}`);
    console.error("Please check your MONGO_URI and network connectivity");
    throw error;
  }
}

async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB Atlas connection closed");
  } catch (error) {
    console.error("❌ Error closing database:", error.message);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  closeDatabase
};