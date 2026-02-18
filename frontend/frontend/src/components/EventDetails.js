// src/compone    const token = localStorage.getItem('token');

    const fetchEventDetails = useCallback(async () => {
        try {
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (err) {
            console.error('Failed to fetch event details:', err);
        }
    }, [id]);

    useEffect(() => {
        fetchEventDetails();
    }, [fetchEventDetails]);ils.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [formResponses, setFormResponses] = useState({});
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const res = await axios.get(`/api/events/${id}`);
                setEvent(res.data);
            } catch (err) {
                console.error('Failed to fetch event details:', err);
            }
        };
        fetchEventDetails();
    }, [id]);

    const handleRegisterEvent = async () => {
        if (!token) {
            alert('Please login first');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `/api/registrations/events/${id}/register`,
                {
                    formResponses: Object.entries(formResponses).map(([key, value]) => ({
                        fieldName: key,
                        response: value
                    })),
                    teamName: '' // Simplified for individual
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );

            alert(`✅ Registered Successfully!\nTicket ID: ${response.data.ticketId}`);
            navigate('/participant-dashboard');
        } catch (err) {
            alert('❌ ' + (err.response?.data?.msg || 'Registration failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchaseMerchandise = async () => {
        if (!token) {
            alert('Please login first');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `/api/registrations/events/${id}/purchase`,
                {
                    quantity: parseInt(quantity),
                    variantSize: selectedSize,
                    variantColor: selectedColor
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );

            // Get QR code data
            const qrData = response.data.registration.qrCode;
            const qrObject = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
            const qrImage = response.data.qrCodeImage;
            
            // Show success alert
            alert(`✅ PURCHASE SUCCESSFUL!\n\n📋 TICKET ID: ${response.data.ticketId}\n💰 TOTAL: ₹${response.data.totalAmount}\n\n✉️ Check your email for QR code image!`);
            
            // Navigate to dashboard to show QR code viewer
            navigate('/participant-dashboard');
        } catch (err) {
            alert('❌ ' + (err.response?.data?.msg || 'Purchase failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchEventDetails();
        alert('Event details refreshed!');
    };

    if (!event) return <p>Loading...</p>;

    // Requirement 9.4: Blocking logic
    const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
    const isSoldOut = event.eventType === 'Normal'
        ? event.registrations?.length >= event.registrationLimit
        : event.totalStock <= 0;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>{event.title} ({event.eventType})</h1>
                <button 
                    onClick={handleRefresh}
                    style={{
                        padding: '8px 15px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>
            <p>{event.description}</p>
            <p><strong>Organizer:</strong> {event.organizer?.organizerName}</p>
            <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleString()}</p>
            <p><strong>Eligibility:</strong> {event.eligibility}</p>
            <p style={{ fontSize: '16px', color: '#667eea', fontWeight: 'bold' }}>👥 <strong>{event?.registrations?.length || 0}</strong> people registered</p>

            {event.eventType === 'Normal' && (
                <>
                    <p><strong>Category:</strong> {event.category}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    <p><strong>Fee:</strong> ₹{event.registrationFee}</p>

                    {/* Dynamic Form Rendering */}
                    {event.registrationForm && event.registrationForm.length > 0 && (
                        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                            <h4>Registration Details</h4>
                            {event.registrationForm.map((field) => (
                                <div key={field._id} style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        {field.fieldName} {field.isRequired && <span style={{ color: 'red' }}>*</span>}
                                    </label>

                                    {field.fieldType === 'textarea' ? (
                                        <textarea
                                            style={{ width: '100%', padding: '8px' }}
                                            onChange={(e) => setFormResponses({ ...formResponses, [field.fieldName]: e.target.value })}
                                            required={field.isRequired}
                                        />
                                    ) : field.fieldType === 'select' ? (
                                        <select
                                            style={{ width: '100%', padding: '8px' }}
                                            onChange={(e) => setFormResponses({ ...formResponses, [field.fieldName]: e.target.value })}
                                            required={field.isRequired}
                                        >
                                            <option value="">Select...</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.fieldType}
                                            style={{ width: '100%', padding: '8px' }}
                                            onChange={(e) => setFormResponses({ ...formResponses, [field.fieldName]: e.target.value })}
                                            required={field.isRequired}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {event.eventType === 'Merchandise' && (
                <>
                    <p><strong>Type:</strong> {event.merchandiseType}</p>
                    <p><strong>Price:</strong> ₹{event.price}</p>
                    <p><strong>Stock Available:</strong> {event.totalStock}</p>

                    {/* Merchandise Selectors */}
                    {event.merchandiseItems && event.merchandiseItems.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            {event.merchandiseItems[0].size && event.merchandiseItems[0].size.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Size: </label>
                                    <select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        style={{ marginLeft: '10px', padding: '5px' }}
                                    >
                                        <option value="">Select Size</option>
                                        {event.merchandiseItems[0].size.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {event.merchandiseItems[0].color && event.merchandiseItems[0].color.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Color: </label>
                                    <select
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        style={{ marginLeft: '10px', padding: '5px' }}
                                    >
                                        <option value="">Select Color</option>
                                        {event.merchandiseItems[0].color.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {!isSoldOut && (
                        <div style={{ margin: '15px 0' }}>
                            <label>Quantity: </label>
                            <input
                                type="number"
                                min="1"
                                max={event.purchaseLimitPerParticipant}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                style={{ padding: '5px', marginLeft: '10px' }}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Blocking Requirements  */}
            <div style={{ marginTop: '20px' }}>
                {isDeadlinePassed ? (
                    <button disabled style={{ padding: '12px 24px', background: 'grey', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>
                        ❌ Registration Closed (Deadline Passed)
                    </button>
                ) : isSoldOut ? (
                    <button disabled style={{ padding: '12px 24px', background: 'grey', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>
                        ❌ Sold Out / Limit Reached
                    </button>
                ) : event.eventType === 'Normal' ? (
                    <button
                        onClick={handleRegisterEvent}
                        disabled={isLoading}
                        style={{
                            padding: '12px 24px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        {isLoading ? '⏳ Registering...' : '✨ Register for Event'}
                    </button>
                ) : (
                    <button
                        onClick={handlePurchaseMerchandise}
                        disabled={isLoading}
                        style={{
                            padding: '12px 24px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        {isLoading ? '⏳ Processing...' : '🛒 Purchase Merchandise'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventDetails;