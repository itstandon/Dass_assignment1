const express = require('express');
const router = express.Router();
const { auth, isOrganizer, isAdmin } = require('../middleware/auth');
const {
    createResetRequest,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    getOrganizerHistory
} = require('../controllers/passwordResetController');

/**
 * Password Reset Routes
 * [6 Marks - Tier B Feature]
 */

// Organizer routes
router.post('/request', isOrganizer, createResetRequest);
router.get('/my-requests', isOrganizer, getMyRequests);

// Admin routes
router.get('/admin/all', isAdmin, getAllRequests);
router.put('/admin/approve/:requestId', isAdmin, approveRequest);
router.put('/admin/reject/:requestId', isAdmin, rejectRequest);
router.get('/admin/history/:organizerId', isAdmin, getOrganizerHistory);

module.exports = router;
