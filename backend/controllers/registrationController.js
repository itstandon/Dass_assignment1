const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { sendRegistrationConfirmation, sendPurchaseConfirmation } = require('../utils/emailService');

/**
 * Registration Controller [Section 9: Event Registration Workflows]
 */

// @route   POST /api/events/:eventId/register
// @desc    Register participant for a Normal event [Section 9.5]
// @access  Participant only
exports.registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { formResponses, teamName } = req.body;
        const participantId = req.user.id;

        // 1. Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // 2. Check event type
        if (event.eventType !== 'Normal') {
            return res.status(400).json({ msg: 'This event is not a Normal event. Use /purchase for Merchandise.' });
        }

        // 3. Check registration deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ msg: 'Registration deadline has passed' });
        }

        // 4. Check registration limit
        const registrationCount = await Registration.countDocuments({
            event: eventId,
            status: { $in: ['confirmed', 'attended'] }
        });
        if (registrationCount >= event.registrationLimit) {
            return res.status(400).json({ msg: 'Registration limit reached' });
        }

        // 5. Check duplicate registration
        const existingReg = await Registration.findOne({
            event: eventId,
            participant: participantId
        });
        if (existingReg && existingReg.status !== 'cancelled') {
            return res.status(400).json({ msg: 'You are already registered for this event' });
        }

        // 6. Check eligibility
        const participant = await User.findById(participantId);
        if (event.eligibility === 'IIIT' && participant.participantType !== 'IIIT') {
            return res.status(403).json({ msg: 'This event is for IIIT students only' });
        }
        if (event.eligibility === 'NonIIIT' && participant.participantType === 'IIIT') {
            return res.status(403).json({ msg: 'This event is for Non-IIIT participants only' });
        }

        // 7. Generate unique ticket ID
        const ticketId = `TKT-${eventId.toString().slice(-6).toUpperCase()}-${participantId.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // 8. Create or Update registration [Section 9.5: Ticket generation]
        let registration;

        if (existingReg && existingReg.status === 'cancelled') {
            // Re-activate cancelled registration
            existingReg.status = 'confirmed';
            existingReg.formResponses = formResponses || [];
            existingReg.teamName = teamName || '';
            existingReg.registrationDate = new Date(); // Update date
            existingReg.ticketId = ticketId;
            existingReg.qrCode = JSON.stringify({
                ticketId,
                eventId,
                participantId,
                eventName: event.title,
                participantName: `${participant.firstName} ${participant.lastName}`,
                registeredAt: new Date()
            });
            registration = await existingReg.save();

            // Add to event registrations array (safely)
            await Event.findByIdAndUpdate(eventId, {
                $addToSet: { registrations: registration._id }
            });
        } else {
            // Create new registration
            registration = new Registration({
                event: eventId,
                participant: participantId,
                formResponses: formResponses || [],
                teamName: teamName || '',
                ticketId,
                status: 'confirmed',
                qrCode: JSON.stringify({
                    ticketId,
                    eventId,
                    participantId,
                    eventName: event.title,
                    participantName: `${participant.firstName} ${participant.lastName}`,
                    registeredAt: new Date()
                })
            });
            await registration.save();

            // Add to event registrations array
            await Event.findByIdAndUpdate(eventId, {
                $addToSet: { registrations: registration._id }
            });
        }

        // 9. Populate for response
        await registration.populate('event', 'title eventType location category startDate organizer');
        await registration.populate('participant', 'firstName lastName email participantType');

        // 10. Send confirmation email [Section 9.5: Email Notifications]
        await sendRegistrationConfirmation(
            registration.participant,
            registration.event,
            registration.ticketId,
            registration.qrCode
        );

        res.status(201).json({
            msg: 'Registration successful. Confirmation email sent!',
            registration,
            ticketId: registration.ticketId
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   POST /api/events/:eventId/purchase
// @desc    Purchase merchandise item [Section 9.5]
// @access  Participant only
exports.purchaseMerchandise = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { quantity, variantSize, variantColor } = req.body;
        const participantId = req.user.id;

        // 1. Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // 2. Check event type
        if (event.eventType !== 'Merchandise') {
            return res.status(400).json({ msg: 'This event is not a Merchandise event' });
        }

        // 3. Check registration deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ msg: 'Sale period has ended' });
        }

        // 4. Check if user has existing purchase (cancelled or not)
        const existingPurchase = await Registration.findOne({
            event: eventId,
            participant: participantId
        });

        // 4a. Check purchase limit per participant (only count active purchases)
        const existingActivePurchases = await Registration.findOne({
            event: eventId,
            participant: participantId,
            status: { $ne: 'cancelled' }
        });

        const totalQuantity = (existingActivePurchases?.quantity || 0) + quantity;
        if (totalQuantity > event.purchaseLimitPerParticipant) {
            return res.status(400).json({
                msg: `Purchase limit is ${event.purchaseLimitPerParticipant} per participant. You already have ${existingActivePurchases?.quantity || 0}.`
            });
        }

        // 5. Check stock availability [Section 9.5: Stock management]
        if (event.totalStock < quantity) {
            return res.status(400).json({ msg: 'Insufficient stock available' });
        }

        // 6. Validate variant exists and has stock
        if (variantSize && variantColor) {
            const variant = event.merchandiseItems[0]?.variants?.find(v =>
                v.size === variantSize && v.color === variantColor
            );
            if (!variant) {
                return res.status(400).json({ msg: 'Selected variant not available' });
            }
            if (variant.stock < quantity) {
                return res.status(400).json({ msg: 'Insufficient variant stock' });
            }
        }

        // 7. Generate ticket ID
        const ticketId = `MER-${eventId.toString().slice(-6).toUpperCase()}-${participantId.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // 8. Calculate total amount
        const totalAmount = event.price * quantity;

        // 9. Handle re-purchase after cancellation
        let registration;
        
        if (existingPurchase && existingPurchase.status === 'cancelled') {
            // Re-activate cancelled purchase
            existingPurchase.status = 'confirmed';
            existingPurchase.quantity = quantity;
            existingPurchase.variantSize = variantSize || '';
            existingPurchase.variantColor = variantColor || '';
            existingPurchase.ticketId = ticketId;
            existingPurchase.pricePaid = event.price;
            existingPurchase.totalAmount = totalAmount;
            existingPurchase.paymentStatus = 'completed';
            existingPurchase.qrCode = JSON.stringify({
                ticketId,
                type: 'Merchandise',
                eventId,
                participantId,
                quantity,
                size: variantSize,
                color: variantColor,
                purchasedAt: new Date()
            });
            registration = await existingPurchase.save();
            
            // Add back to event registrations array if removed
            await Event.findByIdAndUpdate(eventId, {
                $addToSet: { registrations: registration._id }
            });
        } else if (!existingPurchase) {
            // Create new purchase record
            registration = new Registration({
                event: eventId,
                participant: participantId,
                quantity,
                variantSize: variantSize || '',
                variantColor: variantColor || '',
                ticketId,
                pricePaid: event.price,
                totalAmount,
                status: 'confirmed',
                paymentStatus: 'completed',
                qrCode: JSON.stringify({
                    ticketId,
                    type: 'Merchandise',
                    eventId,
                    participantId,
                    quantity,
                    size: variantSize,
                    color: variantColor,
                    purchasedAt: new Date()
                })
            });

            await registration.save();

            // Add to event registrations array
            await Event.findByIdAndUpdate(eventId, {
                $addToSet: { registrations: registration._id }
            });
        } else {
            // User already has active purchase
            return res.status(400).json({ msg: 'You already have an active purchase for this merchandise event' });
        }

        // 10. Decrement stock [Section 9.5: Stock decrement]
        event.totalStock -= quantity;
        if (variantSize && variantColor) {
            const variant = event.merchandiseItems[0].variants.find(v =>
                v.size === variantSize && v.color === variantColor
            );
            if (variant) {
                variant.stock -= quantity;
            }
        }
        await event.save();

        // 11. Populate for response
        await registration.populate('event', 'title merchandiseType price startDate location organizer');
        await registration.populate('participant', 'firstName lastName email participantType');

        // 12. Send purchase confirmation email [Section 9.5: Email Notifications]
        const qrCodeObject = JSON.parse(registration.qrCode);
        await sendPurchaseConfirmation(
            registration.participant,
            registration.event,
            registration.ticketId,
            quantity,
            variantSize,
            variantColor,
            totalAmount,
            qrCodeObject
        );

        res.status(201).json({
            msg: 'Purchase successful. Confirmation email sent!',
            registration,
            ticketId: registration.ticketId,
            qrCode: qrCodeObject,
            totalAmount
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @route   GET /api/events/:eventId/registrations
// @desc    Get all registrations for an event [Section 10.3: Organizer view]
// @access  Organizer only
exports.getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.id;

        // Verify organizer owns this event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized to view registrations' });
        }

        // Get registrations with participant details
        const registrations = await Registration.find({ event: eventId })
            .populate('participant', 'firstName lastName email contactNumber college')
            .sort({ registrationDate: -1 });

        res.json(registrations);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/user/registrations
// @desc    Get all registrations for logged-in participant [Section 9.2: My Events]
// @access  Participant only
exports.getParticipantRegistrations = async (req, res) => {
    try {
        const participantId = req.user.id;

        const registrations = await Registration.find({ participant: participantId })
            .populate('event', 'title eventType startDate endDate organizer')
            .populate('event.organizer', 'organizerName')
            .sort({ registrationDate: -1 });

        res.json(registrations);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   DELETE /api/events/:eventId/register
// @desc    Cancel registration [Section 9.5]
// @access  Participant only
exports.cancelRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const participantId = req.user.id;

        const registration = await Registration.findOne({
            event: eventId,
            participant: participantId
        });

        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }

        // Don't allow cancelling already cancelled registration
        if (registration.status === 'cancelled') {
            return res.status(400).json({ msg: 'Registration is already cancelled' });
        }

        // Update status
        registration.status = 'cancelled';
        await registration.save();

        // Remove from event registrations array to update count
        await Event.findByIdAndUpdate(eventId, {
            $pull: { registrations: registration._id }
        });

        // If merchandise, refund stock
        if (registration.quantity) {
            const event = await Event.findById(eventId);
            event.totalStock += registration.quantity;
            
            // Refund variant stock if applicable
            if (registration.variantSize && registration.variantColor) {
                const variant = event.merchandiseItems[0]?.variants?.find(v =>
                    v.size === registration.variantSize && v.color === registration.variantColor
                );
                if (variant) {
                    variant.stock += registration.quantity;
                }
            }
            
            await event.save();
        }

        res.json({ msg: 'Registration cancelled successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   PUT /api/events/:eventId/registrations/:registrationId/attendance
// @desc    Mark attendance for a participant [Section 10.3]
// @access  Organizer only
exports.markAttendance = async (req, res) => {
    try {
        const { eventId, registrationId } = req.params;
        const organizerId = req.user.id;

        // Verify organizer owns this event
        const event = await Event.findById(eventId);
        if (!event || event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }

        // Mark attendance
        registration.attendanceMarked = true;
        registration.attendanceMarkedAt = new Date();
        registration.attendanceMarkedBy = organizerId;
        registration.status = 'attended';
        await registration.save();

        res.json({ msg: 'Attendance marked', registration });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};