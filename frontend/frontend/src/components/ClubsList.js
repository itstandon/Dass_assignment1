import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ClubsList = () => {
    const [clubs, setClubs] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Fetch all clubs
        axios.get('/api/user/organizers', {
            headers: { 'x-auth-token': token }
        }).then(res => setClubs(res.data));

        // Fetch current user's followed clubs
        axios.get('/api/auth/me', {
            headers: { 'x-auth-token': token }
        }).then(res => setFollowedClubs(res.data.followedClubs || []));
    }, []);

    const toggleFollow = async (clubId) => {
        await axios.post(`/api/user/follow/${clubId}`, {}, {
            headers: { 'x-auth-token': token }
        });
        // Toggle locally
        setFollowedClubs(prev =>
            prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
        );
    };

    return (
        <div style={{ padding: '20px' }}>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {clubs.map(club => (
                    <div key={club._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                        <h4>{club.organizerName}</h4>
                        <p>{club.category} — {club.description}</p>
                        <button onClick={() => toggleFollow(club._id)}>
                            {followedClubs.includes(club._id) ? 'Unfollow' : 'Follow'}
                        </button>
                        <Link to={`/organizer/${club._id}`} style={{ marginLeft: '10px' }}>View Details</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClubsList;