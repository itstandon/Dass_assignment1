const express = require('express');
const router = express.Router();
const { 
    createOrganizer,
    getAllOrganizers,
    getOrganizerById,
    deleteOrganizer,
    archiveOrganizer,
    toggleOrganizerStatus
} = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth'); // Use your middleware

// Admin endpoints [Section 11]
router.post('/create-organizer', isAdmin, createOrganizer);
router.get('/organizers', isAdmin, getAllOrganizers);
router.get('/organizers/:id', isAdmin, getOrganizerById);
router.delete('/organizers/:id', isAdmin, deleteOrganizer);
router.put('/organizers/:id/archive', isAdmin, archiveOrganizer); // Archive/unarchive
router.put('/organizers/:id/status', isAdmin, toggleOrganizerStatus);

module.exports = router;