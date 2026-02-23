import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/ManageClubs.css';

const ManageClubs = () => {
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

    const fetchOrganizers = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/organizers', {
                headers: { 'x-auth-token': token }
            });
            setOrganizers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch organizers', err);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrganizers();
    }, [fetchOrganizers]);

    const handleCreateOrganizer = async (e) => {
        e.preventDefault();
        
        if (!newOrgForm.organizerName || !newOrgForm.category || !newOrgForm.contactEmail) {
            alert('Please fill all required fields: Name, Category, Contact Email');
            return;
        }

        try {
            const res = await axios.post('/api/admin/create-organizer', newOrgForm, {
                headers: { 'x-auth-token': token }
            });

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
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Failed to create organizer';
            alert(`❌ Error: ${errorMsg}`);
        }
    };

    const handleArchiveOrganizer = async (organizerId, currentStatus) => {
        const action = currentStatus === 'Active' ? 'archive (disable login)' : 'reactivate';
        console.log('🔍 Archive request:', { organizerId, currentStatus, action });
        
        if (!window.confirm(`Are you sure you want to ${action} this organizer?`)) return;

        try {
            console.log('📡 Sending archive request to:', `/api/admin/organizers/${organizerId}/archive`);
            const response = await axios.put(`/api/admin/organizers/${organizerId}/archive`, {}, {
                headers: { 'x-auth-token': token }
            });
            console.log('✅ Archive response:', response.data);
            
            alert(`Organizer ${currentStatus === 'Active' ? 'archived' : 'reactivated'} successfully`);
            fetchOrganizers();
        } catch (err) {
            console.error('❌ Archive error:', err);
            alert(err.response?.data?.msg || 'Failed to update organizer');
        }
    };

    const handleDeleteOrganizer = async (organizerId) => {
        if (!window.confirm('⚠️ PERMANENT DELETE - Are you sure?\n\nThis will permanently remove the organizer and all their data. This action CANNOT be undone!\n\nConsider using "Archive" instead to just disable their login.')) return;

        try {
            await axios.delete(`/api/admin/organizers/${organizerId}`, {
                headers: { 'x-auth-token': token }
            });
            alert('✅ Organizer permanently deleted');
            fetchOrganizers();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete organizer');
        }
    };

    if (loading) return <div className="manage-clubs"><p>Loading...</p></div>;

    return (
        <div className="manage-clubs">
            <div className="container">
                <h1>📋 Manage Clubs/Organizers</h1>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Club/Organizer Management [Section 11.2]</h2>
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
                            <div className="form-row">
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

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Club description"
                                    rows="3"
                                    value={newOrgForm.description}
                                    onChange={(e) => setNewOrgForm({...newOrgForm, description: e.target.value})}
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
                            <table className="organizers-table">
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
                                        <tr key={org._id} className={org.isArchived ? 'archived-row' : ''}>
                                            <td className="org-name">{org.organizerName}</td>
                                            <td>{org.category}</td>
                                            <td className="email">{org.email}</td>
                                            <td>{org.contactEmail || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${org.isArchived ? 'archived' : 'active'}`}>
                                                    {org.isArchived ? '📦 Archived' : '✅ Active'}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                <button 
                                                    className={`btn-archive ${org.isArchived ? 'btn-reactivate' : ''}`}
                                                    onClick={() => handleArchiveOrganizer(org._id, org.isArchived ? 'Archived' : 'Active')}
                                                    title={org.isArchived ? 'Reactivate organizer' : 'Archive organizer (disable login)'}
                                                >
                                                    {org.isArchived ? '♻️ Reactivate' : '📦 Archive'}
                                                </button>
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteOrganizer(org._id)}
                                                    title="Permanently delete organizer"
                                                >
                                                    🗑️ Delete
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
                    <p><strong>When creating an organizer:</strong> The system auto-generates login credentials. Share these credentials securely with the organizer.</p>
                    <p><strong>Archive vs Delete:</strong></p>
                    <ul>
                        <li><strong>📦 Archive:</strong> Disables the organizer's login (they cannot log in, but their data is preserved). Use this for temporary suspension.</li>
                        <li><strong>🗑️ Delete:</strong> Permanently removes the organizer and all their data. This action CANNOT be undone!</li>
                    </ul>
                    <p>Organizers can log in, manage events, and view analytics immediately after creation.</p>
                </div>
            </div>
        </div>
    );
};

export default ManageClubs;
