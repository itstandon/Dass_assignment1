import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';

const DiscussionForum = ({ eventId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posting, setPosting] = useState(false);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const messagesEndRef = useRef(null);
    const lastVisitRef = useRef(new Date().toISOString());
    const pollingInterval = useRef(null);

    const userRole = localStorage.getItem('role');

    useEffect(() => {
        fetchMessages();
        
        // Set up polling for real-time updates (every 5 seconds)
        pollingInterval.current = setInterval(() => {
            fetchMessages(true); // Silent refresh
            fetchUnreadCount();
        }, 5000);

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [eventId]);

    const fetchMessages = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/forum/${eventId}/messages`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
            if (!silent) setLoading(false);
            
            // Update last visit time
            lastVisitRef.current = new Date().toISOString();
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
            if (!silent) {
                setError(err.response?.data?.msg || 'Failed to load messages');
                setLoading(false);
            }
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `/api/forum/${eventId}/unread-count?lastVisit=${lastVisitRef.current}`,
                { headers: { 'x-auth-token': token } }
            );
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setPosting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `/api/forum/${eventId}/messages`,
                { 
                    message: newMessage,
                    isAnnouncement,
                    parentMessageId: replyingTo?._id
                },
                { headers: { 'x-auth-token': token } }
            );

            setNewMessage('');
            setIsAnnouncement(false);
            setReplyingTo(null);
            fetchMessages();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to post message');
        } finally {
            setPosting(false);
        }
    };

    const handleTogglePin = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/forum/messages/${messageId}/pin`,
                {},
                { headers: { 'x-auth-token': token } }
            );
            fetchMessages();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to pin message');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/forum/messages/${messageId}`, {
                headers: { 'x-auth-token': token }
            });
            fetchMessages();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete message');
        }
    };

    const handleReaction = async (messageId, reactionType) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/forum/messages/${messageId}/react`,
                { reactionType },
                { headers: { 'x-auth-token': token } }
            );
            fetchMessages(true); // Silent refresh
        } catch (err) {
            console.error(err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const renderMessage = (msg, isReply = false) => {
        if (msg.isDeleted && userRole !== 'Organizer') return null;

        const userId = localStorage.getItem('userId') || '';
        const hasLiked = msg.reactions?.like?.includes(userId);
        const hasHelpful = msg.reactions?.helpful?.includes(userId);
        const hasQuestion = msg.reactions?.question?.includes(userId);

        return (
            <div
                key={msg._id}
                style={{
                    marginBottom: isReply ? '10px' : '15px',
                    marginLeft: isReply ? '30px' : '0',
                    padding: '15px',
                    background: msg.isDeleted ? '#f8d7da' : msg.isAnnouncement ? '#fff3cd' : msg.isPinned ? '#d1ecf1' : '#f8f9fa',
                    borderRadius: '8px',
                    border: `2px solid ${msg.isPinned ? '#0dcaf0' : msg.isAnnouncement ? '#ffc107' : '#dee2e6'}`
                }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong>{msg.authorName}</strong>
                        <Badge bg={msg.authorRole === 'Organizer' ? 'primary' : 'secondary'} className="ms-2">
                            {msg.authorRole}
                        </Badge>
                        {msg.isAnnouncement && <Badge bg="warning" text="dark" className="ms-1">📢 Announcement</Badge>}
                        {msg.isPinned && <Badge bg="info" className="ms-1">📌 Pinned</Badge>}
                        {msg.isDeleted && <Badge bg="danger" className="ms-1">🗑️ Deleted</Badge>}
                    </div>
                    <small className="text-muted">
                        {new Date(msg.createdAt).toLocaleString()}
                    </small>
                </div>

                {/* Parent reference if this is a reply */}
                {msg.parentMessage && msg.parentMessage.message && (
                    <div style={{ 
                        padding: '5px 10px', 
                        background: '#e9ecef', 
                        borderRadius: '4px',
                        marginBottom: '10px',
                        fontSize: '12px'
                    }}>
                        <strong>Replying to:</strong> {msg.parentMessage.authorName || 'Someone'}: "{msg.parentMessage.message.substring(0, 50)}..."
                    </div>
                )}

                {/* Message content */}
                <p style={{ marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                </p>

                {/* Reactions and Actions */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                        <Button
                            size="sm"
                            variant={hasLiked ? 'primary' : 'outline-primary'}
                            onClick={() => handleReaction(msg._id, 'like')}
                            style={{ fontSize: '12px' }}
                        >
                            👍 {msg.reactions?.like?.length || 0}
                        </Button>
                        <Button
                            size="sm"
                            variant={hasHelpful ? 'success' : 'outline-success'}
                            onClick={() => handleReaction(msg._id, 'helpful')}
                            style={{ fontSize: '12px' }}
                        >
                            ✅ {msg.reactions?.helpful?.length || 0}
                        </Button>
                        <Button
                            size="sm"
                            variant={hasQuestion ? 'warning' : 'outline-warning'}
                            onClick={() => handleReaction(msg._id, 'question')}
                            style={{ fontSize: '12px' }}
                        >
                            ❓ {msg.reactions?.question?.length || 0}
                        </Button>
                    </div>

                    <div className="d-flex gap-2">
                        {!isReply && (
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => {
                                    setReplyingTo(msg);
                                    scrollToBottom();
                                }}
                            >
                                💬 Reply
                            </Button>
                        )}
                        {userRole === 'Organizer' && !msg.isDeleted && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline-info"
                                    onClick={() => handleTogglePin(msg._id)}
                                >
                                    {msg.isPinned ? '📌 Unpin' : '📌 Pin'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteMessage(msg._id)}
                                >
                                    🗑️ Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Render replies */}
                {msg.replies && msg.replies.length > 0 && (
                    <div style={{ marginTop: '15px', borderLeft: '3px solid #dee2e6', paddingLeft: '10px' }}>
                        {msg.replies.map(reply => renderMessage(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="text-center p-4"><Spinner animation="border" /></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    💬 Discussion Forum
                    {unreadCount > 0 && (
                        <Badge bg="danger" className="ms-2">
                            {unreadCount} new
                        </Badge>
                    )}
                </h5>
                <Button size="sm" variant="outline-secondary" onClick={() => fetchMessages()}>
                    🔄 Refresh
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {/* Messages List */}
            <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '20px' }}>
                {messages.length === 0 ? (
                    <Alert variant="info">No messages yet. Be the first to start the discussion!</Alert>
                ) : (
                    messages
                        .filter(msg => !msg.parentMessage) // Only show top-level messages
                        .map(msg => renderMessage(msg))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Post Message Form */}
            <Card>
                <Card.Body>
                    {replyingTo && (
                        <Alert variant="info" dismissible onClose={() => setReplyingTo(null)}>
                            <strong>Replying to {replyingTo.authorName}:</strong> "{replyingTo.message.substring(0, 100)}..."
                        </Alert>
                    )}

                    <Form onSubmit={handlePostMessage}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={replyingTo ? "Write your reply..." : "Write your message..."}
                                maxLength={1000}
                                required
                            />
                            <Form.Text className="text-muted">
                                {newMessage.length}/1000 characters
                            </Form.Text>
                        </Form.Group>

                        {userRole === 'Organizer' && !replyingTo && (
                            <Form.Check
                                type="checkbox"
                                label="📢 Post as Announcement"
                                checked={isAnnouncement}
                                onChange={(e) => setIsAnnouncement(e.target.checked)}
                                className="mb-3"
                            />
                        )}

                        <div className="d-flex gap-2">
                            <Button variant="primary" type="submit" disabled={posting || !newMessage.trim()}>
                                {posting ? 'Posting...' : replyingTo ? '💬 Post Reply' : '📤 Post Message'}
                            </Button>
                            {replyingTo && (
                                <Button variant="secondary" onClick={() => setReplyingTo(null)}>
                                    Cancel Reply
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default DiscussionForum;
