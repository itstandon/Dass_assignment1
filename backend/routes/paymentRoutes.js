const express = require('express');
const router = express.Router();
const { auth, isOrganizer, isParticipant } = require('../middleware/auth');
const {
    uploadPaymentProof,
    getPendingPayments,
    approvePayment,
    rejectPayment
} = require('../controllers/paymentController');

/**
 * Payment Routes for Merchandise Payment Approval Workflow
 * [8 Marks Feature]
 */

// @route   PUT /api/payments/:registrationId/upload-proof
// @desc    Upload payment proof (Participant only)
router.put('/:registrationId/upload-proof', isParticipant, uploadPaymentProof);

// @route   GET /api/payments/event/:eventId/pending
// @desc    Get pending payments for an event (Organizer only)
router.get('/event/:eventId/pending', isOrganizer, getPendingPayments);

// @route   PUT /api/payments/:registrationId/approve
// @desc    Approve payment (Organizer only)
router.put('/:registrationId/approve', isOrganizer, approvePayment);

// @route   PUT /api/payments/:registrationId/reject
// @desc    Reject payment (Organizer only)
router.put('/:registrationId/reject', isOrganizer, rejectPayment);

module.exports = router;
