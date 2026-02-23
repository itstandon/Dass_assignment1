import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

/**
 * PaymentApprovalDashboard Component
 * Allows organizers to view and approve/reject payment proofs
 * [8 Marks Feature - Merchandise Payment Approval Workflow]
 */
const PaymentApprovalDashboard = ({ eventId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | pending | approved | rejected
    const [selectedImage, setSelectedImage] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [eventId]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/payments/event/${eventId}/pending`, {
                headers: { 'x-auth-token': token }
            });
            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch payment orders:', err);
            setLoading(false);
        }
    };

    const handleApprove = async (registrationId) => {
        if (!window.confirm('Approve this payment? This will generate a ticket and QR code.')) return;

        setProcessingId(registrationId);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/payments/${registrationId}/approve`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('✅ Payment approved! Ticket sent to participant.');
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to approve payment');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (registrationId) => {
        const reason = window.prompt('Reason for rejection (optional):');
        if (reason === null) return; // User cancelled

        setProcessingId(registrationId);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/payments/${registrationId}/reject`, 
                { reason: reason || 'Payment proof rejected by organizer' },
                { headers: { 'x-auth-token': token } }
            );
            alert('❌ Payment rejected. Stock refunded.');
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to reject payment');
        } finally {
            setProcessingId(null);
        }
    };

    const filterOrders = () => {
        if (filter === 'pending') return orders.filter(o => o.paymentStatus === 'pending');
        if (filter === 'approved') return orders.filter(o => o.paymentStatus === 'approved');
        if (filter === 'rejected') return orders.filter(o => o.paymentStatus === 'rejected');
        return orders;
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading payment orders...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>💳 Payment Approval Dashboard</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Review and approve payment proofs for merchandise orders. Total orders: {orders.length}
            </p>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'all' ? '#667eea' : '#f0f0f0',
                        color: filter === 'all' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    All ({orders.length})
                </button>
                <button 
                    onClick={() => setFilter('pending')}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'pending' ? '#ff9800' : '#f0f0f0',
                        color: filter === 'pending' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Pending ({orders.filter(o => o.paymentStatus === 'pending').length})
                </button>
                <button 
                    onClick={() => setFilter('approved')}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'approved' ? '#28a745' : '#f0f0f0',
                        color: filter === 'approved' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Approved ({orders.filter(o => o.paymentStatus === 'approved').length})
                </button>
                <button 
                    onClick={() => setFilter('rejected')}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'rejected' ? '#dc3545' : '#f0f0f0',
                        color: filter === 'rejected' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Rejected ({orders.filter(o => o.paymentStatus === 'rejected').length})
                </button>
            </div>

            {/* Orders List */}
            {filterOrders().length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#999' }}>
                    No orders found in this category
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {filterOrders().map(order => (
                        <div 
                            key={order._id}
                            style={{
                                padding: '15px',
                                border: `2px solid ${order.paymentStatus === 'pending' ? '#ff9800' : order.paymentStatus === 'approved' ? '#28a745' : '#dc3545'}`,
                                borderRadius: '8px',
                                background: '#fff'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 10px 0' }}>
                                        {order.participant?.firstName} {order.participant?.lastName}
                                    </h4>
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                        <strong>Email:</strong> {order.participant?.email}
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                        <strong>Phone:</strong> {order.participant?.contactNumber || 'N/A'}
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                        <strong>Quantity:</strong> {order.quantity} | 
                                        <strong> Amount:</strong> ₹{order.totalAmount}
                                    </p>
                                    {order.variantSize && (
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>Variant:</strong> {order.variantSize} / {order.variantColor}
                                        </p>
                                    )}
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                        <strong>Status:</strong> 
                                        <span style={{
                                            marginLeft: '8px',
                                            padding: '3px 10px',
                                            background: order.paymentStatus === 'pending' ? '#ff9800' : order.paymentStatus === 'approved' ? '#28a745' : '#dc3545',
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {order.paymentStatus.toUpperCase()}
                                        </span>
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                                        <strong>Uploaded:</strong> {order.paymentProofUploadedAt ? new Date(order.paymentProofUploadedAt).toLocaleString() : 'N/A'}
                                    </p>
                                    {order.paymentStatus === 'rejected' && order.paymentRejectionReason && (
                                        <p style={{ margin: '10px 0', padding: '8px', background: '#f8d7da', borderRadius: '4px', fontSize: '13px', color: '#721c24' }}>
                                            <strong>Rejection Reason:</strong> {order.paymentRejectionReason}
                                        </p>
                                    )}
                                </div>

                                {/* Payment Proof Image */}
                                <div style={{ marginLeft: '20px', textAlign: 'center' }}>
                                    {order.paymentProof ? (
                                        <div>
                                            <img 
                                                src={order.paymentProof} 
                                                alt="Payment Proof" 
                                                style={{ 
                                                    width: '150px', 
                                                    height: '150px', 
                                                    objectFit: 'cover', 
                                                    border: '2px solid #ddd', 
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => setSelectedImage(order.paymentProof)}
                                            />
                                            <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Click to enlarge</p>
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            width: '150px', 
                                            height: '150px', 
                                            background: '#f0f0f0', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            borderRadius: '8px',
                                            color: '#999'
                                        }}>
                                            No proof uploaded
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {order.paymentStatus === 'pending' && (
                                        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleApprove(order._id)}
                                                disabled={processingId === order._id}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: processingId === order._id ? '#ccc' : '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: processingId === order._id ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(order._id)}
                                                disabled={processingId === order._id}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: processingId === order._id ? '#ccc' : '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: processingId === order._id ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'pointer'
                    }}
                >
                    <img 
                        src={selectedImage} 
                        alt="Payment Proof Enlarged" 
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }}
                    />
                </div>
            )}
        </div>
    );
};

export default PaymentApprovalDashboard;
