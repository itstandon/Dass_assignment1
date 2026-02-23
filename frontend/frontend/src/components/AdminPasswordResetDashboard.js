import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { Container, Card, Table, Badge, Button, Form, Modal, Alert, Tabs, Tab } from 'react-bootstrap';

const AdminPasswordResetDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminComments, setAdminComments] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState(null);

    // Filter state
    const [activeTab, setActiveTab] = useState('Pending');

    useEffect(() => {
        fetchRequests(activeTab);
    }, [activeTab]);

    const fetchRequests = async (status = '') => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = status && status !== 'All' 
                ? `/api/password-reset/admin/all?status=${status}`
                : '/api/password-reset/admin/all';
            
            const res = await axios.get(url, {
                headers: { 'x-auth-token': token }
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load password reset requests');
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        setGeneratedPassword(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `/api/password-reset/admin/approve/${selectedRequest._id}`,
                { adminComments },
                { headers: { 'x-auth-token': token } }
            );

            setGeneratedPassword(res.data.newPassword);
            setSuccess(`Request approved! New password generated: ${res.data.newPassword}`);
            fetchRequests(activeTab);
            
            // Keep modal open to show password
            setTimeout(() => {
                setShowApproveModal(false);
                setAdminComments('');
                setSelectedRequest(null);
            }, 10000); // Close after 10 seconds

        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to approve request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!adminComments || adminComments.length < 5) {
            setError('Please provide a reason for rejection (minimum 5 characters)');
            return;
        }

        setActionLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/password-reset/admin/reject/${selectedRequest._id}`,
                { adminComments },
                { headers: { 'x-auth-token': token } }
            );

            setSuccess('Request rejected successfully');
            fetchRequests(activeTab);
            setShowRejectModal(false);
            setAdminComments('');
            setSelectedRequest(null);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
        setAdminComments('');
        setError(null);
        setSuccess(null);
        setGeneratedPassword(null);
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
        setAdminComments('');
        setError(null);
        setSuccess(null);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Approved': return 'success';
            case 'Rejected': return 'danger';
            default: return 'secondary';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Password copied to clipboard!');
    };

    return (
        <Container className="mt-4 mb-5">
            <h2 className="mb-4">🔐 Admin - Password Reset Requests</h2>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

            <Card className="shadow">
                <Card.Header>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Tab eventKey="Pending" title="🟡 Pending" />
                        <Tab eventKey="Approved" title="✅ Approved" />
                        <Tab eventKey="Rejected" title="❌ Rejected" />
                        <Tab eventKey="All" title="📋 All Requests" />
                    </Tabs>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <p>Loading requests...</p>
                    ) : requests.length === 0 ? (
                        <Alert variant="info">No {activeTab.toLowerCase()} requests found.</Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Organizer</th>
                                    <th>Email</th>
                                    <th>Club Name</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr key={request._id}>
                                        <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                                        <td>{request.organizerName}</td>
                                        <td>{request.organizerEmail}</td>
                                        <td>{request.clubName}</td>
                                        <td style={{ maxWidth: '300px' }}>{request.reason}</td>
                                        <td>
                                            <Badge bg={getStatusBadge(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            {request.status === 'Pending' ? (
                                                <div className="d-flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="success"
                                                        onClick={() => openApproveModal(request)}
                                                    >
                                                        ✓ Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="danger"
                                                        onClick={() => openRejectModal(request)}
                                                    >
                                                        ✗ Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-muted">
                                                    {request.adminComments || 'No comments'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Approve Modal */}
            <Modal show={showApproveModal} onHide={() => !actionLoading && setShowApproveModal(false)}>
                <Modal.Header closeButton={!actionLoading}>
                    <Modal.Title>✅ Approve Password Reset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {generatedPassword ? (
                        <Alert variant="success">
                            <h5>Password Reset Approved!</h5>
                            <p><strong>New Password:</strong></p>
                            <div className="d-flex align-items-center gap-2">
                                <code style={{ 
                                    fontSize: '20px', 
                                    padding: '10px', 
                                    background: '#f5f5f5',
                                    borderRadius: '4px',
                                    flex: 1
                                }}>
                                    {generatedPassword}
                                </code>
                                <Button 
                                    size="sm" 
                                    onClick={() => copyToClipboard(generatedPassword)}
                                >
                                    📋 Copy
                                </Button>
                            </div>
                            <p className="mt-3 mb-0">
                                <strong>⚠️ Important:</strong> Share this password with the organizer <strong>{selectedRequest?.organizerEmail}</strong>. 
                                They can use it to log in and change it later.
                            </p>
                        </Alert>
                    ) : (
                        <>
                            <p>Approve password reset for <strong>{selectedRequest?.organizerName}</strong>?</p>
                            <p className="text-muted">
                                A new random password will be generated. You'll receive it to share with the organizer.
                            </p>
                            <Form.Group>
                                <Form.Label>Admin Comments (Optional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={adminComments}
                                    onChange={(e) => setAdminComments(e.target.value)}
                                    placeholder="Any notes for this approval..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!generatedPassword && (
                        <>
                            <Button variant="secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button variant="success" onClick={handleApprove} disabled={actionLoading}>
                                {actionLoading ? 'Approving...' : 'Approve & Generate Password'}
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onHide={() => !actionLoading && setShowRejectModal(false)}>
                <Modal.Header closeButton={!actionLoading}>
                    <Modal.Title>❌ Reject Password Reset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Reject password reset for <strong>{selectedRequest?.organizerName}</strong>?</p>
                    <Form.Group>
                        <Form.Label>Reason for Rejection *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={adminComments}
                            onChange={(e) => setAdminComments(e.target.value)}
                            placeholder="Provide a reason for rejection (minimum 5 characters)..."
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
                        {actionLoading ? 'Rejecting...' : 'Reject Request'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminPasswordResetDashboard;
