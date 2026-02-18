import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';

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

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch event details
                const eventRes = await axios.get(`http://localhost:5000/api/events/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                setEvent(eventRes.data);

                // Fetch analytics and participants
                const analyticsRes = await axios.get(`http://localhost:5000/api/events/${id}/participants`, {
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
                <Button variant="outline-secondary" onClick={() => navigate('/organizer-dashboard')}>← Back to Dashboard</Button>
            </div>

            {/* ===== OVERVIEW SECTION (10.3) ===== */}
            <section className="mb-5">
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
            </section>

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
