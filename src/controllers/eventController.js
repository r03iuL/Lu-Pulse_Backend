const EventService = require("../services/eventService");

/**
 * Get all events (public access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllEvents = async (req, res) => {
  try {
    const events = await EventService.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve events. Please try again later." });
  }
};

/**
 * Create a new event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createEvent = async (req, res) => {
  try {
    const { name, date, time, venue, details, image } = req.body;

    // Validate required fields
    if (!name || !date || !time || !venue || !details) {
      return res
        .status(400)
        .json({ message: "Validation Error: All fields are required." });
    }

    const eventData = {
      name,
      date,
      time,
      venue,
      details,
      image,
    };

    const result = await EventService.createEvent(eventData);

    if (!result.insertedId) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to create the event." });
    }

    const newEvent = {
      ...eventData,
      createdAt: new Date(),
    };

    res.status(201).json({
      message: "Event created successfully.",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to create the event. Please try again later." });
  }
};

/**
 * Get a specific event by ID (public access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventService.getEventById(id);

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found: The requested event does not exist." });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve the event. Please try again later." });
  }
};

/**
 * Update an event by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, time, venue, details, image } = req.body;

    // Validate required fields
    if (!name || !date || !time || !venue || !details) {
      return res
        .status(400)
        .json({ message: "Validation Error: All fields are required." });
    }

    const updateData = {
      name,
      date,
      time,
      venue,
      details,
      image,
    };

    const result = await EventService.updateEvent(id, updateData);

    if (!result.matchedCount) {
      return res
        .status(404)
        .json({ message: "Event not found: The requested event does not exist." });
    }

    const updatedEvent = {
      ...updateData,
      updatedAt: new Date(),
    };

    res.status(200).json({
      message: "Event updated successfully. Your changes have been saved.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to update the event. Please try again later." });
  }
};

/**
 * Delete an event by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await EventService.getEventById(id);
    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found: The requested event does not exist." });
    }

    const result = await EventService.deleteEvent(id);

    if (result.deletedCount === 0) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to delete the event." });
    }

    res.status(200).json({ message: "Event deleted successfully. The event has been removed." });
  } catch (error) {
    console.error("Error deleting event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to delete the event. Please try again later." });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent
};
