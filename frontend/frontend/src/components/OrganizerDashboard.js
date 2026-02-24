import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/events/organizer/my-events', {
                    headers: { 'x-auth-token': token }
                });
                setEvents(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('Failed to load events');
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Helper function to calculate actual event status based on dates
    const getEventStatus = (event) => {
        const now = new Date();
        const startDate = event.startDate ? new Date(event.startDate) : null;
        const endDate = event.endDate ? new Date(event.endDate) : null;

        // If event is marked as Draft, keep it as Draft
        if (event.status === 'Draft') return 'Draft';

        // If no dates, use database status
        if (!startDate || !endDate) return event.status || 'Scheduled';

        // Calculate based on dates
        if (endDate < now) {
            return 'Completed'; // Event has ended
        } else if (startDate <= now && now <= endDate) {
            return 'Ongoing'; // Event is currently happening
        } else if (startDate > now) {
            return 'Scheduled'; // Event hasn't started yet
        }

        return event.status || 'Scheduled';
    };

    const categorizedEvents = {
        Draft: events.filter(e => getEventStatus(e) === 'Draft'),
        Published: events.filter(e => getEventStatus(e) === 'Scheduled'),
        Ongoing: events.filter(e => getEventStatus(e) === 'Ongoing'),
        Completed: events.filter(e => getEventStatus(e) === 'Completed' || e.status === 'Cancelled')
    };

    // Calculate analytics from local events
    const completedEvents = categorizedEvents.Completed;
    let totalRegistrations = 0;
    let totalRevenue = 0;
    let totalAttended = 0;

    completedEvents.forEach(event => {
        if (event.registrations && Array.isArray(event.registrations)) {
            totalRegistrations += event.registrations.length;
            
            // Count attended participants
            const attendedCount = event.registrations.filter(reg => 
                reg.attendanceStatus === 'attended' || reg.status === 'attended'
            ).length;
            totalAttended += attendedCount;
            
            // Calculate revenue properly
            event.registrations.forEach(reg => {
                if (event.eventType === 'Normal') {
                    totalRevenue += (event.registrationFee || 0);
                } else if (event.eventType === 'Merchandise') {
                    // For merchandise, use quantity * price
                    const quantity = reg.quantity || 1;
                    const price = event.price || 0;
                    totalRevenue += (quantity * price);
                }
            });
        }
    });

    const overallAttendanceRate = totalRegistrations > 0 ? ((totalAttended / totalRegistrations) * 100).toFixed(2) : 0;

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📊 Organizer Dashboard</h2>
                <Button as={Link} to="/create-event" variant="primary">+ Create New Event</Button>
            </div>

            {/* ===== ANALYTICS SECTION (10.2) ===== */}
            <section className="mb-5">
                <h4 className="text-success mb-3">📈 Overall Statistics</h4>
                <Row xs={1} md={2} lg={4} className="g-4">
                    <Col>
                        <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #28a745' }}>
                            <Card.Body>
                                <Card.Title className="small text-muted">Total Registrations</Card.Title>
                                <h3 className="text-success">{totalRegistrations}</h3>
                                <Card.Text className="small">From all completed events</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col>
                        <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #17a2b8' }}>
                            <Card.Body>
                                <Card.Title className="small text-muted">Total Revenue</Card.Title>
                                <h3 className="text-info">₹{totalRevenue.toLocaleString()}</h3>
                                <Card.Text className="small">Across all events</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col>
                        <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #ffc107' }}>
                            <Card.Body>
                                <Card.Title className="small text-muted">Attendance Rate</Card.Title>
                                <h3 className="text-warning">{overallAttendanceRate}%</h3>
                                <Card.Text className="small">{totalAttended} / {totalRegistrations} attended</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col>
                        <Card className="text-center h-100 shadow-sm" style={{ borderLeft: '4px solid #007bff' }}>
                            <Card.Body>
                                <Card.Title className="small text-muted">All Events</Card.Title>
                                <h3 className="text-primary">{events.length}</h3>
                                <Card.Text className="small">
                                    <span className="badge bg-success me-1">{categorizedEvents.Ongoing.length} Ongoing</span>
                                    <span className="badge bg-secondary">{completedEvents.length} Completed</span>
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* ===== DRAFT EVENTS SECTION ===== */}
            {categorizedEvents.Draft.length > 0 && (
                <section className="mb-5">
                    <h4 className="text-warning mb-3">📝 Draft Events (Not Published)</h4>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {categorizedEvents.Draft.map(event => (
                            <Col key={event._id}>
                                <EventCard event={event} calculatedStatus={getEventStatus(event)} isDraft />
                            </Col>
                        ))}
                    </Row>
                </section>
            )}

            {/* ===== ONGOING EVENTS SECTION ===== */}
            {categorizedEvents.Ongoing.length > 0 && (
                <section className="mb-5">
                    <h4 className="text-danger mb-3">🔔 Ongoing Events</h4>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {categorizedEvents.Ongoing.map(event => (
                            <Col key={event._id}>
                                <EventCard event={event} calculatedStatus={getEventStatus(event)} />
                            </Col>
                        ))}
                    </Row>
                </section>
            )}

            {/* ===== SCHEDULED EVENTS SECTION ===== */}
            <section className="mb-5">
                <h4 className="mb-3">📅 Upcoming / Published Events</h4>
                {categorizedEvents.Published.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {categorizedEvents.Published.map(event => (
                            <Col key={event._id}>
                                <EventCard event={event} calculatedStatus={getEventStatus(event)} />
                            </Col>
                        ))}
                    </Row>
                ) : <p className="text-muted">No upcoming events scheduled.</p>}
            </section>

            {/* ===== COMPLETED EVENTS SECTION ===== */}
            <section className="mb-5">
                <h4 className="mb-3 text-muted">📜 Past Events</h4>
                {completedEvents.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {completedEvents.map(event => (
                            <Col key={event._id}>
                                <EventCard event={event} calculatedStatus={getEventStatus(event)} isPast />
                            </Col>
                        ))}
                    </Row>
                ) : <p className="text-muted">No past events found.</p>}
            </section>
        </Container>
    );
};

const EventCard = ({ event, calculatedStatus, isPast, isDraft }) => (
    <Card className={`h-100 shadow-sm ${isPast ? 'bg-light' : ''} ${isDraft ? 'border-warning' : ''}`}>
        <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
                <Badge bg={event.eventType === 'Normal' ? 'info' : 'warning'}>{event.eventType}</Badge>
                <Badge bg={getStatusVariant(calculatedStatus || event.status)}>{calculatedStatus || event.status}</Badge>
            </div>
            <Card.Title>{event.title}</Card.Title>
            <Card.Text className="text-muted small mb-2">
                {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date set'}
            </Card.Text>
            <Card.Text className="text-truncate">
                {event.description || 'No description'}
            </Card.Text>
        </Card.Body>
        <Card.Footer className="bg-white border-top-0 d-flex justify-content-between gap-2">
            {isDraft ? (
                <>
                    <Link to={`/create-event?edit=${event._id}`} className="btn btn-warning btn-sm flex-grow-1">✏️ Edit Draft</Link>
                    <Link to={`/event/${event._id}/details`} className="btn btn-outline-secondary btn-sm flex-grow-1">👁️ View</Link>
                </>
            ) : (
                <>
                    <Link to={`/event/${event._id}/details`} className="btn btn-outline-primary btn-sm flex-grow-1">📋 Details</Link>
                    <Link to={`/event/${event._id}/analytics`} className="btn btn-dark btn-sm flex-grow-1">📊 Analytics</Link>
                </>
            )}
        </Card.Footer>
    </Card>
);

const getStatusVariant = (status) => {
    switch (status) {
        case 'Draft': return 'warning';
        case 'Published': return 'primary';
        case 'Scheduled': return 'success';
        case 'Ongoing': return 'danger';
        case 'Completed': return 'secondary';
        case 'Cancelled': return 'dark';
        case 'Closed': return 'dark';
        default: return 'secondary';
    }
};

export default OrganizerDashboard;