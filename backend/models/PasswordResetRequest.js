const mongoose = require('mongoose');

const PasswordResetRequestSchema = new mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizerName: {
        type: String,
        required: true
    },
    organizerEmail: {
        type: String,
        required: true
    },
    clubName: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    adminComments: {
        type: String,
        default: ''
    },
    newPassword: {
        type: String // Store temporarily for admin to share (will be hashed in User model)
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who reviewed
    },
    reviewedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
