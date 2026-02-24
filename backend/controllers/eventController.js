const Event = require('../models/Event');
const User = require('../models/User');
const axios = require('axios');

// @route   POST /api/events/create
// @desc    Organizer creates a new event [Section 8 - 2 Marks: Event Attributes]
// @access  Organizer only
exports.createEvent = async (req, res) => {
    try {
        const { 
            // Core Attributes [Section 8]
            title, 
            description, 
            eventType,
            eligibility,
            registrationDeadline,
            startDate, 
            endDate,
            registrationLimit,
            tags,
            status, // Event Status [Section 9.9]
            
            // For Normal Events [Section 8]
            registrationForm,
            registrationFee,
            category,
            location,
            capacity,
            
            // For Merchandise Events [Section 8]
            merchandiseItems,
            totalStock,
            purchaseLimitPerParticipant,
            price,
            merchandiseType,
            quantity
        } = req.body;

        // ========== DRAFT/PUBLISH VALIDATION [Section 9.9] ==========
        // If saving as a draft, only a title is required.
        if (status === 'Draft') {
            if (!title) {
                return res.status(400).json({ msg: 'A title is required to save a draft.' });
            }
            // For drafts, skip all other validations
        } else {
            // For publishing, all core fields are required.
            if (!title || !description || !eventType || !registrationDeadline || !startDate || !endDate || !registrationLimit) {
                return res.status(400).json({ 
                    msg: 'Missing required core fields: title, description, eventType, registrationDeadline, startDate, endDate, registrationLimit' 
                });
            }

            // Validation: Event type is either 'Normal' or 'Merchandise'
            if (!['Normal', 'Merchandise'].includes(eventType)) {
                return res.status(400).json({ msg: 'Invalid event type. Must be Normal or Merchandise' });
            }

            // Validation: Eligibility is valid
            if (!['IIIT', 'NonIIIT', 'Everyone'].includes(eligibility || 'Everyone')) {
                return res.status(400).json({ msg: 'Invalid eligibility. Must be IIIT, NonIIIT, or Everyone' });
            }

            // Date validations for published events
            if (new Date(registrationDeadline) > new Date(startDate)) {
                return res.status(400).json({ msg: 'Registration deadline must be before event start date' });
            }
            if (new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({ msg: 'Start date must be before end date' });
            }

            // ========== NORMAL EVENT VALIDATION [Section 8] ==========
            if (eventType === 'Normal') {
                if (!registrationForm || !Array.isArray(registrationForm) || registrationForm.length === 0) {
                    return res.status(400).json({ 
                        msg: 'Normal events require: registrationForm (array of fields)' 
                    });
                }

                if (registrationFee === undefined || registrationFee === null) {
                    return res.status(400).json({ 
                        msg: 'Normal events require: registrationFee' 
                    });
                }

                if (!category || !location || !capacity) {
                    return res.status(400).json({ 
                        msg: 'Normal events require: category, location, capacity' 
                    });
                }

                // Validate registration form fields
                for (let field of registrationForm) {
                    if (!field.fieldName || !field.fieldType) {
                        return res.status(400).json({ 
                            msg: 'Each registration form field must have fieldName and fieldType' 
                        });
                    }
                    if (!['text', 'email', 'number', 'date', 'select', 'checkbox', 'textarea'].includes(field.fieldType)) {
                        return res.status(400).json({ 
                            msg: 'Invalid fieldType. Allowed: text, email, number, date, select, checkbox, textarea' 
                        });
                    }
                }
            }

            // ========== MERCHANDISE EVENT VALIDATION [Section 8] ==========
            if (eventType === 'Merchandise') {
                if (!merchandiseItems || !Array.isArray(merchandiseItems) || merchandiseItems.length === 0) {
                    return res.status(400).json({ 
                        msg: 'Merchandise events require: merchandiseItems (array with size, color, variants)' 
                    });
                }

                if (!totalStock || totalStock < 1) {
                    return res.status(400).json({ 
                        msg: 'Merchandise events require: totalStock (positive number)' 
                    });
                }

                if (!purchaseLimitPerParticipant || purchaseLimitPerParticipant < 1) {
                    return res.status(400).json({ 
                        msg: 'Merchandise events require: purchaseLimitPerParticipant (positive number)' 
                    });
                }

                // Validate payment instructions (required for merchandise)
                if (!req.body.paymentInstructions || !req.body.paymentInstructions.upiId) {
                    return res.status(400).json({
                        msg: 'Merchandise events require payment instructions with UPI ID'
                    });
                }

                // Validate merchandise items structure
                for (let item of merchandiseItems) {
                    if (!item.name || !Array.isArray(item.size) || !Array.isArray(item.color) || !Array.isArray(item.variants)) {
                        return res.status(400).json({ 
                            msg: 'Each merchandise item must have: name, size (array), color (array), variants (array)' 
                        });
                    }

                    for (let variant of item.variants) {
                        if (!variant.size || !variant.color || variant.stock === undefined || !variant.price) {
                            return res.status(400).json({ 
                                msg: 'Each variant must have: size, color, stock, price' 
                            });
                        }
                    }
                }
            }
        }

        // ========== CREATE EVENT OBJECT ==========
        const eventData = {
            organizer: req.user.id,
            status: status || 'Draft', // Default to Draft if no status is provided
            title,
            description,
            eventType,
            eligibility: eligibility || 'Everyone',
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            tags: tags || []
        };

        // Add event-type-specific fields
        if (eventType === 'Normal') {
            eventData.registrationForm = registrationForm;
            eventData.registrationFee = registrationFee;
            eventData.category = category;
            eventData.location = location;
            eventData.capacity = capacity;
        }

        if (eventType === 'Merchandise') {
            eventData.merchandiseItems = merchandiseItems;
            eventData.totalStock = totalStock || quantity 
                ? parseInt(totalStock || quantity) 
                : 0;
            eventData.purchaseLimitPerParticipant = purchaseLimitPerParticipant;
            eventData.price = price;
            eventData.merchandiseType = merchandiseType;
            eventData.quantity = quantity;
            eventData.paymentInstructions = req.body.paymentInstructions;
        }

        const event = new Event(eventData);
        await event.save();

        // If published, send Discord notification
        if (event.status === 'Published') {
            const organizer = await User.findById(req.user.id);
            if (organizer.discordWebhookUrl) {
                try {
                    await axios.post(organizer.discordWebhookUrl, {
                        content: `📢 **New Event Published!**\n**Name:** ${event.title}\n**Type:** ${event.eventType}\n**Link:** ${process.env.FRONTEND_URL}/events/${event._id}`
                    });
                } catch (webhookErr) {
                    console.error("Discord notification failed for new event:", webhookErr.message);
                }
            }
        }

        // Populate organizer details before returning
        await event.populate('organizer', 'organizerName email');

        res.status(201).json({ 
            msg: `Event successfully ${event.status === 'Draft' ? 'saved as a draft' : 'published'}.`, 
            event 
        });

    } catch (err) {
        console.error(err.message);
        // Provide more specific validation error messages if available
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/events
// @desc    Get all events (with optional filters)
// @access  Public
/*exports.getAllEvents = async (req, res) => {
    try {
        const { eventType, status, organizerId } = req.query;
        
        // Build filter object
        const filter = {};
        if (eventType) filter.eventType = eventType;
        if (status) filter.status = status;
        if (organizerId) filter.organizer = organizerId;

        const events = await Event.find(filter)
            .populate('organizer', 'organizerName email')
            .sort({ startDate: 1 }); // Sort by start date ascending

        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};*/
exports.getAllEvents = async (req, res) => {
    try {
        const { search, eventType, eligibility, startDate, endDate, followedBy } = req.query;
        
        // 9.3 Initialize filter object
        let filter = {};

        // 1. Partial & Fuzzy matching on Event/Organizer names 
        // We use $or to check both the event title and the organizer's name
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'organizerName': { $regex: search, $options: 'i' } } 
            ];
        }

        // 2. Filter: Event Type (Normal/Merchandise) 
        if (eventType && eventType !== 'All') {
            filter.eventType = eventType;
        }

        // 3. Filter: Eligibility 
        if (eligibility && eligibility !== 'Everyone') {
            filter.eligibility = eligibility;
        }

        // 4. Filter: Date Range 
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) filter.startDate.$gte = new Date(startDate);
            if (endDate) filter.startDate.$lte = new Date(endDate);
        }

        // 5. Filter: Followed Clubs 
        // Requires the frontend to pass the participant's User ID
        if (followedBy) {
            const user = await User.findById(followedBy);
            if (user && user.followedClubs && user.followedClubs.length > 0) {
                filter.organizer = { $in: user.followedClubs };
            } else if (followedBy !== 'all') {
                // If the user follows no one but clicked the "Followed" filter, return empty
                return res.json([]);
            }
        }

        const events = await Event.find(filter)
            .populate('organizer', 'organizerName email')
            .sort({ startDate: 1 }); // Maintain chronological order [cite: 83]

        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getTrendingEvents = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const trending = await Event.find({
            createdAt: { $gte: twentyFourHoursAgo }
        })
        .sort({ 'registrations.length': -1 }) // Sort by most registrations
        .limit(5)
        .populate('organizer', 'organizerName');

        res.json(trending);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'organizerName email')
            .populate('registrations');

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   PUT /api/events/:id
// @desc    Update event (organizer only) [Section 9.9 - Editing Rules]
// @access  Organizer
exports.updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this event' });
        }

        const { status: newStatus, ...updates } = req.body;
        const currentStatus = event.status || 'Published'; // Default to Published if no status exists
        const now = new Date();
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = new Date(event.endDate);

        // Determine live status for rule application
        let liveStatus = 'Scheduled';
        if (now >= eventStartDate && now <= eventEndDate) liveStatus = 'Ongoing';
        else if (now > eventEndDate) liveStatus = 'Completed';

        // --- EDITING RULES BASED ON STATUS [Section 9.9] ---

        if (currentStatus === 'Draft') {
            // Drafts: Free edits, can be published
            Object.assign(event, updates);
            if (newStatus === 'Published') {
                // Validate all required fields before publishing
                const requiredFields = ['title', 'description', 'eventType', 'registrationDeadline', 'startDate', 'endDate', 'registrationLimit'];
                for (const field of requiredFields) {
                    if (!event[field]) {
                        return res.status(400).json({ msg: `Cannot publish. Missing required field: ${field}` });
                    }
                }
                event.status = 'Published';
            }
        } else if (currentStatus === 'Published') {
            // Published: Limited edits - only description, deadline extension, and limit increase
            const allowedUpdates = ['description', 'registrationDeadline', 'registrationLimit'];
            for (const key in updates) {
                if (allowedUpdates.includes(key)) {
                    // For registration form - lock it if there are registrations
                    if (key === 'registrationForm' && event.registrations && event.registrations.length > 0) {
                        return res.status(400).json({ msg: 'Registration form is locked after first registration' });
                    }
                    event[key] = updates[key];
                } else if (key !== 'registrationForm') { // Don't error for registrationForm, just block it
                    return res.status(400).json({ msg: `Cannot update '${key}' for a published event. Only description, registrationDeadline, and registrationLimit can be updated.` });
                }
            }
            // Can be closed or moved to completed
            if (newStatus && ['Closed', 'Completed'].includes(newStatus)) {
                event.status = newStatus;
            }
        } else if (liveStatus === 'Ongoing' || liveStatus === 'Completed' || currentStatus === 'Closed' || currentStatus === 'Completed') {
            // Ongoing/Completed/Closed: Only status changes allowed
            if (newStatus && ['Completed', 'Closed'].includes(newStatus)) {
                event.status = newStatus;
            } else if (Object.keys(updates).length > 0) {
                return res.status(400).json({ msg: 'No edits are allowed for ongoing, completed, or closed events except for status changes.' });
            }
        }

        await event.save();
        res.json({ msg: 'Event updated successfully', event });

    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   DELETE /api/events/:id
// @desc    Delete event (organizer only)
// @access  Organizer
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Ensure only the organizer can delete
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Event deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 10.2: Get events created by the logged-in organizer
exports.getOrganizerEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id })
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// 10.3: Detailed Analytics for a specific event
exports.getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate({
                path: 'registrations',
                populate: { path: 'participant', select: 'firstName lastName email' }
            });

        // Calculate Revenue [cite: 126, 129]
        const revenue = event.eventType === 'Normal' 
            ? event.registrations.length * event.registrationFee
            : event.registrations.length * event.price;

        // Calculate Attendance [cite: 126, 129]
        const attended = event.registrations.filter(r => r.attendanceStatus === 'Present').length;
        const attendanceRate = event.registrations.length > 0 
            ? (attended / event.registrations.length) * 100 
            : 0;

        res.json({
            analytics: {
                totalRegistrations: event.registrations.length,
                revenue,
                attendanceRate: attendanceRate.toFixed(2),
                status: event.status
            },
            participants: event.registrations // Includes Name, Email, Reg Date, etc. 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// 10.2: Get global analytics for organizer (all completed events)
exports.getOrganizerAnalytics = async (req, res) => {
    try {
        const organizerId = req.user.id;

        // Get all events for this organizer
        const allEvents = await Event.find({ organizer: organizerId })
            .populate({
                path: 'registrations',
                populate: { path: 'participant', select: 'firstName lastName email' }
            });

        // Get completed events only
        const completedEvents = allEvents.filter(e => e.status === 'Completed' || e.status === 'Cancelled');

        // Calculate aggregated statistics
        let totalRegistrations = 0;
        let totalRevenue = 0;
        let totalAttended = 0;

        completedEvents.forEach(event => {
            totalRegistrations += event.registrations.length;
            
            // Calculate revenue based on event type
            if (event.eventType === 'Normal') {
                totalRevenue += event.registrations.length * event.registrationFee;
            } else if (event.eventType === 'Merchandise') {
                totalRevenue += event.registrations.length * event.price;
            }

            // Count attendees
            const attended = event.registrations.filter(r => r.attendanceStatus === 'Present').length;
            totalAttended += attended;
        });

        // Calculate attendance rate
        const overallAttendanceRate = totalRegistrations > 0 
            ? ((totalAttended / totalRegistrations) * 100).toFixed(2)
            : 0;

        // Count events by status
        const upcomingEvents = allEvents.filter(e => e.status === 'Scheduled').length;
        const ongoingEvents = allEvents.filter(e => e.status === 'Ongoing').length;
        const completedEventsCount = completedEvents.length;

        res.json({
            totalRegistrations,
            totalRevenue,
            totalAttendees: totalAttended,
            overallAttendanceRate,
            upcomingEvents,
            ongoingEvents,
            completedEventsCount,
            allEventsCount: allEvents.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};