const express = require('express');
const router = express.Router();
const { isOrganizer } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// @route   POST /api/attendance/scan
// @desc    Scan QR code and mark attendance
// @access  Private (Organizer)
router.post('/scan', isOrganizer, attendanceController.scanQRCode);

// @route   GET /api/attendance/dashboard/:eventId
// @desc    Get attendance dashboard
// @access  Private (Organizer)
router.get('/dashboard/:eventId', isOrganizer, attendanceController.getAttendanceDashboard);

// @route   GET /api/attendance/export/:eventId
// @desc    Export attendance as CSV
// @access  Private (Organizer)
router.get('/export/:eventId', isOrganizer, attendanceController.exportAttendanceCSV);

// @route   POST /api/attendance/manual-override
// @desc    Manually mark attendance
// @access  Private (Organizer)
router.post('/manual-override', isOrganizer, attendanceController.manualOverride);

module.exports = router;
