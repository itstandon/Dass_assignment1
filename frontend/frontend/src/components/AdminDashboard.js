import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newOrgForm, setNewOrgForm] = useState({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: ''
    });
    const [showForm, setShowForm] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            // Get all users with Organizer role
            const res = await axios.get('/api/admin/organizers', {
                headers: { 'x-auth-token': token }
            });
            setOrganizers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch organizers', err);
            setLoading(false);
        }
    };

    const handleCreateOrganizer = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!newOrgForm.organizerName || !newOrgForm.category || !newOrgForm.contactEmail) {
            alert('Please fill all required fields: Name, Category, Contact Email');
            return;
        }

        try {
            console.log('Sending organizer form:', newOrgForm);
            const res = await axios.post('/api/admin/create-organizer', newOrgForm, {
                headers: { 'x-auth-token': token }
            });

            console.log('Response:', res.data);
            alert(`✅ Organizer Created Successfully!\n\n📧 Email: ${res.data.credentials.email}\n🔐 Password: ${res.data.credentials.password}\n\n⚠️ Copy these credentials and share securely with the organizer!`);
            setNewOrgForm({
                organizerName: '',
                category: '',
                description: '',
                contactEmail: ''
            });
            setShowForm(false);
            fetchOrganizers();
        } catch (err) {
            console.error('Error creating organizer:', err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Failed to create organizer';
            alert(`❌ Error: ${errorMsg}`);
        }
    };

    const handleDeleteOrganizer = async (organizerId) => {
        if (!window.confirm('Are you sure you want to remove this organizer?')) return;

        try {
            await axios.delete(`/api/admin/organizers/${organizerId}`, {
                headers: { 'x-auth-token': token }
            });
            alert('Organizer removed successfully');
            fetchOrganizers();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to remove organizer');
        }
    };

    if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

    return (
        <div className="admin-dashboard">
            <div className="container">
                <h1>🔐 Admin Dashboard [Section 11]</h1>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Manage Clubs/Organizers</h2>
                        <button 
                            className="btn-add"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? '❌ Cancel' : '➕ Add New Organizer'}
                        </button>
                    </div>

                    {/* Create Organizer Form */}
                    {showForm && (
                        <form onSubmit={handleCreateOrganizer} className="organizer-form">
                            <div className="form-group">
                                <label>Organizer Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Coding Club"
                                    value={newOrgForm.organizerName}
                                    onChange={(e) => setNewOrgForm({...newOrgForm, organizerName: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label>Category *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Technical"
                                    value={newOrgForm.category}
                                    onChange={(e) => setNewOrgForm({...newOrgForm, category: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Club description"
                                    rows="3"
                                    value={newOrgForm.description}
                                    onChange={(e) => setNewOrgForm({...newOrgForm, description: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Email *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="contact@club.com"
                                    value={newOrgForm.contactEmail}
                                    onChange={(e) => setNewOrgForm({...newOrgForm, contactEmail: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="btn-submit">Create Organizer</button>
                        </form>
                    )}

                    {/* Organizers List */}
                    <div className="organizers-list">
                        {organizers.length === 0 ? (
                            <p className="empty-state">No organizers yet. Create one to get started!</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Organizer Name</th>
                                        <th>Category</th>
                                        <th>Email</th>
                                        <th>Contact Email</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organizers.map(org => (
                                        <tr key={org._id}>
                                            <td className="org-name">{org.organizerName}</td>
                                            <td>{org.category}</td>
                                            <td className="email">{org.email}</td>
                                            <td>{org.contactEmail || '-'}</td>
                                            <td><span className="status-badge">Active</span></td>
                                            <td className="actions">
                                                <button 
                                                    className="btn-danger"
                                                    onClick={() => handleDeleteOrganizer(org._id)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="info-box">
                    <h3>📝 Note:</h3>
                    <p>When creating an organizer, the system auto-generates login credentials. Share these credentials securely with the organizer.</p>
                    <p>Organizers can log in, manage events, and view analytics immediately after creation.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
