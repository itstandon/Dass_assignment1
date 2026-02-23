import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Table, Button, Alert, Spinner } from 'react-bootstrap';
// import { CSVLink } from 'react-csv'; // Assuming react-csv might be available or we can implement simple download

const EventAnalytics = () => {
    const { id } = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');

                const res = await axios.get(`/api/events/${id}/participants`, {
                    headers: { 'x-auth-token': token }
                });

                setAnalytics(res.data.analytics);
                setParticipants(res.data.participants);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load analytics.');
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [id]);

    const downloadCSV = () => {
        // Simple CSV generation
        if (!participants.length) return;

        const headers = ['Name,Email,Registration Date,Status,Attendance\n'];
        const rows = participants.map(p => {
            const part = p.participant;
            return `${part.firstName} ${part.lastName},${part.email},${new Date(p.registrationDate).toLocaleDateString()},${p.paymentStatus},${p.attendanceStatus}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `participants_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Event Analytics</h2>

            {/* Analytics Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Registrations</Card.Title>
                            <h3>{analytics?.totalRegistrations}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Revenue</Card.Title>
                            <h3>₹{analytics?.revenue}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Attendance Rate</Card.Title>
                            <h3>{analytics?.attendanceRate}%</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Status</Card.Title>
                            <h3>{analytics?.status}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Participants Table */}
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Participant List</h5>
                    <Button variant="success" size="sm" onClick={downloadCSV}>
                        Download CSV
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Table responsive striped hover>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Registration Date</th>
                                <th>Status</th>
                                <th>Attendance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((reg) => (
                                <tr key={reg._id}>
                                    <td>{reg.participant ? `${reg.participant.firstName} ${reg.participant.lastName}` : 'N/A'}</td>
                                    <td>{reg.participant ? reg.participant.email : 'N/A'}</td>
                                    <td>{new Date(reg.registrationDate).toLocaleDateString()}</td>
                                    <td>{reg.paymentStatus}</td>
                                    <td>{reg.attendanceStatus}</td>
                                </tr>
                            ))}
                            {participants.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center">No participants yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EventAnalytics;
