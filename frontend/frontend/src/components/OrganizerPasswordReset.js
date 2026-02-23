import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { Container, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';

const OrganizerPasswordReset = () => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/password-reset/my-requests', {
                headers: { 'x-auth-token': token }
            });
            setRequests(res.data);
            setLoadingRequests(false);
        } catch (err) {
            console.error(err);
            setLoadingRequests(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/password-reset/request', 
                { reason },
                { headers: { 'x-auth-token': token } }
            );

            setSuccess(res.data.msg);
            setReason('');
            fetchMyRequests(); // Refresh the list

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Approved': return 'success';
            case 'Rejected': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <Container className="mt-4 mb-5">
            <h2 className="mb-4">🔐 Password Reset Request</h2>

            {/* Request Form */}
            <Card className="mb-4 shadow">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Request Password Reset from Admin</h5>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Reason for Password Reset *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please provide a detailed reason why you need to reset your password (minimum 10 characters)..."
                                required
                                minLength={10}
                            />
                            <Form.Text className="text-muted">
                                Provide a clear explanation. Admin will review your request.
                            </Form.Text>
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={loading || reason.length < 10}
                        >
                            {loading ? 'Submitting...' : '📤 Submit Request'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {/* Request History */}
            <Card className="shadow">
                <Card.Header className="bg-secondary text-white">
                    <h5 className="mb-0">📋 My Password Reset Requests</h5>
                </Card.Header>
                <Card.Body>
                    {loadingRequests ? (
                        <p>Loading...</p>
                    ) : requests.length === 0 ? (
                        <Alert variant="info">You have no password reset requests.</Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Admin Comments</th>
                                    <th>Reviewed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr key={request._id}>
                                        <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: '300px' }}>{request.reason}</td>
                                        <td>
                                            <Badge bg={getStatusBadge(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </td>
                                        <td>{request.adminComments || '-'}</td>
                                        <td>
                                            {request.reviewedAt 
                                                ? new Date(request.reviewedAt).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default OrganizerPasswordReset;
