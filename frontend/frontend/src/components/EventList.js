import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [followedClubs, setFollowedClubs] = useState([]);
    const [trendingEvents, setTrendingEvents] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchEvents();
        fetchFollowedClubs();
        fetchTrending();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrending = async () => {
        try {
            const res = await axios.get('/api/events/trending');
            setTrendingEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch trending:', err);
        }
    };

    const fetchFollowedClubs = async () => {
        try {
            const res = await axios.get('/api/user/preferences', {
                headers: { 'x-auth-token': token }
            });
            setFollowedClubs(res.data.followedClubs || []);
        } catch (err) {
            console.error('Failed to fetch followed clubs', err);
        }
    };

    const fuzzyMatch = (text, query) => {
        const q = query.toLowerCase();
        const t = text.toLowerCase();
        if (t.includes(q)) return true;

        let qIdx = 0;
        for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
            if (t[tIdx] === q[qIdx]) qIdx++;
        }
        return qIdx === q.length;
    };

    const applyFiltersAndSearch = useCallback(() => {
        let result = events;

        // Search filter
        if (searchQuery) {
            result = result.filter(e =>
                fuzzyMatch(e.title, searchQuery) ||
                fuzzyMatch(e.organizer?.organizerName || '', searchQuery)
            );
        }

        // Event type filter
        if (filter !== 'All') {
            result = result.filter(e => e.eventType === filter);
        }

        // Date range filter
        if (dateRange.start || dateRange.end) {
            result = result.filter(e => {
                const eventDate = new Date(e.startDate);
                if (dateRange.start && eventDate < new Date(dateRange.start)) return false;
                if (dateRange.end && eventDate > new Date(dateRange.end)) return false;
                return true;
            });
        }

        // Sort: Trending (most registrations) first
        result = result.sort((a, b) => (b.registrations?.length || 0) - (a.registrations?.length || 0));

        setFilteredEvents(result);
    }, [events, filter, searchQuery, dateRange]);

    useEffect(() => {
        applyFiltersAndSearch();
    }, [applyFiltersAndSearch]);

    if (loading) return <div style={{ padding: '20px' }}>Loading events...</div>;

    if (loading) return <div style={{ padding: '20px' }}>Loading events...</div>;

    // const trendingEvents = getTrendingEvents(); // Now using backend data

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>🎉 Browse Events [Section 9.1 & 9.3]</h1>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search events or organizers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '16px'
                    }}
                />
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                padding: '15px',
                background: '#f9f9f9',
                borderRadius: '8px'
            }}>
                <div>
                    <label style={{ marginRight: '10px' }}>Event Type:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option>All</option>
                        <option>Normal</option>
                        <option>Merchandise</option>
                    </select>
                </div>

                <div>
                    <label style={{ marginRight: '10px' }}>From:</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                <div>
                    <label style={{ marginRight: '10px' }}>To:</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                <button
                    onClick={() => {
                        setFilter('All');
                        setSearchQuery('');
                        setDateRange({ start: '', end: '' });
                    }}
                    style={{
                        padding: '8px 20px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Clear Filters
                </button>
            </div>

            {/* Trending Events Section */}
            {searchQuery === '' && Object.keys(dateRange).every(k => !dateRange[k]) && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>🔥 Trending Events (Top 5)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {trendingEvents.map(event => (
                            <div
                                key={event._id}
                                style={{
                                    border: '2px solid #ff6b6b',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    background: '#fff3e0',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/event/${event._id}`)}
                            >
                                <div style={{ color: '#ff6b6b', fontWeight: 'bold', marginBottom: '5px' }}>⭐ TRENDING</div>
                                <h4 style={{ margin: '0 0 10px 0' }}>{event.title}</h4>
                                <p style={{ fontSize: '12px', color: '#666' }}>{event.organizer?.organizerName}</p>
                                <p style={{ fontSize: '12px', color: '#ff6b6b' }}>👥 {event.registrations?.length || 0} registered</p>
                            </div>
                        ))}
                    </div>
                    <hr style={{ margin: '30px 0', borderColor: '#ddd' }} />
                </div>
            )}

            {/* Events Count */}
            <div style={{ marginBottom: '20px', color: '#666' }}>
                Found <strong>{filteredEvents.length}</strong> event(s)
            </div>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
                    📭 No events found
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredEvents.map(event => (
                        <div
                            key={event._id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                background: '#f9f9f9',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/event/${event._id}`)}
                        >
                            <h3 style={{ margin: '0 0 10px 0' }}>{event.title}</h3>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Type:</strong> <span style={{ background: event.eventType === 'Normal' ? '#e7f3ff' : '#fff3e0', padding: '2px 8px', borderRadius: '3px' }}>{event.eventType}</span>
                            </p>
                            <p style={{ margin: '5px 0' }}><strong>Organizer:</strong> {event.organizer?.organizerName}</p>
                            <p style={{ margin: '5px 0' }}><strong>Start:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                            <p style={{ margin: '5px 0' }}><strong>End:</strong> {new Date(event.endDate).toLocaleDateString()}</p>

                            {event.eventType === 'Merchandise' ? (
                                <>
                                    <p style={{ margin: '5px 0' }}><strong>Price:</strong> ₹{event.price}</p>
                                    <p style={{ margin: '5px 0', color: event.quantity > 0 ? '#28a745' : '#dc3545' }}>
                                        <strong>Stock:</strong> {event.quantity > 0 ? event.quantity : 'SOLD OUT'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: '5px 0' }}><strong>Category:</strong> {event.category}</p>
                                    {event.capacity && <p style={{ margin: '5px 0' }}><strong>Capacity:</strong> {event.capacity}</p>}
                                </>
                            )}

                            <p style={{ margin: '5px 0' }}><strong>Status:</strong> {event.status}</p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/event/${event._id}`);
                                }}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    fontWeight: 'bold'
                                }}
                            >
                                View & Register
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventList;