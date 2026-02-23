const ForumMessage = require('../models/ForumMessage');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

/**
 * Real-Time Discussion Forum Controller
 * [6 Marks - Tier B Feature]
 */

// @route   GET /api/forum/:eventId/messages
// @desc    Get all forum messages for an event
// @access  Registered participants and organizers
exports.getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check access: Organizer of event OR registered participant
        if (userRole === 'Organizer') {
            if (event.organizer.toString() !== userId) {
                return res.status(403).json({ msg: 'Not authorized to view this forum' });
            }
        } else if (userRole === 'Participant') {
            const registration = await Registration.findOne({
                event: eventId,
                participant: userId,
                status: { $in: ['registered', 'attended', 'approved', 'pending'] }
            });
            if (!registration) {
                return res.status(403).json({ msg: 'Only registered participants can view the forum' });
            }
        }

        // Fetch messages (excluding deleted ones, unless user is organizer)
        const filter = { event: eventId };
        if (userRole !== 'Organizer') {
            filter.isDeleted = false;
        }

        const messages = await ForumMessage.find(filter)
            .populate('author', 'email organizerName firstName lastName')
            .populate('parentMessage', 'message authorName')
            .populate({
                path: 'replies',
                match: { isDeleted: false },
                populate: { path: 'author', select: 'email organizerName firstName lastName' }
            })
            .sort({ isPinned: -1, createdAt: -1 });

        res.json(messages);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   POST /api/forum/:eventId/messages
// @desc    Post a new message
// @access  Registered participants and organizers
exports.postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { message, isAnnouncement, parentMessageId } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ msg: 'Message cannot be empty' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ msg: 'Message too long (max 1000 characters)' });
        }

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Get user details
        const user = await User.findById(userId);
        const authorName = userRole === 'Organizer' 
            ? user.organizerName || user.email 
            : `${user.firstName} ${user.lastName}`;

        // Check access and announcement permission
        let canPost = false;
        if (userRole === 'Organizer' && event.organizer.toString() === userId) {
            canPost = true;
        } else if (userRole === 'Participant') {
            const registration = await Registration.findOne({
                event: eventId,
                participant: userId,
                status: { $in: ['registered', 'attended', 'approved', 'pending'] }
            });
            if (registration) {
                canPost = true;
            }
        }

        if (!canPost) {
            return res.status(403).json({ msg: 'Only registered participants or organizers can post' });
        }

        // Only organizers can post announcements
        const isAnnouncementFlag = userRole === 'Organizer' && isAnnouncement === true;

        // Validate parent message if replying
        let parentMsg = null;
        if (parentMessageId) {
            parentMsg = await ForumMessage.findById(parentMessageId);
            if (!parentMsg || parentMsg.event.toString() !== eventId) {
                return res.status(400).json({ msg: 'Invalid parent message' });
            }
        }

        // Create new message
        const newMessage = new ForumMessage({
            event: eventId,
            author: userId,
            authorName,
            authorRole: userRole,
            message: message.trim(),
            isAnnouncement: isAnnouncementFlag,
            parentMessage: parentMessageId || null
        });

        await newMessage.save();

        // If it's a reply, add to parent's replies array
        if (parentMsg) {
            parentMsg.replies.push(newMessage._id);
            await parentMsg.save();
        }

        // Populate author before sending response
        await newMessage.populate('author', 'email organizerName firstName lastName');

        res.json({
            msg: 'Message posted successfully',
            message: newMessage
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/forum/messages/:messageId/pin
// @desc    Pin/Unpin a message (Organizer only)
// @access  Organizer only
exports.togglePin = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ForumMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if user is the event organizer
        const event = await Event.findById(message.event);
        if (event.organizer.toString() !== userId) {
            return res.status(403).json({ msg: 'Only event organizers can pin messages' });
        }

        message.isPinned = !message.isPinned;
        message.updatedAt = new Date();
        await message.save();

        res.json({
            msg: message.isPinned ? 'Message pinned' : 'Message unpinned',
            message
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   DELETE /api/forum/messages/:messageId
// @desc    Delete a message (Organizer only - soft delete)
// @access  Organizer only
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ForumMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if user is the event organizer
        const event = await Event.findById(message.event);
        if (event.organizer.toString() !== userId) {
            return res.status(403).json({ msg: 'Only event organizers can delete messages' });
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedBy = userId;
        message.deletedAt = new Date();
        await message.save();

        res.json({ msg: 'Message deleted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/forum/messages/:messageId/react
// @desc    Add/remove reaction to a message
// @access  Registered participants and organizers
exports.toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reactionType } = req.body; // 'like', 'helpful', 'question'
        const userId = req.user.id;

        if (!['like', 'helpful', 'question'].includes(reactionType)) {
            return res.status(400).json({ msg: 'Invalid reaction type' });
        }

        const message = await ForumMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if user already reacted
        const reactionArray = message.reactions[reactionType];
        const userIndex = reactionArray.indexOf(userId);

        if (userIndex > -1) {
            // Remove reaction
            reactionArray.splice(userIndex, 1);
        } else {
            // Add reaction
            reactionArray.push(userId);
        }

        message.updatedAt = new Date();
        await message.save();

        res.json({
            msg: 'Reaction updated',
            message
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/forum/:eventId/unread-count
// @desc    Get count of new messages since last visit
// @access  Registered participants and organizers
exports.getUnreadCount = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { lastVisit } = req.query; // ISO timestamp of last visit
        const userId = req.user.id;

        if (!lastVisit) {
            return res.json({ unreadCount: 0 });
        }

        const lastVisitDate = new Date(lastVisit);

        // Count messages created after last visit
        const count = await ForumMessage.countDocuments({
            event: eventId,
            isDeleted: false,
            createdAt: { $gt: lastVisitDate },
            author: { $ne: userId } // Don't count user's own messages
        });

        res.json({ unreadCount: count });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
