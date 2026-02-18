import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Onboarding.css';

const Onboarding = () => {
    const [interests, setInterests] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);
    const [availableClubs, setAvailableClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const availableInterests = ['Coding', 'Music', 'Dance', 'Drama', 'Gaming', 'Design', 'AI/ML', 'Robotics'];

    useEffect(() => {
        // Fetch available organizers/clubs
        const fetchClubs = async () => {
            try {
                const res = await axios.get('/api/events');
                const organizerMap = {};
                res.data.forEach(event => {
                    if (event.organizer && event.organizer._id) {
                        organizerMap[event.organizer._id] = event.organizer;
                    }
                });
                setAvailableClubs(Object.values(organizerMap));
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch clubs");
                setLoading(false);
            }
        };
        
        fetchClubs();
    }, []);

    const handleInterestChange = (interest) => {
        setInterests(prev => 
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const handleClubChange = (clubId) => {
        setFollowedClubs(prev => 
            prev.includes(clubId) ? prev.filter(c => c !== clubId) : [...prev, clubId]
        );
    };

    const handleSubmit = async (skip = false) => {
        try {
            const token = localStorage.getItem('token');
            // Ensure the path matches your backend route exactly
            await axios.put('/api/user/preferences', 
                { 
                    interests: skip ? [] : interests,
                    followedClubs: skip ? [] : followedClubs,
                    onboardingCompleted: true // This flag stops the redirect loop
                }, 
                { headers: { 'x-auth-token': token } }
            );
            navigate('/participant-dashboard');
        } catch (err) {
            console.error("Failed to save preferences", err);
        }
    };

    if (loading) return <div className="onboarding-container"><p>Loading...</p></div>;

    return (
        <div className="onboarding-container">
            <h2>Welcome to Felicity EMS - Let's Personalize Your Experience!</h2>
            
            <div className="onboarding-section">
                <h3>📌 Select Your Interests (Section 5)</h3>
                <p>Choose topics you're interested in to get personalized event recommendations</p>
                <div className="interests-grid">
                    {availableInterests.map(item => (
                        <label key={item} className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={interests.includes(item)}
                                onChange={() => handleInterestChange(item)} 
                            /> 
                            {item}
                        </label>
                    ))}
                </div>
            </div>

            <div className="onboarding-section">
                <h3>🎯 Follow Clubs/Organizers (Section 5)</h3>
                <p>Follow organizers to stay updated with their events</p>
                <div className="clubs-grid">
                    {availableClubs.length > 0 ? (
                        availableClubs.map(club => (
                            <label key={club._id} className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={followedClubs.includes(club._id)}
                                    onChange={() => handleClubChange(club._id)} 
                                /> 
                                {club.organizerName || club.email}
                            </label>
                        ))
                    ) : (
                        <p>No clubs available yet</p>
                    )}
                </div>
            </div>

            <div className="onboarding-buttons">
                <button onClick={() => handleSubmit(false)} className="btn-submit">Save & Continue</button>
                <button onClick={() => handleSubmit(true)} className="btn-skip">Skip for Now</button>
            </div>
        </div>
    );
};

export default Onboarding;