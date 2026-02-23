const express = require('express');
const router = express.Router();
const { auth, isOrganizer } = require('../middleware/auth');
const {
    getMessages,
    postMessage,
    togglePin,
    deleteMessage,
    toggleReaction,
    getUnreadCount
} = require('../controllers/forumController');

/**
 * Forum Routes for Real-Time Discussion
 * [6 Marks - Tier B Feature]
 */

// Get all messages for an event
router.get('/:eventId/messages', auth, getMessages);

// Post a new message
router.post('/:eventId/messages', auth, postMessage);

// Get unread message count
router.get('/:eventId/unread-count', auth, getUnreadCount);

// Toggle pin status (organizer only)
router.put('/messages/:messageId/pin', isOrganizer, togglePin);

// Delete message (organizer only)
router.delete('/messages/:messageId', isOrganizer, deleteMessage);

// Toggle reaction
router.put('/messages/:messageId/react', auth, toggleReaction);

module.exports = router;
