const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database = null;

async function connectToDatabase() {
  if (database) {
    return database;
  }
  try {
    await client.connect();
    database = client.db('LuPulse');
    console.log('Connected to MongoDB');
    return database;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };