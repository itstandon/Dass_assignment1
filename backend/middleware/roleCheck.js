const jwt = require('jsonwebtoken');

/**
 * Role-based access control middleware
 * These middleware functions check if the authenticated user has the required role
 */

const isParticipant = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Authentication required' });
    }
    
    if (req.user.role !== 'Participant') {
        return res.status(403).json({ msg: 'Access denied: Participants only' });
    }
    
    next();
};

const isOrganizer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Authentication required' });
    }
    
    if (req.user.role !== 'Organizer') {
        return res.status(403).json({ msg: 'Access denied: Organizers only' });
    }
    
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Authentication required' });
    }
    
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Access denied: Admins only' });
    }
    
    next();
};

module.exports = {
    isParticipant,
    isOrganizer,
    isAdmin
};
