import React, { useState } from 'react';
import axios from '../utils/axiosConfig';

/**
 * PaymentProofUpload Component
 * Allows participants to upload payment proof for merchandise orders
 * [8 Marks Feature - Merchandise Payment Approval Workflow]
 */
const PaymentProofUpload = ({ registrationId, onUploadComplete }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
        setPreviewUrl(url);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // For now, we'll use a placeholder URL
        // In production, you'd upload to a service like Cloudinary or AWS S3
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
            setImageUrl(reader.result); // Base64 for demo purposes
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!imageUrl || !imageUrl.trim()) {
            setError('Please provide a payment proof image');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `/api/payments/${registrationId}/upload-proof`,
                { paymentProofUrl: imageUrl },
                { headers: { 'x-auth-token': token } }
            );

            setSuccess(true);
            setError(null);
            
            if (onUploadComplete) {
                onUploadComplete(response.data.registration);
            }

        } catch (err) {
            console.error('Payment proof upload error:', err);
            setError(err.response?.data?.msg || 'Failed to upload payment proof');
            setSuccess(false);
        } finally {
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div style={{ 
                padding: '20px', 
                background: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '8px', 
                color: '#155724',
                textAlign: 'center'
            }}>
                <h4>✅ Payment Proof Uploaded Successfully!</h4>
                <p>Your payment is now pending organizer approval. You will receive your ticket and QR code via email once approved.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', background: '#fff9e6', border: '2px solid #ffc107', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0, color: '#ff9800' }}>📤 Upload Payment Proof</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
                Please upload a screenshot or photo of your payment transaction to complete your order.
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Upload Image File:
                    </label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        style={{ padding: '8px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>Or provide image URL below</small>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Or Enter Image URL:
                    </label>
                    <input 
                        type="url" 
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="https://example.com/payment-screenshot.jpg"
                        style={{ padding: '10px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>

                {previewUrl && (
                    <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Preview:</p>
                        <img 
                            src={previewUrl} 
                            alt="Payment proof preview" 
                            style={{ maxWidth: '100%', maxHeight: '300px', border: '2px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                )}

                {error && (
                    <div style={{ 
                        padding: '10px', 
                        background: '#f8d7da', 
                        color: '#721c24', 
                        border: '1px solid #f5c6cb', 
                        borderRadius: '4px', 
                        marginBottom: '15px' 
                    }}>
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={uploading || !imageUrl}
                    style={{
                        padding: '12px 24px',
                        background: uploading || !imageUrl ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploading || !imageUrl ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        width: '100%',
                        fontSize: '16px'
                    }}
                >
                    {uploading ? '⏳ Uploading...' : '✅ Submit Payment Proof'}
                </button>
            </form>

            <div style={{ marginTop: '15px', padding: '10px', background: '#e7f3ff', borderRadius: '4px', fontSize: '13px' }}>
                <strong>💡 Tips:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    <li>Ensure the transaction ID and amount are clearly visible</li>
                    <li>Use a clear, high-quality image</li>
                    <li>Accepted formats: JPG, PNG, PDF</li>
                </ul>
            </div>
        </div>
    );
};

export default PaymentProofUpload;
