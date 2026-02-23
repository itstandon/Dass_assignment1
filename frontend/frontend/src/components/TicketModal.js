import React from 'react';

const TicketModal = ({ registration, onClose }) => {
    if (!registration) return null;

    const { event, ticketId, status, registrationDate, qrCode, teamName, participant } = registration;
    
    const participantName = participant?.firstName && participant?.lastName 
        ? `${participant.firstName} ${participant.lastName}`
        : 'N/A';
    const participantEmail = participant?.email || 'N/A';

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '30px',
                    borderBottom: '3px solid #667eea',
                    paddingBottom: '20px'
                }}>
                    <h1 style={{ 
                        margin: '0 0 10px 0',
                        color: '#667eea',
                        fontSize: '28px'
                    }}>
                        🎉 Registration Confirmed!
                    </h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Congratulations! Your registration for the following event has been confirmed:
                    </p>
                </div>

                {/* Event Details */}
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ 
                        margin: '0 0 15px 0',
                        fontSize: '22px',
                        color: '#333'
                    }}>
                        {event?.title || event?.name}
                    </h2>
                    
                    <div style={{ 
                        background: '#f5f5f5',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                    }}>
                        <p style={{ margin: '8px 0' }}>
                            <span style={{ fontSize: '16px', marginRight: '8px' }}>📅</span>
                            <strong>Date:</strong> {event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                        </p>
                        <p style={{ margin: '8px 0' }}>
                            <span style={{ fontSize: '16px', marginRight: '8px' }}>🕐</span>
                            <strong>Time:</strong> {event?.time || '8:00:00 AM'}
                        </p>
                        <p style={{ margin: '8px 0' }}>
                            <span style={{ fontSize: '16px', marginRight: '8px' }}>📍</span>
                            <strong>Location:</strong> {event?.venue || 'H-105'}
                        </p>
                        <p style={{ margin: '8px 0' }}>
                            <span style={{ fontSize: '16px', marginRight: '8px' }}>🎯</span>
                            <strong>Category:</strong> {event?.category || 'Workshop'}
                        </p>
                    </div>
                </div>

                {/* Ticket ID */}
                <div style={{ 
                    background: '#e3f2fd',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '2px dashed #2196f3'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                        YOUR TICKET ID
                    </h3>
                    <div style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '5px',
                        fontSize: '20px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: '#333',
                        letterSpacing: '2px'
                    }}>
                        {ticketId}
                    </div>
                    <p style={{ 
                        margin: '10px 0 0 0',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        💡 Keep this safe - you'll need it for check-in
                    </p>
                </div>

                {/* QR Code */}
                {qrCode && (
                    <div style={{ 
                        textAlign: 'center',
                        marginBottom: '20px',
                        padding: '20px',
                        background: '#f9f9f9',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0' }}>QR Code for Check-in</h3>
                        <div style={{ 
                            display: 'inline-block',
                            padding: '15px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '2px solid #ddd'
                        }}>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof qrCode === 'string' ? qrCode : JSON.stringify(qrCode))}`}
                                alt="QR Code"
                                style={{ display: 'block' }}
                            />
                        </div>
                    </div>
                )}

                {/* Registration Details */}
                <div style={{ 
                    background: '#fff3cd',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>✅ Registration Status: 
                        <span style={{ 
                            color: status === 'confirmed' ? '#28a745' : '#ff9800',
                            marginLeft: '8px'
                        }}>
                            {status?.toUpperCase()}
                        </span>
                    </h4>
                    <p style={{ margin: '5px 0' }}>
                        <strong>📧 Registered Email:</strong> {participantEmail || 'N/A'}
                    </p>
                    {teamName && (
                        <p style={{ margin: '5px 0' }}>
                            <strong>👥 Team Name:</strong> {teamName}
                        </p>
                    )}
                    <p style={{ margin: '5px 0' }}>
                        <strong>🗓️ Registration Date:</strong> {new Date(registrationDate).toLocaleString()}
                    </p>
                </div>

                {/* What's Next */}
                <div style={{ 
                    background: '#f0f0f0',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>📋 What's Next?</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Save your ticket ID for check-in</li>
                        <li>Make note of the event date and time</li>
                        <li>Arrive 15 minutes early for check-in</li>
                        <li>Bring a valid ID if required</li>
                    </ul>
                </div>

                {/* Contact Info */}
                <p style={{ 
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    If you have any questions about this event, please contact the organizer: <strong>Event Team</strong>
                </p>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center',
                    paddingTop: '15px',
                    borderTop: '1px solid #ddd'
                }}>
                    <p style={{ 
                        margin: '0 0 15px 0',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        Best regards,<br/>
                        <strong>Felicity Event Management System</strong>
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 30px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketModal;
