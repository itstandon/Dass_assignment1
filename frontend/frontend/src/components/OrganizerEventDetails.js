import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import PaymentApprovalDashboard from './PaymentApprovalDashboard';
import DiscussionForum from './DiscussionForum';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeTab, setActiveTab] = useState('overview'); // New: tabs for overview | participants | payments
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch event details
                const eventRes = await axios.get(`/api/events/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                setEvent(eventRes.data);
                setEditFormData(eventRes.data); // Initialize edit form with current data

                // Fetch analytics and participants
                const analyticsRes = await axios.get(`/api/events/${id}/participants`, {
                    headers: { 'x-auth-token': token }
                });
                setAnalytics(analyticsRes.data.analytics);
                setParticipants(analyticsRes.data.participants);
                setFilteredParticipants(analyticsRes.data.participants);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load event details');
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [id]);

    // Filter participants
    useEffect(() => {
        let filtered = participants;

        // Search by name or email
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const name = p.participant ? `${p.participant.firstName} ${p.participant.lastName}`.toLowerCase() : '';
                const email = p.participant ? p.participant.email.toLowerCase() : '';
                return name.includes(lowerSearch) || email.includes(lowerSearch);
            });
        }

        // Filter by attendance status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(p => p.attendanceStatus === filterStatus);
        }

        setFilteredParticipants(filtered);
    }, [searchTerm, filterStatus, participants]);

    // Export to CSV
    const downloadCSV = () => {
        if (!participants.length) {
            alert('No participants to export');
            return;
        }

        const headers = ['Name', 'Email', 'Registration Date', 'Payment Status', 'Attendance Status', 'Team'];
        const rows = filteredParticipants.map(p => [
            p.participant ? `${p.participant.firstName} ${p.participant.lastName}` : 'N/A',
            p.participant ? p.participant.email : 'N/A',
            new Date(p.registrationDate).toLocaleDateString(),
            p.paymentStatus || 'N/A',
            p.attendanceStatus || 'N/A',
            p.teamName || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `event_participants_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form data to original event data
            setEditFormData(event);
            setUpdateError(null);
            setUpdateSuccess(false);
        }
        setIsEditing(!isEditing);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentInstructionsChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            paymentInstructions: {
                ...prev.paymentInstructions,
                [name]: value
            }
        }));
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`/api/events/${id}`, editFormData, {
                headers: { 'x-auth-token': token }
            });

            setEvent(response.data);
            setEditFormData(response.data);
            setUpdateSuccess(true);
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setUpdateError(err.response?.data?.msg || 'Failed to update event');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!event) return <Container className="mt-5"><Alert variant="warning">Event not found</Alert></Container>;

    return (
        <Container className="mt-4 mb-5">
            {/* ===== HEADER ===== */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-2">{event.title}</h2>
                    <div className="d-flex gap-2">
                        <Badge bg={event.eventType === 'Normal' ? 'info' : 'warning'}>{event.eventType}</Badge>
                        <Badge bg={getStatusBg(event.status)}>{event.status}</Badge>
                        <Badge bg="secondary">{event.eligibility}</Badge>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => navigate('/organizer-dashboard')}>← Back to Dashboard</Button>
                    <Button 
                        variant={isEditing ? 'secondary' : 'primary'} 
                        onClick={handleEditToggle}
                    >
                        {isEditing ? '✖ Cancel Edit' : '✏️ Edit Event'}
                    </Button>
                    <Button variant="success" onClick={() => navigate(`/event/${id}/scanner`)}>📱 Scan QR Code</Button>
                    <Button variant="info" onClick={() => navigate(`/event/${id}/attendance`)}>📊 View Attendance</Button>
                </div>
            </div>

            {/* ===== UPDATE SUCCESS/ERROR MESSAGES ===== */}
            {updateSuccess && <Alert variant="success">✅ Event updated successfully!</Alert>}
            {updateError && <Alert variant="danger">{updateError}</Alert>}

            {/* ===== TAB NAVIGATION ===== */}
            <div className="mb-4" style={{ borderBottom: '2px solid #ddd' }}>
                <div className="d-flex gap-2">
                    <Button 
                        variant={activeTab === 'overview' ? 'primary' : 'outline-secondary'}
                        onClick={() => setActiveTab('overview')}
                        style={{ borderRadius: '4px 4px 0 0' }}
                    >
                        📋 Overview
                    </Button>
                    <Button 
                        variant={activeTab === 'participants' ? 'primary' : 'outline-secondary'}
                        onClick={() => setActiveTab('participants')}
                        style={{ borderRadius: '4px 4px 0 0' }}
                    >
                        👥 Participants ({participants.length})
                    </Button>
                    {event.eventType === 'Merchandise' && (
                        <Button 
                            variant={activeTab === 'payments' ? 'primary' : 'outline-secondary'}
                            onClick={() => setActiveTab('payments')}
                            style={{ borderRadius: '4px 4px 0 0' }}
                        >
                            💳 Payment Approvals
                        </Button>
                    )}
                    <Button 
                        variant={activeTab === 'forum' ? 'primary' : 'outline-secondary'}
                        onClick={() => setActiveTab('forum')}
                        style={{ borderRadius: '4px 4px 0 0' }}
                    >
                        💬 Discussion Forum
                    </Button>
                </div>
            </div>

            {/* ===== TAB CONTENT ===== */}
            {activeTab === 'payments' && event.eventType === 'Merchandise' && (
                <PaymentApprovalDashboard eventId={id} />
            )}

            {activeTab === 'forum' && (
                <DiscussionForum eventId={id} />
            )}

            {/* Show overview section when overview tab is active */}
            {activeTab === 'overview' && (
                <section className="mb-5">
                    {/* ===== EDIT FORM ===== */}
                    {isEditing ? (
                        <Card className="mb-4 shadow">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">✏️ Edit Event</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleUpdateEvent}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Title</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={editFormData.title || ''}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Status</Form.Label>
                                                <Form.Select
                                                    name="status"
                                                    value={editFormData.status || ''}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="Closed">Closed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                    <option value="Completed">Completed</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            value={editFormData.description || ''}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>

                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Registration Deadline</Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    name="registrationDeadline"
                                                    value={editFormData.registrationDeadline ? new Date(editFormData.registrationDeadline).toISOString().slice(0, 16) : ''}
                                                    onChange={handleEditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Start Date</Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    name="startDate"
                                                    value={editFormData.startDate ? new Date(editFormData.startDate).toISOString().slice(0, 16) : ''}
                                                    onChange={handleEditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>End Date</Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    name="endDate"
                                                    value={editFormData.endDate ? new Date(editFormData.endDate).toISOString().slice(0, 16) : ''}
                                                    onChange={handleEditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Normal Event Fields */}
                                    {event.eventType === 'Normal' && (
                                        <>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Location</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="location"
                                                            value={editFormData.location || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Category</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="category"
                                                            value={editFormData.category || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Capacity</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="capacity"
                                                            value={editFormData.capacity || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Registration Fee (₹)</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="registrationFee"
                                                            value={editFormData.registrationFee || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    {/* Merchandise Event Fields */}
                                    {event.eventType === 'Merchandise' && (
                                        <>
                                            <Row>
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Price (₹)</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="price"
                                                            value={editFormData.price || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Total Stock</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="totalStock"
                                                            value={editFormData.totalStock || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Purchase Limit Per Person</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="purchaseLimitPerParticipant"
                                                            value={editFormData.purchaseLimitPerParticipant || ''}
                                                            onChange={handleEditChange}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            {/* Payment Instructions */}
                                            <Card className="mb-3 bg-light">
                                                <Card.Body>
                                                    <h6 className="mb-3">💳 Payment Instructions</h6>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>UPI ID</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="upiId"
                                                                    value={editFormData.paymentInstructions?.upiId || ''}
                                                                    onChange={handlePaymentInstructionsChange}
                                                                    placeholder="example@upi"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Account Holder Name</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="accountHolderName"
                                                                    value={editFormData.paymentInstructions?.accountHolderName || ''}
                                                                    onChange={handlePaymentInstructionsChange}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Account Number</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="accountNumber"
                                                            value={editFormData.paymentInstructions?.accountNumber || ''}
                                                            onChange={handlePaymentInstructionsChange}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mb-0">
                                                        <Form.Label>Additional Notes</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            name="additionalNotes"
                                                            value={editFormData.paymentInstructions?.additionalNotes || ''}
                                                            onChange={handlePaymentInstructionsChange}
                                                            placeholder="Any additional payment instructions..."
                                                        />
                                                    </Form.Group>
                                                </Card.Body>
                                            </Card>
                                        </>
                                    )}

                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="success" 
                                            type="submit" 
                                            disabled={updateLoading}
                                        >
                                            {updateLoading ? 'Updating...' : '✓ Save Changes'}
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            onClick={handleEditToggle}
                                            disabled={updateLoading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                    <h4 className="mb-3">📋 Event Overview</h4>
                    <Row xs={1} md={2} lg={3} className="g-3">
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Type</Card.Title>
                                        <p className="mb-0"><strong>{event.eventType}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Status</Card.Title>
                                        <p className="mb-0"><Badge bg={getStatusBg(event.status)}>{event.status}</Badge></p>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Eligibility</Card.Title>
                                        <p className="mb-0"><strong>{event.eligibility}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>

                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <Card.Title className="small text-muted">Registration Deadline</Card.Title>
                                <p className="mb-0"><strong>{new Date(event.registrationDeadline).toLocaleDateString()}</strong></p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <Card.Title className="small text-muted">Event Start Date</Card.Title>
                                <p className="mb-0"><strong>{new Date(event.startDate).toLocaleDateString()}</strong></p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <Card.Title className="small text-muted">Event End Date</Card.Title>
                                <p className="mb-0"><strong>{new Date(event.endDate).toLocaleDateString()}</strong></p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Event Type Specific Info */}
                <Row xs={1} md={2} className="g-3 mt-3">
                    {event.eventType === 'Normal' && (
                        <>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Category</Card.Title>
                                        <p className="mb-0"><strong>{event.category}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Location</Card.Title>
                                        <p className="mb-0"><strong>{event.location}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Capacity</Card.Title>
                                        <p className="mb-0"><strong>{event.capacity}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Registration Fee</Card.Title>
                                        <p className="mb-0"><strong>₹{event.registrationFee}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </>
                    )}

                    {event.eventType === 'Merchandise' && (
                        <>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Price</Card.Title>
                                        <p className="mb-0"><strong>₹{event.price}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Total Stock</Card.Title>
                                        <p className="mb-0"><strong>{event.totalStock}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="small text-muted">Purchase Limit/Person</Card.Title>
                                        <p className="mb-0"><strong>{event.purchaseLimitPerParticipant}</strong></p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </>
                    )}
                </Row>

                <Card className="mt-3 shadow-sm">
                    <Card.Body>
                        <Card.Title className="small text-muted">Description</Card.Title>
                        <p className="mb-0">{event.description}</p>
                    </Card.Body>
                </Card>
                </>
                    )}
            </section>
            )}

            {/* Show participants section when participants tab is active */}
            {activeTab === 'participants' && (
                <>
                    {/* ===== ANALYTICS SECTION (10.3) ===== */}
            {analytics && (
                <section className="mb-5">
                    <h4 className="mb-3">📊 Event Analytics</h4>
                    <Row xs={1} md={2} lg={4} className="g-3">
                        <Col>
                            <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #28a745' }}>
                                <Card.Body>
                                    <Card.Title className="small text-muted">Total {event.eventType === 'Normal' ? 'Registrations' : 'Sales'}</Card.Title>
                                    <h3 className="text-success">{analytics.totalRegistrations}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col>
                            <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #17a2b8' }}>
                                <Card.Body>
                                    <Card.Title className="small text-muted">Revenue Generated</Card.Title>
                                    <h3 className="text-info">₹{analytics.revenue.toLocaleString()}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col>
                            <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #ffc107' }}>
                                <Card.Body>
                                    <Card.Title className="small text-muted">Attendance Rate</Card.Title>
                                    <h3 className="text-warning">{analytics.attendanceRate}%</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col>
                            <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #007bff' }}>
                                <Card.Body>
                                    <Card.Title className="small text-muted">Status</Card.Title>
                                    <p className="mb-0"><Badge bg={getStatusBg(analytics.status)}>{analytics.status}</Badge></p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </section>
            )}

            {/* ===== PARTICIPANTS LIST (10.3) ===== */}
            <section className="mb-5">
                <h4 className="mb-3">👥 Participants ({filteredParticipants.length})</h4>

                {/* Search & Filter Bar */}
                <Card className="mb-3 shadow-sm">
                    <Card.Body>
                        <Row xs={1} md={3} className="g-3">
                            <Col>
                                <InputGroup>
                                    <InputGroup.Text>🔍</InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>

                            <Col>
                                <Form.Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Attendance Status</option>
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="NotMarked">Not Marked</option>
                                </Form.Select>
                            </Col>

                            <Col className="d-flex gap-2">
                                <Button 
                                    variant="success" 
                                    onClick={downloadCSV}
                                    className="flex-grow-1"
                                >
                                    📥 Export CSV
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Participants Table */}
                <Card className="shadow-sm" style={{ overflowX: 'auto' }}>
                    <Card.Body>
                        {filteredParticipants.length > 0 ? (
                            <Table responsive striped hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Registration Date</th>
                                        <th>Payment Status</th>
                                        <th>Attendance</th>
                                        {event.eventType === 'Normal' && <th>Team</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((registration) => (
                                        <tr key={registration._id}>
                                            <td className="fw-medium">
                                                {registration.participant 
                                                    ? `${registration.participant.firstName} ${registration.participant.lastName}`
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>{registration.participant?.email || 'N/A'}</td>
                                            <td>{new Date(registration.registrationDate).toLocaleDateString()}</td>
                                            <td>
                                                <Badge bg={getPaymentBg(registration.paymentStatus)}>
                                                    {registration.paymentStatus || 'Pending'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={getAttendanceBg(registration.attendanceStatus)}>
                                                    {registration.attendanceStatus || 'Not Marked'}
                                                </Badge>
                                            </td>
                                            {event.eventType === 'Normal' && (
                                                <td>{registration.teamName || '-'}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted mb-0">No participants found matching your filters.</p>
                        )}
                    </Card.Body>
                </Card>

                <p className="text-muted small mt-2 mb-0">
                    Showing {filteredParticipants.length} of {participants.length} participants
                </p>
            </section>
                </>
            )}
        </Container>
    );
};

// Helper functions
const getStatusBg = (status) => {
    switch (status) {
        case 'Scheduled': return 'success';
        case 'Ongoing': return 'danger';
        case 'Completed': return 'secondary';
        case 'Cancelled': return 'dark';
        case 'Draft': return 'warning';
        default: return 'secondary';
    }
};

const getPaymentBg = (status) => {
    switch (status) {
        case 'Completed': return 'success';
        case 'Pending': return 'warning';
        case 'Failed': return 'danger';
        default: return 'secondary';
    }
};

const getAttendanceBg = (status) => {
    switch (status) {
        case 'Present': return 'success';
        case 'Absent': return 'danger';
        case 'NotMarked': return 'secondary';
        default: return 'secondary';
    }
};

export default OrganizerEventDetails;
