const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * Controller for QR Scanner & Attendance Tracking [Tier A Feature]
 */

// @route   POST /api/attendance/scan
// @desc    Mark a participant as attended by scanning their QR code
// @access  Private (Organizer only)
exports.scanQRCode = async (req, res) => {
    try {
        const { registrationId, eventId, deviceInfo } = req.body;
        const organizerId = req.user.id;

        // Verify event exists and organizer is the owner
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized to scan for this event' });
        }

        // Handle JSON string from QR code
        let searchId = String(registrationId).trim();
        if (searchId.startsWith('{')) {
            try {
                const parsed = JSON.parse(searchId);
                // Extract possible IDs in order of preference
                if (parsed.ticketId) searchId = String(parsed.ticketId);
                else if (parsed.registrationId) searchId = String(parsed.registrationId);
                else if (parsed._id) searchId = String(parsed._id);
            } catch (e) {
                // Ignore JSON parse errors, treat as raw string
            }
        }

        // Verify registration exists
        let registration;
        
        // 1. Try finding by MongoDB _id if valid format
        if (mongoose.Types.ObjectId.isValid(searchId)) {
            registration = await Registration.findById(searchId).populate('participant');
        }
        
        // 2. If not found, try searching by ticketId string
        if (!registration) {
             registration = await Registration.findOne({ ticketId: searchId }).populate('participant');
        }

        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }

        // Check if already scanned (duplicate scan rejection)
        const existingAttendance = await Attendance.findOne({
            event: eventId,
            registration: registration._id,
            status: 'scanned'
        });

        if (existingAttendance) {
            return res.status(400).json({
                msg: 'Duplicate scan rejected',
                participant: registration.participant.firstName + ' ' + registration.participant.lastName,
                previousScan: existingAttendance.scannedAt
            });
        }

        // Create new attendance record
        // Explicitly ensuring registration._id is used
        const attendance = new Attendance({
            event: eventId,
            registration: registration._id,
            participant: registration.participant._id,
            deviceInfo: deviceInfo,
            status: 'scanned'
        });

        await attendance.save();

        // Update registration status to attended
        registration.status = 'attended';
        await registration.save();

        res.json({
            msg: 'Attendance marked successfully',
            attendance: {
                participantName: registration.participant.firstName + ' ' + registration.participant.lastName,
                email: registration.participant.email,
                scannedAt: attendance.scannedAt,
                ticketId: registration.ticketId
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/attendance/dashboard/:eventId
// @desc    Get attendance dashboard for an event (scanned vs not-scanned)
// @access  Private (Organizer only)
exports.getAttendanceDashboard = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.id;

        // Verify event exists and organizer is the owner
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Get all registrations for this event
        const registrations = await Registration.find({ event: eventId }).populate('participant');

        // Get all attendance records
        const attendanceRecords = await Attendance.find({ event: eventId });
        const scannedIds = new Set(attendanceRecords.map(a => a.registration.toString()));

        // Separate scanned and not-scanned
        const scanned = [];
        const notScanned = [];

        for (const reg of registrations) {
            const participant = {
                registrationId: reg._id,
                name: `${reg.participant.firstName} ${reg.participant.lastName}`,
                email: reg.participant.email,
                ticketId: reg.ticketId,
                registrationDate: reg.registrationDate
            };

            if (scannedIds.has(reg._id.toString())) {
                const attendanceRecord = attendanceRecords.find(a => a.registration.toString() === reg._id.toString());
                scanned.push({
                    ...participant,
                    scannedAt: attendanceRecord.scannedAt
                });
            } else {
                notScanned.push(participant);
            }
        }

        res.json({
            eventName: event.title,
            totalRegistrations: registrations.length,
            totalScanned: scanned.length,
            totalNotScanned: notScanned.length,
            attendanceRate: ((scanned.length / registrations.length) * 100).toFixed(2) + '%',
            scanned,
            notScanned
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/attendance/export/:eventId
// @desc    Export attendance report as CSV
// @access  Private (Organizer only)
exports.exportAttendanceCSV = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.id;

        // Verify event exists and organizer is the owner
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Get all registrations and attendance
        const registrations = await Registration.find({ event: eventId }).populate('participant');
        const attendanceRecords = await Attendance.find({ event: eventId });
        const scannedMap = new Map(attendanceRecords.map(a => [a.registration.toString(), a]));

        // Generate CSV
        let csv = 'Ticket ID,Participant Name,Email,Registration Date,Scanned,Scanned At\n';

        for (const reg of registrations) {
            const attendance = scannedMap.get(reg._id.toString());
            const scannedStatus = attendance ? 'Yes' : 'No';
            const scannedTime = attendance ? attendance.scannedAt.toISOString() : '';

            csv += `"${reg.ticketId}","${reg.participant.firstName} ${reg.participant.lastName}","${reg.participant.email}","${reg.registrationDate.toISOString()}","${scannedStatus}","${scannedTime}"\n`;
        }

        // Send as CSV file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_${eventId}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/attendance/manual-override
// @desc    Manually mark attendance for exceptional cases
// @access  Private (Organizer only)
exports.manualOverride = async (req, res) => {
    try {
        const { registrationId, eventId, notes } = req.body;
        const organizerId = req.user.id;

        // Verify event exists and organizer is the owner
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        if (event.organizer.toString() !== organizerId) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Verify registration exists (flexible lookup)
        let registration;
        
        // 1. Try finding by _id (if valid ObjectId)
        if (mongoose.Types.ObjectId.isValid(registrationId)) {
            registration = await Registration.findById(registrationId).populate('participant');
        } 
        
        // 2. If not found, try finding by ticketId (string)
        if (!registration) {
            registration = await Registration.findOne({ ticketId: registrationId }).populate('participant');
        }

        // 3. If still not found, try parsing as JSON (in case frontend sent raw JSON without parsing)
        if (!registration && typeof registrationId === 'string' && registrationId.trim().startsWith('{')) {
             try {
                 const parsed = JSON.parse(registrationId);
                 if (parsed.ticketId) {
                     registration = await Registration.findOne({ ticketId: parsed.ticketId }).populate('participant');
                 } else if (parsed._id && mongoose.Types.ObjectId.isValid(parsed._id)) {
                     registration = await Registration.findById(parsed._id).populate('participant');
                 }
             } catch (e) {
                 // Ignore parsing errors
             }
        }

        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }

        // Check if already marked
        let attendance = await Attendance.findOne({
            event: eventId,
            registration: registrationId
        });

        if (!attendance) {
            attendance = new Attendance({
                event: eventId,
                registration: registrationId,
                participant: registration.participant._id,
                status: 'manual_override',
                markedBy: organizerId,
                notes: notes
            });
            await attendance.save();
        } else {
            attendance.status = 'manual_override';
            attendance.markedBy = organizerId;
            attendance.notes = notes;
            await attendance.save();
        }

        // Update registration status
        registration.status = 'attended';
        await registration.save();

        res.json({
            msg: 'Attendance marked manually',
            participant: `${registration.participant.firstName} ${registration.participant.lastName}`,
            status: 'attended'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
