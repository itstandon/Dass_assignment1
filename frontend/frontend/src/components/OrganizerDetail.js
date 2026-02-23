import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const OrganizerDetail = () => {
    const { id } = useParams();
    const [organizer, setOrganizer] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch organizer details
                const orgRes = await axios.get(`/api/user/organizers/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                console.log('Organizer:', orgRes.data);
                setOrganizer(orgRes.data);

                // Fetch organizer's events
                const eventsRes = await axios.get(`/api/events/organizer/${id}/events`, {
                    headers: { 'x-auth-token': token }
                });
                console.log('Events:', eventsRes.data);
                
                const now = new Date();
                const upcoming = eventsRes.data.filter(event => new Date(event.date) >= now);
                const past = eventsRes.data.filter(event => new Date(event.date) < now);
                setUpcomingEvents(upcoming);
                setPastEvents(past);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching organizer details:', err);
                setError(err.response?.data?.msg || 'Failed to load organizer details');
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token]);

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    if (!organizer) return <div style={{ padding: '20px' }}>Organizer not found</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Organizer Info Section */}
            <div style={{ 
                border: '1px solid #ddd', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '30px',
                backgroundColor: '#f9f9f9'
            }}>
                <h2 style={{ marginBottom: '15px' }}>{organizer.organizerName}</h2>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Category:</strong> {organizer.category}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Description:</strong> {organizer.description}
                </div>
                <div>
                    <strong>Contact Email:</strong> {organizer.contactEmail}
                </div>
            </div>

            {/* Events Section with Tabs */}
            <div>
                <h3 style={{ marginBottom: '15px' }}>Events</h3>
                
                {/* Tab Buttons */}
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginBottom: '20px',
                    borderBottom: '2px solid #ddd'
                }}>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderBottom: activeTab === 'upcoming' ? '3px solid #007bff' : 'none',
                            backgroundColor: activeTab === 'upcoming' ? '#f0f8ff' : 'transparent',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal'
                        }}
                    >
                        Upcoming ({upcomingEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderBottom: activeTab === 'past' ? '3px solid #007bff' : 'none',
                            backgroundColor: activeTab === 'past' ? '#f0f8ff' : 'transparent',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'past' ? 'bold' : 'normal'
                        }}
                    >
                        Past ({pastEvents.length})
                    </button>
                </div>

                {/* Events List */}
                <div>
                    {activeTab === 'upcoming' && (
                        <div>
                            {upcomingEvents.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No upcoming events</p>
                            ) : (
                                upcomingEvents.map(event => (
                                    <div key={event._id} style={{
                                        border: '1px solid #ddd',
                                        padding: '15px',
                                        marginBottom: '10px',
                                        borderRadius: '5px'
                                    }}>
                                        <h4>{event.name}</h4>
                                        <p><strong>Type:</strong> {event.eventType}</p>
                                        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                        <p><strong>Time:</strong> {event.time}</p>
                                        <p><strong>Venue:</strong> {event.venue}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'past' && (
                        <div>
                            {pastEvents.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No past events</p>
                            ) : (
                                pastEvents.map(event => (
                                    <div key={event._id} style={{
                                        border: '1px solid #ddd',
                                        padding: '15px',
                                        marginBottom: '10px',
                                        borderRadius: '5px',
                                        opacity: 0.7
                                    }}>
                                        <h4>{event.name}</h4>
                                        <p><strong>Type:</strong> {event.eventType}</p>
                                        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                        <p><strong>Time:</strong> {event.time}</p>
                                        <p><strong>Venue:</strong> {event.venue}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerDetail;
