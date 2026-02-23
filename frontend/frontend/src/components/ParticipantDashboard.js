// src/components/ParticipantDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getGoogleCalendarLink, getOutlookCalendarLink, downloadICS } from '../utils/calendar';
import PaymentProofUpload from './PaymentProofUpload';
import PaymentInstructions from './PaymentInstructions';
import TicketModal from './TicketModal';

const ParticipantDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [uploadingForOrder, setUploadingForOrder] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await axios.get('/api/registrations/user', {
                headers: { 'x-auth-token': token }
            });
            setRegistrations(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch registrations', err);
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (eventId) => {
        if (!window.confirm('Cancel this registration?')) return;

        try {
            await axios.delete(
                `/api/registrations/events/${eventId}/register`,
                {
                    headers: { 'x-auth-token': token }
                }
            );
            alert('Registration cancelled');
            fetchRegistrations();
        } catch (err) {
            alert(err.response?.data?.msg || 'Cancellation failed');
        }
    };

    const filterRegistrations = () => {
        let filtered = registrations;

        if (activeTab === 'upcoming') {
            // Show only upcoming events
            const now = new Date();
            filtered = filtered.filter(r => r.event && new Date(r.event.date) >= now);
        } else if (activeTab === 'normal') {
            filtered = filtered.filter(r => r.event?.eventType === 'Normal');
        } else if (activeTab === 'merchandise') {
            filtered = filtered.filter(r => r.event?.eventType === 'Merchandise');
        } else if (activeTab === 'completed') {
            filtered = filtered.filter(r => r.status === 'attended');
        } else if (activeTab === 'cancelled') {
            filtered = filtered.filter(r => r.status === 'cancelled');
        }

        // Sort: upcoming events first (by date ascending), then past events (by date descending)
        filtered.sort((a, b) => {
            if (!a.event || !b.event) return 0;
            const dateA = new Date(a.event.date);
            const dateB = new Date(b.event.date);
            const now = new Date();
            
            const aIsUpcoming = dateA >= now;
            const bIsUpcoming = dateB >= now;
            
            // Both upcoming or both past
            if (aIsUpcoming === bIsUpcoming) {
                return aIsUpcoming ? dateA - dateB : dateB - dateA; // Ascending for upcoming, descending for past
            }
            
            // Upcoming events come first
            return aIsUpcoming ? -1 : 1;
        });

        return filtered;
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading your registrations...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>📅 My Events & Registrations [Section 9.2]</h1>

            {/* Batch Export Button */}
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => {
                        const events = filterRegistrations()
                            .map(r => r.event)
                            .filter(e => e && e.startDate); // Use correct field name: startDate
                        
                        if (events.length > 0) {
                            downloadICS(events, 'my-events.ics');
                        } else {
                            alert('No scheduled events found to export.');
                        }
                    }}
                    style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    📅 Export Calendar (.ics)
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'all' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'all' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    All
                </button>
                <button 
                    onClick={() => setActiveTab('upcoming')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'upcoming' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'upcoming' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    🔜 Upcoming
                </button>
                <button 
                    onClick={() => setActiveTab('normal')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'normal' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'normal' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Normal Events
                </button>
                <button 
                    onClick={() => setActiveTab('merchandise')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'merchandise' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'merchandise' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Merchandise
                </button>
                <button 
                    onClick={() => setActiveTab('completed')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'completed' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'completed' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Completed
                </button>
                <button 
                    onClick={() => setActiveTab('cancelled')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'cancelled' ? '#667eea' : '#f0f0f0',
                        color: activeTab === 'cancelled' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Cancelled
                </button>
            </div>

            {/* Registrations List */}
            {filterRegistrations().length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
                    📭 No registrations found in this category
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {filterRegistrations().map(reg => (
                        <div 
                            key={reg._id}
                            style={{
                                padding: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                background: '#f9f9f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>{reg.event?.title}</h3>
                                <p style={{ margin: '5px 0' }}><strong>Type:</strong> {reg.event?.eventType}</p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Organizer:</strong> {reg.event?.organizer?.organizerName || 'N/A'}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Ticket ID:</strong> 
                                    <code 
                                        onClick={() => setSelectedTicket(reg)}
                                        style={{ 
                                            background: '#007bff', 
                                            color: 'white',
                                            padding: '4px 10px', 
                                            borderRadius: '4px',
                                            marginLeft: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'inline-block'
                                        }}
                                        title="Click to view ticket details"
                                    >
                                        🎫 {reg.ticketId}
                                    </code>
                                </p>
                                {reg.teamName && (
                                    <p style={{ margin: '5px 0' }}>
                                        <strong>Team Name:</strong> {reg.teamName}
                                    </p>
                                )}
                                {reg.qrCode && (
                                    <details style={{ margin: '8px 0', padding: '8px', background: '#fffbea', border: '1px solid #ffd700', borderRadius: '4px' }}>
                                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800' }}>📱 View QR Code (Black & White Squares)</summary>
                                        <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '4px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>Scan this code with your phone camera for verification</p>
                                            
                                            {/* Visual QR Code Image */}
                                            <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof reg.qrCode === 'string' ? reg.qrCode : JSON.stringify(reg.qrCode))}`}
                                                    alt="QR Code"
                                                    style={{ border: '2px solid #333', padding: '10px', background: 'white', borderRadius: '4px' }}
                                                />
                                            </div>
                                            
                                            <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '8px', borderRadius: '3px', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto', textAlign: 'left' }}>
                                                {typeof reg.qrCode === 'string' ? reg.qrCode : JSON.stringify(reg.qrCode, null, 2)}
                                            </p>
                                        </div>
                                    </details>
                                )}
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Status:</strong> 
                                    <span style={{
                                        marginLeft: '10px',
                                        padding: '4px 12px',
                                        background: reg.status === 'confirmed' ? '#28a745' : reg.status === 'attended' ? '#2196f3' : reg.status === 'pending' ? '#ff9800' : '#dc3545',
                                        color: 'white',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {reg.status?.toUpperCase()}
                                    </span>
                                </p>
                                {reg.event?.eventType === 'Merchandise' && (
                                    <>
                                        <p style={{ margin: '5px 0' }}><strong>Quantity:</strong> {reg.quantity} | <strong>Total:</strong> ₹{reg.totalAmount}</p>
                                        {reg.paymentStatus && (
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Payment:</strong> 
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '3px 10px',
                                                    background: reg.paymentStatus === 'approved' ? '#28a745' : reg.paymentStatus === 'pending' ? '#ff9800' : '#dc3545',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {reg.paymentStatus.toUpperCase()}
                                                </span>
                                            </p>
                                        )}
                                    </>
                                )}
                                <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                                    <strong>Registered:</strong> {new Date(reg.registrationDate).toLocaleDateString()}
                                </p>

                                {/* Payment Proof Upload Section for Merchandise */}
                                {reg.event?.eventType === 'Merchandise' && reg.status === 'pending' && reg.paymentStatus === 'pending' && !reg.paymentProof && (
                                    <div style={{ marginTop: '15px', width: '100%' }}>
                                        {uploadingForOrder === reg._id ? (
                                            <div>
                                                <PaymentInstructions event={reg.event} />
                                                <PaymentProofUpload 
                                                    registrationId={reg._id}
                                                    onUploadComplete={() => {
                                                        setUploadingForOrder(null);
                                                        fetchRegistrations();
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setUploadingForOrder(reg._id)}
                                                style={{
                                                    padding: '10px 16px',
                                                    background: '#ff9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    width: '100%'
                                                }}
                                            >
                                                📤 Upload Payment Proof
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Show payment proof status if uploaded */}
                                {reg.paymentProof && (
                                    <div style={{ marginTop: '10px', padding: '8px', background: '#e7f3ff', borderRadius: '4px', fontSize: '12px' }}>
                                        <strong>✅ Payment proof submitted</strong>
                                        <p style={{ margin: '3px 0 0 0', color: '#666' }}>
                                            {reg.paymentStatus === 'pending' ? 'Awaiting approval' : reg.paymentStatus === 'approved' ? 'Approved!' : 'Rejected'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                {/* Calendar Actions */}
                                {reg.event?.startDate && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                        <a href={getGoogleCalendarLink(reg.event)} target="_blank" rel="noopener noreferrer" 
                                           style={{ fontSize: '12px', color: '#4285F4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>📅</span> Google Cal
                                        </a>
                                        <a href={getOutlookCalendarLink(reg.event)} target="_blank" rel="noopener noreferrer" 
                                           style={{ fontSize: '12px', color: '#0078D4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>📅</span> Outlook
                                        </a>
                                        <button 
                                            onClick={() => downloadICS(reg.event, `${reg.event.title}.ics`)}
                                            style={{ background: 'none', border: 'none', color: '#555', fontSize: '12px', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            ⬇️ Download .ics
                                        </button>
                                    </div>
                                )}

                                {reg.status === 'confirmed' && (
                                    <button 
                                        onClick={() => handleCancelRegistration(reg.event._id)}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ticket Modal */}
            {selectedTicket && (
                <TicketModal 
                    registration={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

export default ParticipantDashboard;