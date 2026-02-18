// src/components/BrowseEvents.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ type: 'All', eligibility: 'Everyone' });

    useEffect(() => {
        const fetchEvents = async () => {
            const query = `?search=${searchTerm}&eventType=${filters.type}&eligibility=${filters.eligibility}`;
            const res = await axios.get(`/api/events${query}`);
            setEvents(res.data);
        };
        fetchEvents();
    }, [searchTerm, filters]);

    return (
        <div style={{ padding: '20px' }}>
            <input 
                type="text" 
                placeholder="Search events or clubs..." 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
            />
            
            <div className="filters">
                <select onChange={(e) => setFilters({...filters, type: e.target.value})}>
                    <option value="All">All Types</option>
                    <option value="Normal">Normal</option>
                    <option value="Merchandise">Merchandise</option>
                </select>
                {/* Add more filters as per Section 9.3 */}
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {events.map(event => (
                    <div key={event._id} style={{ border: '1px solid #ccc', padding: '15px' }}>
                        <h4>{event.title}</h4>
                        <p>{event.description.substring(0, 100)}...</p>
                        <Link to={`/events/${event._id}`}>View Details</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};