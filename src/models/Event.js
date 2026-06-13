const { connectToDatabase } = require("../config/db");
const { ObjectId } = require("mongodb");

let eventCollectionPromise = null;

async function getEventCollection() {
  if (!eventCollectionPromise) {
    eventCollectionPromise = connectToDatabase().then(db => db.collection("Events"));
  }
  return eventCollectionPromise;
}

const Event = {
  // Find an event by ID
  findOneById: async (id) => {
    const collection = await getEventCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  },

  // Find events with query
  find: async (query) => {
    const collection = await getEventCollection();
    return collection.find(query).toArray();
  },

  // Insert a new event
  insertOne: async (eventData) => {
    const collection = await getEventCollection();
    return collection.insertOne(eventData);
  },

  // Update an event by ID
  updateOneById: async (id, updateData) => {
    const collection = await getEventCollection();
    return collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  },

  // Delete an event by ID
  deleteOneById: async (id) => {
    const collection = await getEventCollection();
    return collection.deleteOne({ _id: new ObjectId(id) });
  },

  // Get all events
  findAll: async () => {
    const collection = await getEventCollection();
    return collection.find().toArray();
  },
};

module.exports = Event;
