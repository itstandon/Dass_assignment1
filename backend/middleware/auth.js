const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is archived (Section 11.2)
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }
        
        console.log(`🔒 Auth check - User: ${user.email}, Role: ${user.role}, isArchived: ${user.isArchived}`);
        
        if (user.isArchived) {
            console.log('❌ BLOCKED - User is archived');
            return res.status(403).json({ msg: 'Account has been archived. Please contact admin.' });
        }
        
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isAdmin = async (req, res, next) => {
    const token = req.header('x-auth-token'); // JWT-based auth is mandatory [cite: 43]
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied: Admins only' });
        }
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isOrganizer = async (req, res, next) => {
    await auth(req, res, async () => {
        if (req.user.role !== 'Organizer') {
            return res.status(403).json({ msg: 'Access denied: Organizers only' });
        }
        next();
    });
};

const isParticipant = async (req, res, next) => {
    await auth(req, res, async () => {
        if (req.user.role !== 'Participant') {
            return res.status(403).json({ msg: 'Access denied: Participants only' });
        }
        next();
    });
};

module.exports = { auth, isAdmin, isOrganizer, isParticipant };
