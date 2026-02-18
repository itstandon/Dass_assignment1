// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await axios.get('/api/user/profile', {
                    headers: { 'x-auth-token': token }
                });
                setUser(res.data);
                setFormData(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                '/api/user/profile',
                formData,
                { headers: { 'x-auth-token': token } }
            );
            alert('Profile updated successfully!');
            setEditing(false);
            fetchUserProfile();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to update profile');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading profile...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>👤 My Profile</h1>

            {!editing ? (
                <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    background: '#f9f9f9'
                }}>
                    {/* Always show email and role */}
                    <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                        <p style={{ margin: '5px 0' }}><strong>📧 Email:</strong> {user?.email}</p>
                        <p style={{ margin: '5px 0' }}><strong>🔑 Role:</strong> {role}</p>
                        {role === 'Participant' && (
                            <p style={{ margin: '5px 0' }}><strong>🎓 Participant Type:</strong> {user?.participantType === 'IIIT' ? 'IIIT Student' : 'Non-IIIT Participant'}</p>
                        )}
                    </div>

                    {role === 'Participant' && (
                        <>
                            <p style={{ margin: '5px 0' }}><strong>First Name:</strong> {user?.firstName || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Last Name:</strong> {user?.lastName || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {user?.contactNumber || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>College:</strong> {user?.college || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Interests:</strong> {user?.interests?.join(', ') || 'None'}</p>
                        </>
                    )}

                    {role === 'Organizer' && (
                        <>
                            <p style={{ margin: '5px 0' }}><strong>Organizer Name:</strong> {user?.organizerName || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Category:</strong> {user?.category || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Description:</strong> {user?.description || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Contact Email:</strong> {user?.contactEmail || 'N/A'}</p>
                            <p style={{ margin: '5px 0' }}><strong>Contact Number:</strong> {user?.contactNumber || 'N/A'}</p>
                        </>
                    )}

                    <button
                        onClick={() => setEditing(true)}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ✏️ Edit Profile
                    </button>
                </div>
            ) : (
                <form onSubmit={handleUpdateProfile} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    background: '#f9f9f9'
                }}>
                    {role === 'Participant' && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Contact Number</label>
                                <input
                                    type="text"
                                    value={formData.contactNumber || ''}
                                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>College</label>
                                <input
                                    type="text"
                                    value={formData.college || ''}
                                    onChange={(e) => setFormData({...formData, college: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </>
                    )}

                    {role === 'Organizer' && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Organizer Name</label>
                                <input
                                    type="text"
                                    value={formData.organizerName || ''}
                                    onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Contact Email</label>
                                <input
                                    type="email"
                                    value={formData.contactEmail || ''}
                                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Contact Number</label>
                                <input
                                    type="text"
                                    value={formData.contactNumber || ''}
                                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            ✅ Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            style={{
                                padding: '10px 20px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            ❌ Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Profile;