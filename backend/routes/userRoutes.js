const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

module.exports = router;