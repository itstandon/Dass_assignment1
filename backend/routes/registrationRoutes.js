const express = require('express');
const router = express.Router();
const { auth, isParticipant, isOrganizer } = require('../middleware/auth');
const {
    registerForEvent,
    purchaseMerchandise,
    getEventRegistrations,
    getParticipantRegistrations,
    cancelRegistration,
    markAttendance
} = require('../controllers/registrationController');

/**
 * Registration Routes [Section 9: Event Registration]
 */

// Participant routes
// @route   POST /api/registrations/events/:eventId/register
// @desc    Register for a Normal event
// @access  Participant
router.post('/events/:eventId/register', auth, isParticipant, registerForEvent);

// @route   POST /api/registrations/events/:eventId/purchase
// @desc    Purchase merchandise
// @access  Participant
router.post('/events/:eventId/purchase', auth, isParticipant, purchaseMerchandise);

// @route   DELETE /api/registrations/events/:eventId/register
// @desc    Cancel registration
// @access  Participant
router.delete('/events/:eventId/register', auth, isParticipant, cancelRegistration);

// @route   GET /api/registrations/user
// @desc    Get all registrations for logged-in participant
// @access  Participant
router.get('/user', auth, isParticipant, getParticipantRegistrations);

// Organizer routes
// @route   GET /api/registrations/events/:eventId
// @desc    Get registrations for organizer's event
// @access  Organizer
router.get('/events/:eventId', auth, isOrganizer, getEventRegistrations);

// @route   PUT /api/registrations/events/:eventId/registrations/:registrationId/attendance
// @desc    Mark attendance
// @access  Organizer
router.put('/events/:eventId/registrations/:registrationId/attendance', auth, isOrganizer, markAttendance);

module.exports = router;
