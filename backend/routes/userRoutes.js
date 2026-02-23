const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { auth, isParticipant } = require('../middleware/auth');

// @route   GET /api/user/preferences
// @desc    Get participant profile and preferences
router.get('/preferences', auth, isParticipant, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/preferences
// @desc    Update participant interests and followed clubs
router.put('/preferences', auth, isParticipant, async (req, res) => {
    const { interests, followedClubs, onboardingCompleted, action, clubId, firstName, lastName, contactNumber, college, participantType } = req.body;
    try {
        const user = await User.findById(req.user.id);

        if (action === 'follow' && clubId) {
            // Add to followedClubs if not already present
            if (!user.followedClubs.find(id => id.toString() === clubId)) {
                user.followedClubs.push(clubId);
            }
        } else if (action === 'unfollow' && clubId) {
            // Remove from followedClubs
            user.followedClubs = user.followedClubs.filter(id => id.toString() !== clubId);
        } else {
            // Regular update
            if (interests) user.interests = interests;
            if (followedClubs) user.followedClubs = followedClubs;
            // Only update onboardingCompleted if explicitly provided
            if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

            // Allow profile updates here too if needed (Profile.js uses this endpoint for GET but also PUT?)
            // Profile.js uses /api/user/preferences for PUT updates of profile data as well!
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (contactNumber) user.contactNumber = contactNumber;
            if (college) user.college = college;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/profile
// @desc    Get user profile (works for all roles)
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/profile
// @desc    Update participant profile details [Section 9.6]
router.put('/profile', auth, async (req, res) => {
    const { firstName, lastName, contactNumber, college, interests, followedClubs } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    firstName,
                    lastName,
                    contactNumber,
                    college,
                    interests: interests || [],
                    followedClubs: followedClubs || [],
                    // Organizer specific updates
                    organizerName: req.body.organizerName,
                    category: req.body.category,
                    contactEmail: req.body.contactEmail,
                    description: req.body.description,
                    discordWebhookUrl: req.body.discordWebhookUrl
                }
            },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/followed-clubs
// @desc    Get details of followed clubs (Section 9.6 - Followed Clubs)
router.get('/followed-clubs', auth, isParticipant, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('followedClubs', 'organizerName email category');
        res.json(user.followedClubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/all-clubs
// @desc    Get all available clubs for selection (Section 9.6 - Followed Clubs editing)
router.get('/all-clubs', auth, async (req, res) => {
    try {
        const clubs = await User.find({ role: 'Organizer', isArchived: false }).select('organizerName email category description contactEmail');
        res.json(clubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/organizers/:id
// @desc    Get organizer details (Section: Organizer Detail Page)
router.get('/organizers/:id', auth, async (req, res) => {
    try {
        const organizer = await User.findOne({ 
            _id: req.params.id, 
            role: 'Organizer',
            isArchived: false 
        }).select('organizerName category description contactEmail');
        
        if (!organizer) {
            return res.status(404).json({ msg: 'Organizer not found' });
        }
        
        res.json(organizer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/change-password
// @desc    Change user password (Section 9.6 Security Settings)
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters' });
        }

        // Get user with password
        const user = await User.findById(req.user.id);
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Set new password - pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;