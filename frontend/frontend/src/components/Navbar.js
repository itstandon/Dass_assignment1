import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../utils/axiosConfig';

const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        // Section 4.3: Clear all authentication tokens 
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setAuthToken(null);
        navigate('/login');
    };

    if (!role) return null;

    const linkStyle = { color: 'white', marginRight: '15px', textDecoration: 'none' };

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#333', color: 'white' }}>
            <div>
                <span style={{ marginRight: '20px', fontWeight: 'bold' }}>Felicity EMS</span>
                
                {/* Participant Links  */}
                {role === 'Participant' && (
                    <>
                        <Link to="/participant-dashboard" style={linkStyle}>Dashboard</Link>
                        <Link to="/browse-events" style={linkStyle}>Browse Events</Link>
                        <Link to="/clubs" style={linkStyle}>Clubs/Organizers</Link>
                        <Link to="/profile" style={linkStyle}>Profile</Link>
                    </>
                )}

                {/* Organizer Links  */}
                {role === 'Organizer' && (
                    <>
                        <Link to="/organizer-dashboard" style={linkStyle}>Dashboard</Link>
                        <Link to="/create-event" style={linkStyle}>Create Event</Link>
                        <Link to="/ongoing-events" style={linkStyle}>Ongoing Events</Link>
                        <Link to="/password-reset" style={linkStyle}>Password Reset</Link>
                        <Link to="/profile" style={linkStyle}>Profile</Link>
                    </>
                )}

                {/* Admin Links  */}
                {role === 'Admin' && (
                    <>
                        <Link to="/admin-dashboard" style={linkStyle}>Dashboard</Link>
                        <Link to="/manage-clubs" style={linkStyle}>Manage Clubs/Organizers</Link>
                        <Link to="/password-requests" style={linkStyle}>Password Reset Requests</Link>
                    </>
                )}
            </div>
            <button onClick={handleLogout} style={{ cursor: 'pointer', background: '#dc3545', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
                Logout
            </button>
        </nav>
    );
};

export default Navbar;