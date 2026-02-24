import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [eventType, setEventType] = useState('Normal');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        capacity: '',
        // Merchandise fields
        price: '',
        merchandiseType: 'T-Shirt',
        quantity: '',
        // Normal event fields
        category: 'Workshop'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEventTypeChange = (e) => {
        setEventType(e.target.value);
        setFormData({ ...formData });
    };

    const handleSubmit = async (e, status) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                eventType,
                status, // Add status to the payload
                registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : 1000, // Default limit
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                price: formData.price ? parseFloat(formData.price) : undefined,
                quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
            };

            // Clean up undefined keys
            Object.keys(payload).forEach(key => 
                (payload[key] === undefined || payload[key] === '') && delete payload[key]
            );

            await axios.post('/api/events/create', payload, {
                headers: { 'x-auth-token': token }
            });

            alert(`Event ${status === 'Draft' ? 'saved as draft' : 'published'} successfully!`);
            navigate('/organizer-dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.errors ? err.response.data.errors.map(e => e.msg).join(', ') : (err.response?.data?.msg || 'Failed to process event');
            alert(errorMsg);
            console.error(err);
        }
    };

    return (
        <div className="create-event-container">
            <h2>Create New Event</h2>
            <form onSubmit={handleSubmit}>
                {/* Common Fields */}
                <input
                    type="text"
                    name="title"
                    placeholder="Event Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
                <textarea
                    name="description"
                    placeholder="Event Description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />

                {/* Event Type Selection */}
                <select value={eventType} onChange={handleEventTypeChange} required>
                    <option value="Normal">Normal Event (Workshop, Talk, Competition)</option>
                    <option value="Merchandise">Merchandise (T-Shirt, Hoodie, Kit)</option>
                </select>

                {/* Common Date Fields */}
                <label>Start Date & Time:</label>
                <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                />

                <label>End Date & Time:</label>
                <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                />

                {/* Event Type Specific Fields */}
                {eventType === 'Normal' ? (
                    <>
                        <label>Event Category:</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="Workshop">Workshop</option>
                            <option value="Talk">Talk</option>
                            <option value="Competition">Competition</option>
                            <option value="Other">Other</option>
                        </select>

                        <input
                            type="text"
                            name="location"
                            placeholder="Location (e.g., Lab A, Auditorium)"
                            value={formData.location}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="capacity"
                            placeholder="Capacity (optional)"
                            value={formData.capacity}
                            onChange={handleChange}
                        />
                    </>
                ) : (
                    <>
                        <label>Merchandise Type:</label>
                        <select
                            name="merchandiseType"
                            value={formData.merchandiseType}
                            onChange={handleChange}
                            required
                        >
                            <option value="T-Shirt">T-Shirt</option>
                            <option value="Hoodie">Hoodie</option>
                            <option value="Kit">Kit</option>
                            <option value="Other">Other</option>
                        </select>

                        <input
                            type="number"
                            name="price"
                            placeholder="Price (in ₹)"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="number"
                            name="quantity"
                            placeholder="Available Quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                <div className="form-actions">
                    <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} className="draft-button">Save as Draft</button>
                    <button type="submit" onClick={(e) => handleSubmit(e, 'Published')}>Publish Event</button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
