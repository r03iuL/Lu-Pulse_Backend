const { connectToDatabase } = require("../config/db");
const { ObjectId } = require("mongodb");

let noticeCollectionPromise = null;

async function getNoticeCollection() {
  if (!noticeCollectionPromise) {
    noticeCollectionPromise = connectToDatabase().then(db => db.collection("Notices"));
  }
  return noticeCollectionPromise;
}

const Notice = {
  // Find a notice by ID
  findOneById: async (id) => {
    const collection = await getNoticeCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  },

  // Find notices with query
  find: async (query) => {
    const collection = await getNoticeCollection();
    return collection.find(query).toArray();
  },

  // Insert a new notice
  insertOne: async (noticeData) => {
    const collection = await getNoticeCollection();
    return collection.insertOne(noticeData);
  },

  // Update a notice by ID
  updateOneById: async (id, updateData) => {
    const collection = await getNoticeCollection();
    return collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  },

  // Delete a notice by ID
  deleteOneById: async (id) => {
    const collection = await getNoticeCollection();
    return collection.deleteOne({ _id: new ObjectId(id) });
  },

  // Get all notices
  findAll: async () => {
    const collection = await getNoticeCollection();
    return collection.find().toArray();
  },
};

module.exports = Notice;
