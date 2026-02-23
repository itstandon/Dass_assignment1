const User = require('../models/User');

/**
 * Admin Controller [Section 11: Admin Features]
 */

// @route   POST /api/admin/create-organizer
// @desc    Admin provisions an organizer account [Section 11.2]
// @access  Admin
exports.createOrganizer = async (req, res) => {
    const { organizerName, category, email, description, contactNumber, contactEmail } = req.body;

    try {
        // Validate input
        if (!organizerName || !category || !contactEmail) {
            return res.status(400).json({ 
                msg: 'organizerName, category, and contactEmail are required' 
            });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Email already registered' });
        }

        // Auto-generate email if not provided
        const generatedEmail = email || `org-${organizerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@felicity.com`;
        
        // Auto-generate secure password
        const tempPassword = "Org" + Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        const organizer = new User({
            organizerName,
            category,
            email: generatedEmail,
            contactEmail,
            description: description || '',
            contactNumber: contactNumber || '',
            password: tempPassword, // Will be hashed by pre-save hook
            role: 'Organizer'
        });

        await organizer.save();
        
        // Return credentials for admin to share [Section 11.2]
        res.status(201).json({ 
            msg: 'Organizer created successfully. Share credentials securely with the organizer.',
            credentials: { 
                email: generatedEmail, 
                password: tempPassword,
                organizerName
            } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/admin/organizers
// @desc    Get all organizers [Section 11.2]
// @access  Admin
exports.getAllOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'Organizer' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(organizers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/admin/organizers/:id
// @desc    Get specific organizer details
// @access  Admin
exports.getOrganizerById = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id).select('-password');
        
        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(404).json({ msg: 'Organizer not found' });
        }

        res.json(organizer);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   DELETE /api/admin/organizers/:id
// @desc    PERMANENTLY Remove an organizer [Section 11.2]
// @access  Admin
exports.deleteOrganizer = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);
        
        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(404).json({ msg: 'Organizer not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Organizer permanently deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   PUT /api/admin/organizers/:id/archive
// @desc    Archive/Unarchive organizer (disable/enable login) [Section 11.2]
// @access  Admin
exports.archiveOrganizer = async (req, res) => {
    try {
        console.log('🔍 Archive request for organizer ID:', req.params.id);
        
        const organizer = await User.findById(req.params.id);
        
        if (!organizer || organizer.role !== 'Organizer') {
            console.log('❌ Organizer not found or not an organizer');
            return res.status(404).json({ msg: 'Organizer not found' });
        }

        console.log('📝 Current isArchived status:', organizer.isArchived);
        
        // Toggle archive status
        organizer.isArchived = !organizer.isArchived;
        await organizer.save();

        console.log('✅ New isArchived status:', organizer.isArchived);

        res.json({ 
            msg: `Organizer ${organizer.isArchived ? 'archived' : 'reactivated'} successfully`,
            organizer: {
                id: organizer._id,
                organizerName: organizer.organizerName,
                isArchived: organizer.isArchived
            }
        });
    } catch (err) {
        console.error('❌ Archive error:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   PUT /api/admin/organizers/:id/status
// @desc    Enable/Disable organizer account (legacy)
// @access  Admin
exports.toggleOrganizerStatus = async (req, res) => {
    try {
        const { enabled } = req.body;
        
        const organizer = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: enabled },
            { new: true }
        ).select('-password');

        res.json({ 
            msg: `Organizer ${enabled ? 'enabled' : 'disabled'} successfully`,
            organizer
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};