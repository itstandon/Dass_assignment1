import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const OngoingEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOngoingEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/events/organizer/my-events', {
                    headers: { 'x-auth-token': token }
                });

                // Filter only ongoing events
                const ongoingEvents = res.data.filter(e => e.status === 'Ongoing');
                setEvents(ongoingEvents);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load ongoing events');
                setLoading(false);
            }
        };

        fetchOngoingEvents();
    }, []);

    if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">🔔 My Ongoing Events</h2>

            {events.length > 0 ? (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {events.map(event => (
                        <Col key={event._id}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge bg={event.eventType === 'Normal' ? 'info' : 'warning'}>{event.eventType}</Badge>
                                        <Badge bg="danger">Ongoing</Badge>
                                    </div>
                                    <Card.Title>{event.title}</Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        Start: {new Date(event.startDate).toLocaleDateString()} <br />
                                        End: {new Date(event.endDate).toLocaleDateString()}
                                    </Card.Text>
                                    <Card.Text className="text-truncate">
                                        {event.description}
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer className="bg-white border-top-0 d-flex justify-content-between gap-2">
                                    <Link to={`/event/${event._id}/details`} className="btn btn-outline-primary btn-sm flex-grow-1">
                                        📋 Details
                                    </Link>
                                    <Link to={`/event/${event._id}/analytics`} className="btn btn-dark btn-sm flex-grow-1">
                                        📊 Analytics
                                    </Link>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Alert variant="info">
                    No ongoing events at the moment. <Link to="/organizer-dashboard">Go back to dashboard</Link>
                </Alert>
            )}
        </Container>
    );
};

export default OngoingEvents;
