const mongoose = require('mongoose');

/**
 * Attendance Model [Tier A Feature: QR Scanner & Attendance Tracking]
 * Tracks when participants scan their QR codes at events
 */
const AttendanceSchema = new mongoose.Schema({
    // Event being attended
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    // Registration record of the participant
    registration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true
    },

    // Participant who attended
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Timestamp when attendance was marked
    scannedAt: {
        type: Date,
        default: Date.now
    },

    // Device/location where QR was scanned (for audit trail)
    deviceInfo: String,

    // Status: 'scanned' | 'rejected_duplicate' | 'manual_override'
    status: {
        type: String,
        enum: ['scanned', 'rejected_duplicate', 'manual_override'],
        default: 'scanned'
    },

    // If marked manually by organizer
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The organizer who marked this
        sparse: true
    },

    // Notes for manual override (e.g., "Network was down, manual override")
    notes: String,

    // Create unique index on event + registration to prevent duplicate scans
});

// Unique index: each registration can only be scanned once per event
AttendanceSchema.index({ event: 1, registration: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
