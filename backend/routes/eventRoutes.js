const express = require('express');
const router = express.Router();
const {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getTrendingEvents,
    getOrganizerEvents,
    getEventParticipants,
    getOrganizerAnalytics
} = require('../controllers/eventController');
const { isOrganizer, auth } = require('../middleware/auth');

// Public routes
router.get('/', getAllEvents);
router.get('/trending', getTrendingEvents); // Place before /:id to avoid conflict

// Organizer routes (protected) - MUST come before /:id
router.get('/organizer/my-events', auth, isOrganizer, getOrganizerEvents);
router.get('/organizer/analytics', auth, isOrganizer, getOrganizerAnalytics); // Global analytics

// More public routes
router.get('/:id', getEventById);
router.get('/:id/participants', auth, isOrganizer, getEventParticipants);
router.post('/create', auth, isOrganizer, createEvent);
router.put('/:id', isOrganizer, updateEvent);
router.delete('/:id', isOrganizer, deleteEvent);

module.exports = router;