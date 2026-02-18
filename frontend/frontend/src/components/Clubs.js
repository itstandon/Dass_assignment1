import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Clubs = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedClubs, setFollowedClubs] = useState([]);
    const token = localStorage.getItem('token');

    const fetchOrganizers = useCallback(async () => {
        try {
            const res = await axios.get('/api/events');
            const uniqueOrganizers = {};
            res.data.forEach(event => {
                if (event.organizer && !uniqueOrganizers[event.organizer._id]) {
                    uniqueOrganizers[event.organizer._id] = event.organizer;
                }
            });
            setOrganizers(Object.values(uniqueOrganizers));
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch organizers', err);
            setLoading(false);
        }
    }, []);

    const fetchFollowedClubs = useCallback(async () => {
        try {
            const res = await axios.get('/api/user/preferences', {
                headers: { 'x-auth-token': token }
            });
            setFollowedClubs(res.data.followedClubs || []);
        } catch (err) {
            console.error('Failed to fetch followed clubs', err);
        }
    }, [token]);

    useEffect(() => {
        fetchOrganizers();
        fetchFollowedClubs();
    }, [fetchOrganizers, fetchFollowedClubs]);

    const handleFollowClub = async (organizerId) => {
        try {
            await axios.put(
                '/api/user/preferences',
                { action: 'follow', clubId: organizerId },
                { headers: { 'x-auth-token': token } }
            );
            // Refresh followed clubs from server
            fetchFollowedClubs();
        } catch (err) {
            alert('Failed to follow club');
        }
    };

    const handleUnfollowClub = async (organizerId) => {
        try {
            await axios.put(
                '/api/user/preferences',
                { action: 'unfollow', clubId: organizerId },
                { headers: { 'x-auth-token': token } }
            );
            // Refresh followed clubs from server
            fetchFollowedClubs();
        } catch (err) {
            alert('Failed to unfollow club');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading clubs...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>🎭 Clubs & Organizers [Section 9.3]</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>Browse and follow event organizers and clubs</p>

            {organizers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    📭 No clubs found
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {organizers.map(org => (
                        <div 
                            key={org._id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                background: '#f9f9f9'
                            }}
                        >
                            <h3>{org.organizerName}</h3>
                            <p><strong>Category:</strong> {org.category}</p>
                            {org.description && (
                                <p style={{ color: '#666', marginTop: '10px' }}>{org.description}</p>
                            )}
                            {org.contactEmail && (
                                <p><strong>Contact:</strong> {org.contactEmail}</p>
                            )}
                            
                            <button
                                onClick={() => 
                                    followedClubs.includes(org._id)
                                        ? handleUnfollowClub(org._id)
                                        : handleFollowClub(org._id)
                                }
                                style={{
                                    marginTop: '15px',
                                    padding: '10px 20px',
                                    background: followedClubs.includes(org._id) ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    fontWeight: 'bold'
                                }}
                            >
                                {followedClubs.includes(org._id) ? '⭐ Following' : '☆ Follow'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Clubs;
