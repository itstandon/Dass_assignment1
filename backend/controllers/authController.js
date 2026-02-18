const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @route   POST /api/auth/register
// @desc    Register a participant
exports.register = async (req, res) => {
    const { firstName, lastName, email, password, contactNumber, college, participantType } = req.body;

    try {
        // 1. Mandatory Email Domain Validation
        if (participantType === 'IIIT') {
            const allowedDomains = ['research.iiit.ac.in', 'students.iiit.ac.in', 'iiit.ac.in'];
            const emailDomain = email.split('@')[1];
            
            if (!allowedDomains.includes(emailDomain)) {
                return res.status(400).json({ 
                    msg: 'IIIT students must use a valid institute email (iiit.ac.in, students.iiit.ac.in, or research.iiit.ac.in)' 
                });
            }
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // 2. Create Participant (Role switching prohibited) [Section 6.1: All fields]
        user = new User({
            firstName,
            lastName,
            email,
            password, // Will be hashed by pre-save hook in User.js
            contactNumber,
            college,
            role: 'Participant',
            participantType,
            onboardingCompleted: false // Mark onboarding as not completed
        });

        await user.save();
        res.status(201).json({ msg: 'Registration successful' });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Session Management)
/*exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Create JWT
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role }); 
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};*/

// controllers/authController.js
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: user.role } };
        
        // expiresIn '24h' satisfies the "persist across restarts" requirement
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            // Return token, role, and onboarding status for frontend redirection [Section 5]
            res.json({ 
                token, 
                role: user.role,
                onboardingCompleted: user.role === 'Participant' ? user.onboardingCompleted : true
            }); 
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};
