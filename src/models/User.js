const { connectToDatabase } = require("../config/db");
const { ObjectId } = require("mongodb");

let userCollectionPromise = null;

async function getUserCollection() {
  if (!userCollectionPromise) {
    userCollectionPromise = connectToDatabase().then(db => db.collection("Users"));
  }
  return userCollectionPromise;
}

const User = {
  // Find a user by email
  findOneByEmail: async (email) => {
    const collection = await getUserCollection();
    return collection.findOne({ email });
  },

  // Find a user by _id
  findOneById: async (id) => {
    const collection = await getUserCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  },

  // Insert a new user
  insertOne: async (userData) => {
    const collection = await getUserCollection();
    return collection.insertOne(userData);
  },

  // Update a user by email
  updateOneByEmail: async (email, updateData) => {
    const collection = await getUserCollection();
    return collection.updateOne({ email }, { $set: updateData });
  },

  // Update a user by _id
  updateOneById: async (id, updateData) => {
    const collection = await getUserCollection();
    return collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  },

  // Delete a user by email
  deleteOneByEmail: async (email) => {
    const collection = await getUserCollection();
    return collection.deleteOne({ email });
  },

  // Get all users
  findAll: async () => {
    const collection = await getUserCollection();
    return collection.find().toArray();
  },
};

module.exports = User;