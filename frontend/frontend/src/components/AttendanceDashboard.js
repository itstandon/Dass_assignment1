import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * AttendanceDashboard Component - Tier A Feature
 * Displays attendance summary and detailed records for organizers
 */

const AttendanceDashboard = ({ eventId }) => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        fetchAttendanceData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchAttendanceData, 30000);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `/api/attendance/dashboard/${eventId}`,
                { headers: { 'x-auth-token': token } }
            );
            setAttendanceData(response.data);
            setErrorMessage(null);
        } catch (err) {
            setErrorMessage(err.response?.data?.msg || 'Failed to load attendance data');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualOverride = async (participantId, participantName) => {
        const reason = prompt(`Mark ${participantName} as attended?\nReason (optional):`);
        if (reason === null) return; // User cancelled

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                '/api/attendance/manual-override',
                {
                    registrationId: participantId,
                    eventId: eventId,
                    notes: reason || 'Manual override'
                },
                { headers: { 'x-auth-token': token } }
            );
            // Refresh data
            fetchAttendanceData();
        } catch (err) {
            setErrorMessage('Failed to mark attendance');
            console.error('Override error:', err);
        }
    };

    const downloadCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `/api/attendance/export/${eventId}`,
                {
                    headers: { 'x-auth-token': token },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${eventId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setErrorMessage('Failed to download report');
        }
    };

    if (loading && !attendanceData) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading attendance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {errorMessage && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error:</strong> {errorMessage}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setErrorMessage(null)}
                    ></button>
                </div>
            )}

            {attendanceData && (
                <>
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Attendance Dashboard</h5>
                            <button className="btn btn-sm btn-light" onClick={fetchAttendanceData}>
                                <i className="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                        <div className="card-body">
                            {/* Summary Cards */}
                            <h6 className="mb-3">{attendanceData.eventName}</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-3">
                                    <div className="card border-primary">
                                        <div className="card-body text-center">
                                            <h6 className="card-title text-muted">Total Registered</h6>
                                            <h3 className="text-primary">{attendanceData.totalRegistrations}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card border-success">
                                        <div className="card-body text-center">
                                            <h6 className="card-title text-muted">Attended</h6>
                                            <h3 className="text-success">{attendanceData.totalScanned}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card border-warning">
                                        <div className="card-body text-center">
                                            <h6 className="card-title text-muted">Not Attended</h6>
                                            <h3 className="text-warning">{attendanceData.totalNotScanned}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card border-info">
                                        <div className="card-body text-center">
                                            <h6 className="card-title text-muted">Attendance Rate</h6>
                                            <h3 className="text-info">{attendanceData.attendanceRate}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Rate Progress Bar */}
                            <div className="mb-4">
                                <label className="form-label">Attendance Progress</label>
                                <div className="progress" style={{ height: '25px' }}>
                                    <div
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{
                                            width: attendanceData.attendanceRate,
                                            fontSize: '12px'
                                        }}
                                        aria-valuenow={attendanceData.attendanceRate}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    >
                                        {attendanceData.attendanceRate}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs for Scanned/Not Scanned */}
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('summary')}
                                    >
                                        <i className="fas fa-chart-bar"></i> Summary
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'scanned' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('scanned')}
                                    >
                                        <i className="fas fa-check-circle"></i> Attended ({attendanceData.totalScanned})
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'notScanned' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('notScanned')}
                                    >
                                        <i className="fas fa-times-circle"></i> Not Attended ({attendanceData.totalNotScanned})
                                    </button>
                                </li>
                            </ul>

                            {/* Tab Content */}
                            <div className="tab-content mt-3">
                                {/* Summary Tab */}
                                {activeTab === 'summary' && (
                                    <div className="alert alert-info">
                                        <p><strong>Event:</strong> {attendanceData.eventName}</p>
                                        <p><strong>Total Registrations:</strong> {attendanceData.totalRegistrations}</p>
                                        <p><strong>Attended:</strong> {attendanceData.totalScanned}</p>
                                        <p><strong>Attendance Rate:</strong> {attendanceData.attendanceRate}</p>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={downloadCSV}
                                        >
                                            <i className="fas fa-download"></i> Download CSV
                                        </button>
                                    </div>
                                )}

                                {/* Attended Tab */}
                                {activeTab === 'scanned' && (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-success">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Ticket ID</th>
                                                    <th>Scanned At</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceData.scanned.length > 0 ? (
                                                    attendanceData.scanned.map((item) => (
                                                        <tr key={item.registrationId}>
                                                            <td>{item.name}</td>
                                                            <td>{item.email}</td>
                                                            <td>{item.ticketId}</td>
                                                            <td>{new Date(item.scannedAt).toLocaleString()}</td>
                                                            <td>
                                                                <span className="badge bg-success">Attended</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted">
                                                            No attendees yet
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Not Attended Tab */}
                                {activeTab === 'notScanned' && (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-warning">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Ticket ID</th>
                                                    <th>Registered On</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceData.notScanned.length > 0 ? (
                                                    attendanceData.notScanned.map((item) => (
                                                        <tr key={item.registrationId}>
                                                            <td>{item.name}</td>
                                                            <td>{item.email}</td>
                                                            <td>{item.ticketId}</td>
                                                            <td>{new Date(item.registrationDate).toLocaleString()}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-warning"
                                                                    onClick={() =>
                                                                        handleManualOverride(item.registrationId, item.name)
                                                                    }
                                                                >
                                                                    <i className="fas fa-edit"></i> Manual Override
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted">
                                                            Everyone has attended!
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceDashboard;
