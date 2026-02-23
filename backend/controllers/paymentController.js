const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { sendPurchaseConfirmation } = require('../utils/emailService');

/**
 * Payment Approval Controller for Merchandise Orders
 * [8 Marks Feature - Merchandise Payment Approval Workflow]
 */

// @route   PUT /api/payments/:registrationId/upload-proof
// @desc    Upload payment proof for merchandise order
// @access  Participant only
exports.uploadPaymentProof = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { paymentProofUrl } = req.body;
        const participantId = req.user.id;

        // Find the registration
        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Verify ownership
        if (registration.participant.toString() !== participantId) {
            return res.status(403).json({ msg: 'Not authorized to update this order' });
        }

        // Verify it's a merchandise order
        const event = await Event.findById(registration.event);
        if (!event || event.eventType !== 'Merchandise') {
            return res.status(400).json({ msg: 'This is not a merchandise order' });
        }

        // Update payment proof
        registration.paymentProof = paymentProofUrl;
        registration.paymentProofUploadedAt = new Date();
        registration.paymentStatus = 'pending'; // Set to pending for review

        await registration.save();

        res.json({
            msg: 'Payment proof uploaded successfully. Awaiting organizer approval.',
            registration
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/payments/event/:eventId/pending
// @desc    Get all pending payment approvals for an event
// @access  Organizer only
exports.getPendingPayments = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.id;

        // Verify organizer owns this event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized to view payments' });
        }

        // Get all registrations with payment status
        const orders = await Registration.find({ 
            event: eventId,
            paymentProof: { $exists: true, $ne: null }
        })
        .populate('participant', 'firstName lastName email contactNumber')
        .sort({ paymentProofUploadedAt: -1 });

        res.json(orders);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   PUT /api/payments/:registrationId/approve
// @desc    Approve payment for merchandise order
// @access  Organizer only
exports.approvePayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const organizerId = req.user.id;

        // Find the registration
        const registration = await Registration.findById(registrationId)
            .populate('event')
            .populate('participant', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Verify organizer owns this event
        if (registration.event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized to approve this payment' });
        }

        // Check if payment proof exists
        if (!registration.paymentProof) {
            return res.status(400).json({ msg: 'No payment proof uploaded' });
        }

        // Check if already approved
        if (registration.paymentStatus === 'approved') {
            return res.status(400).json({ msg: 'Payment already approved' });
        }

        // Generate ticket ID if not exists
        if (!registration.ticketId) {
            const participantId = registration.participant._id;
            const eventId = registration.event._id;
            registration.ticketId = `MER-${eventId.toString().slice(-6).toUpperCase()}-${participantId.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        }

        // Generate QR code if not exists
        if (!registration.qrCode) {
            registration.qrCode = JSON.stringify({
                ticketId: registration.ticketId,
                type: 'Merchandise',
                eventId: registration.event._id,
                participantId: registration.participant._id,
                quantity: registration.quantity,
                size: registration.variantSize,
                color: registration.variantColor,
                purchasedAt: registration.registrationDate,
                approvedAt: new Date()
            });
        }

        // Update payment status
        registration.paymentStatus = 'approved';
        registration.status = 'confirmed';
        registration.paymentReviewedBy = organizerId;
        registration.paymentReviewedAt = new Date();

        await registration.save();

        // Send confirmation email with QR code
        try {
            const qrCodeObject = JSON.parse(registration.qrCode);
            await sendPurchaseConfirmation(
                registration.participant,
                registration.event,
                registration.ticketId,
                registration.quantity,
                registration.variantSize,
                registration.variantColor,
                registration.totalAmount,
                qrCodeObject
            );
        } catch (emailErr) {
            console.error('Email sending failed:', emailErr);
            // Don't fail the approval if email fails
        }

        res.json({
            msg: 'Payment approved successfully. Ticket and QR code generated.',
            registration,
            ticketId: registration.ticketId
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/payments/:registrationId/reject
// @desc    Reject payment for merchandise order
// @access  Organizer only
exports.rejectPayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { reason } = req.body;
        const organizerId = req.user.id;

        // Find the registration
        const registration = await Registration.findById(registrationId)
            .populate('event');

        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Verify organizer owns this event
        if (registration.event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized to reject this payment' });
        }

        // Update payment status
        registration.paymentStatus = 'rejected';
        registration.status = 'cancelled';
        registration.paymentReviewedBy = organizerId;
        registration.paymentReviewedAt = new Date();
        registration.paymentRejectionReason = reason || 'Payment proof rejected by organizer';

        // Do NOT generate QR code for rejected payments
        registration.ticketId = null;
        registration.qrCode = null;

        await registration.save();

        // Refund stock
        const event = await Event.findById(registration.event._id);
        if (event) {
            event.totalStock += registration.quantity;
            
            // Refund variant stock if applicable
            if (registration.variantSize && registration.variantColor) {
                const variant = event.merchandiseItems[0]?.variants?.find(v =>
                    v.size === registration.variantSize && v.color === registration.variantColor
                );
                if (variant) {
                    variant.stock += registration.quantity;
                }
            }
            
            await event.save();
        }

        res.json({
            msg: 'Payment rejected. Stock has been refunded.',
            registration
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
