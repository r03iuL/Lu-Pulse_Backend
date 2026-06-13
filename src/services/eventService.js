const Event = require("../models/Event");

/**
 * Service for handling event operations
 */
const eventService = {
  /**
   * Create a new event
   * @param {Object} eventData - Event object with name, date, time, venue, details, image
   * @returns {Promise<Object>} Insert result
   */
  createEvent: async (eventData) => {
    const newEvent = {
      name: eventData.name,
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue,
      details: eventData.details,
      image: eventData.image || null,
      createdAt: new Date(),
    };

    return await Event.insertOne(newEvent);
  },

  /**
   * Get an event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object>} Event object
   */
  getEventById: async (id) => {
    return await Event.findOneById(id);
  },

  /**
   * Get all events (public access)
   * @returns {Promise<Array>} All events array
   */
  getAllEvents: async () => {
    return await Event.findAll();
  },

  /**
   * Update an event by ID
   * @param {string} id - Event ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Update result
   */
  updateEvent: async (id, updateData) => {
    const updatedEvent = {
      name: updateData.name,
      date: updateData.date,
      time: updateData.time,
      venue: updateData.venue,
      details: updateData.details,
      image: updateData.image,
      updatedAt: new Date(),
    };

    return await Event.updateOneById(id, updatedEvent);
  },

  /**
   * Delete an event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object>} Delete result
   */
  deleteEvent: async (id) => {
    return await Event.deleteOneById(id);
  },
};

module.exports = eventService;
