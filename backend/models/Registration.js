const mongoose = require('mongoose');

/**
 * Registration Model [Section 9: Event Registration]
 * Tracks participant registrations for Normal events and purchases for Merchandise events
 */
const RegistrationSchema = new mongoose.Schema({
    // Participant who registered
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Event for which registration occurred
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    // Registration timestamp
    registrationDate: {
        type: Date,
        default: Date.now
    },

    // Status: pending | confirmed | cancelled | waitlisted | attended | no-show
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'waitlisted', 'attended', 'no-show'],
        default: 'confirmed'
    },

    // ==================== NORMAL EVENT SPECIFIC ====================
    // Responses to the custom registration form
    formResponses: [{
        fieldName: String,
        fieldType: String,
        response: String  // User's answer to the field
    }],

    // Team name (if applicable for Normal events)
    teamName: String,

    // Ticket ID for the participant
    ticketId: {
        type: String,
        unique: true,
        sparse: true  // Allow null for merchandise events
    },

    // QR code data (will contain event + participant info)
    qrCode: {
        type: String,
        sparse: true
    },

    // ==================== MERCHANDISE EVENT SPECIFIC ====================
    // Quantity purchased
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },

    // Variant selected (size)
    variantSize: String,

    // Variant selected (color)
    variantColor: String,

    // Price paid at time of purchase
    pricePaid: Number,

    // Total amount for this purchase
    totalAmount: {
        type: Number,
        sparse: true
    },

    // Payment status (for merchandise orders)
    paymentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'failed', 'refunded'],
        default: 'pending',
        sparse: true
    },

    // Payment proof image URL (uploaded by participant)
    paymentProof: {
        type: String,
        sparse: true
    },

    // Payment proof upload timestamp
    paymentProofUploadedAt: {
        type: Date,
        sparse: true
    },

    // Payment approval/rejection details
    paymentReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },

    paymentReviewedAt: {
        type: Date,
        sparse: true
    },

    paymentRejectionReason: {
        type: String,
        sparse: true
    },

    // ==================== ATTENDANCE TRACKING ====================
    // Marked by organizer
    attendanceMarked: {
        type: Boolean,
        default: false
    },

    // Attendance mark timestamp
    attendanceMarkedAt: Date,

    // Marked by (organizer)
    attendanceMarkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    }
}, { timestamps: true });

// Index for faster queries
RegistrationSchema.index({ participant: 1, event: 1 }, { unique: true });
RegistrationSchema.index({ event: 1, status: 1 });
RegistrationSchema.index({ participant: 1, registrationDate: -1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
