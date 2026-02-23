import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalOrganizers: 0,
        activeOrganizers: 0,
        archivedOrganizers: 0,
        pendingPasswordResets: 0
    });
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const fetchStats = useCallback(async () => {
        try {
            const orgRes = await axios.get('/api/admin/organizers', {
                headers: { 'x-auth-token': token }
            });
            
            const totalOrganizers = orgRes.data.length;
            const activeOrganizers = orgRes.data.filter(org => !org.isArchived).length;
            const archivedOrganizers = orgRes.data.filter(org => org.isArchived).length;

            // Try to fetch password reset requests (if implemented)
            let pendingPasswordResets = 0;
            try {
                const resetRes = await axios.get('/api/admin/password-reset-requests', {
                    headers: { 'x-auth-token': token }
                });
                pendingPasswordResets = resetRes.data.filter(req => req.status === 'Pending').length;
            } catch (err) {
                console.log('Password reset endpoint not available yet');
            }

            setStats({
                totalOrganizers,
                activeOrganizers,
                archivedOrganizers,
                pendingPasswordResets
            });
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch stats', err);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

    return (
        <div className="admin-dashboard">
            <div className="container">
                <h1>🔐 Admin Dashboard [Section 11]</h1>
                <p className="subtitle">System Overview and Management</p>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h3>{stats.totalOrganizers}</h3>
                            <p>Total Organizers</p>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{stats.activeOrganizers}</h3>
                            <p>Active Organizers</p>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>{stats.archivedOrganizers}</h3>
                            <p>Archived Organizers</p>
                        </div>
                    </div>

                    <div className="stat-card danger">
                        <div className="stat-icon">🔑</div>
                        <div className="stat-info">
                            <h3>{stats.pendingPasswordResets}</h3>
                            <p>Pending Password Resets</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-section">
                    <h2>⚡ Quick Actions</h2>
                    <div className="actions-grid">
                        <Link to="/manage-clubs" className="action-card">
                            <div className="action-icon">📋</div>
                            <h3>Manage Clubs/Organizers</h3>
                            <p>Add, archive, or delete club organizers. View all organizer accounts.</p>
                        </Link>

                        <Link to="/password-requests" className="action-card">
                            <div className="action-icon">🔑</div>
                            <h3>Password Reset Requests</h3>
                            <p>Review and approve password reset requests from organizers.</p>
                        </Link>
                    </div>
                </div>

                {/* System Info */}
                <div className="info-box">
                    <h3>📝 Admin Responsibilities:</h3>
                    <ul>
                        <li><strong>Manage Organizers:</strong> Create new club/organizer accounts with auto-generated credentials</li>
                        <li><strong>Account Control:</strong> Archive (disable login) or permanently delete organizer accounts</li>
                        <li><strong>Password Resets:</strong> Approve or reject password reset requests from organizers</li>
                        <li><strong>System Oversight:</strong> Monitor system activity and ensure smooth operations</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
