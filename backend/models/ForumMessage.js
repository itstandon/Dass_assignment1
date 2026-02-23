const mongoose = require('mongoose');

const ForumMessageSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorRole: {
        type: String,
        enum: ['Participant', 'Organizer'],
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    isAnnouncement: {
        type: Boolean,
        default: false // Only organizers can post announcements
    },
    isPinned: {
        type: Boolean,
        default: false // Only organizers can pin messages
    },
    // Message threading support
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumMessage',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumMessage'
    }],
    // Reactions
    reactions: {
        like: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        helpful: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        question: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    // Soft delete for moderation
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
ForumMessageSchema.index({ event: 1, createdAt: -1 });
ForumMessageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('ForumMessage', ForumMessageSchema);
