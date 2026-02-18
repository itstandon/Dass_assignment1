// src/components/ParticipantDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ParticipantDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const token = localStorage.getItem('token');

    const fetchRegistrations = useCallback(async () => {
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
    }, [token]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

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

        if (activeTab === 'normal') {
            filtered = filtered.filter(r => r.event?.eventType === 'Normal');
        } else if (activeTab === 'merchandise') {
            filtered = filtered.filter(r => r.event?.eventType === 'Merchandise');
        } else if (activeTab === 'completed') {
            filtered = filtered.filter(r => r.status === 'attended');
        } else if (activeTab === 'cancelled') {
            filtered = filtered.filter(r => r.status === 'cancelled');
        }

        return filtered;
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading your registrations...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>📅 My Events & Registrations [Section 9.2]</h1>

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
                                <p style={{ margin: '5px 0' }}><strong>Organizer:</strong> {reg.event?.organizer?.organizerName}</p>
                                <p style={{ margin: '5px 0' }}><strong>Ticket ID:</strong> <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '3px' }}>{reg.ticketId}</code></p>
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
                                        background: reg.status === 'confirmed' ? '#28a745' : reg.status === 'attended' ? '#2196f3' : '#dc3545',
                                        color: 'white',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {reg.status?.toUpperCase()}
                                    </span>
                                </p>
                                {reg.event?.eventType === 'Merchandise' && (
                                    <p style={{ margin: '5px 0' }}><strong>Quantity:</strong> {reg.quantity} | <strong>Total:</strong> ₹{reg.totalAmount}</p>
                                )}
                                <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                                    <strong>Registered:</strong> {new Date(reg.registrationDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{ marginLeft: '20px' }}>
                                {reg.status === 'confirmed' && (
                                    <button 
                                        onClick={() => handleCancelRegistration(reg.event._id)}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
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
        </div>
    );
};

export default ParticipantDashboard;