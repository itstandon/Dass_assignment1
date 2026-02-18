const Registration = require('../models/Registration');

exports.getMyEvents = async (req, res) => {
    try {
        // Fetch registrations and populate event and organizer details 
        const registrations = await Registration.find({ participant: req.user.id })
            .populate({
                path: 'event',
                populate: { path: 'organizer', select: 'organizerName' }
            });
        res.json(registrations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};