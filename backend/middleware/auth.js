const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isAdmin = (req, res, next) => {
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

const isOrganizer = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'Organizer') {
            return res.status(403).json({ msg: 'Access denied: Organizers only' });
        }
        next();
    });
};

const isParticipant = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'Participant') {
            return res.status(403).json({ msg: 'Access denied: Participants only' });
        }
        next();
    });
};

module.exports = { auth, isAdmin, isOrganizer, isParticipant };
