const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Password Reset Workflow Controller
 * [6 Marks - Tier B Feature]
 */

// @route   POST /api/password-reset/request
// @desc    Organizer requests password reset from Admin
// @access  Organizer only
exports.createResetRequest = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({ 
                msg: 'Please provide a detailed reason (minimum 10 characters)' 
            });
        }

        // Get organizer details
        const organizer = await User.findById(organizerId);
        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(403).json({ msg: 'Only organizers can request password reset' });
        }

        // Check if there's already a pending request
        const existingRequest = await PasswordResetRequest.findOne({
            organizer: organizerId,
            status: 'Pending'
        });

        if (existingRequest) {
            return res.status(400).json({ 
                msg: 'You already have a pending password reset request. Please wait for admin approval.' 
            });
        }

        // Create new reset request
        const resetRequest = new PasswordResetRequest({
            organizer: organizerId,
            organizerName: organizer.organizerName || organizer.email,
            organizerEmail: organizer.email,
            clubName: organizer.category || 'N/A',
            reason: reason.trim()
        });

        await resetRequest.save();

        res.json({
            msg: 'Password reset request submitted successfully. Admin will review your request.',
            request: resetRequest
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/password-reset/my-requests
// @desc    Get organizer's own password reset requests
// @access  Organizer only
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ 
            organizer: req.user.id 
        }).sort({ createdAt: -1 });

        res.json(requests);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/password-reset/admin/all
// @desc    Admin views all password reset requests
// @access  Admin only
exports.getAllRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
            filter.status = status;
        }

        const requests = await PasswordResetRequest.find(filter)
            .populate('organizer', 'email organizerName category')
            .populate('reviewedBy', 'email')
            .sort({ createdAt: -1 });

        res.json(requests);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/password-reset/admin/approve/:requestId
// @desc    Admin approves password reset and generates new password
// @access  Admin only
exports.approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminComments } = req.body;
        const adminId = req.user.id;

        const request = await PasswordResetRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ msg: 'Password reset request not found' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ msg: 'This request has already been reviewed' });
        }

        // Auto-generate new password (8 characters: letters + numbers)
        const newPassword = generatePassword();

        // Hash the password for User model
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update organizer's password
        await User.findByIdAndUpdate(request.organizer, {
            password: hashedPassword
        });

        // Update request status
        request.status = 'Approved';
        request.adminComments = adminComments || 'Approved';
        request.newPassword = newPassword; // Store plain password for admin to share
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();

        await request.save();

        res.json({
            msg: 'Password reset approved successfully',
            newPassword: newPassword, // Send to admin to share with organizer
            request
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/password-reset/admin/reject/:requestId
// @desc    Admin rejects password reset request
// @access  Admin only
exports.rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminComments } = req.body;
        const adminId = req.user.id;

        if (!adminComments || adminComments.trim().length < 5) {
            return res.status(400).json({ 
                msg: 'Please provide a reason for rejection (minimum 5 characters)' 
            });
        }

        const request = await PasswordResetRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ msg: 'Password reset request not found' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ msg: 'This request has already been reviewed' });
        }

        // Update request status
        request.status = 'Rejected';
        request.adminComments = adminComments.trim();
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();

        await request.save();

        res.json({
            msg: 'Password reset request rejected',
            request
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/password-reset/admin/history/:organizerId
// @desc    Get password reset history for a specific organizer
// @access  Admin only
exports.getOrganizerHistory = async (req, res) => {
    try {
        const { organizerId } = req.params;

        const history = await PasswordResetRequest.find({ 
            organizer: organizerId 
        })
        .populate('reviewedBy', 'email')
        .sort({ createdAt: -1 });

        res.json(history);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// Helper function to generate random password
function generatePassword(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
