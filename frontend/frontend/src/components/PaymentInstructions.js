import React from 'react';

/**
 * PaymentInstructions Component
 * Displays payment details for merchandise purchases
 */
const PaymentInstructions = ({ event }) => {
    if (!event || event.eventType !== 'Merchandise') return null;
    
    const { paymentInstructions } = event;
    
    if (!paymentInstructions) {
        return (
            <div style={{ 
                padding: '15px', 
                background: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h4 style={{ marginTop: 0, color: '#856404' }}>⚠️ Payment Instructions Not Available</h4>
                <p style={{ margin: 0, color: '#856404' }}>
                    Please contact the organizer for payment details.
                </p>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px', 
            background: '#e7f3ff', 
            border: '2px solid #2196f3', 
            borderRadius: '8px',
            marginBottom: '20px'
        }}>
            <h4 style={{ marginTop: 0, color: '#1976d2' }}>💰 Payment Instructions</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Please complete the payment using any of the following methods and upload the payment proof below:
            </p>

            <div style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '6px',
                marginBottom: '15px'
            }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Option 1: UPI Payment (Recommended)</h5>
                {paymentInstructions.upiId ? (
                    <div style={{ marginLeft: '10px' }}>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>UPI ID:</strong> 
                            <code style={{ 
                                background: '#f5f5f5', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                marginLeft: '10px',
                                fontSize: '15px',
                                fontWeight: 'bold',
                                color: '#2196f3'
                            }}>
                                {paymentInstructions.upiId}
                            </code>
                        </p>
                        <p style={{ margin: '5px 0 5px 10px', fontSize: '13px', color: '#666' }}>
                            Use Google Pay, PhonePe, Paytm, or any UPI app
                        </p>
                    </div>
                ) : (
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#999' }}>UPI details not provided</p>
                )}
            </div>

            {paymentInstructions.accountNumber && (
                <div style={{ 
                    background: 'white', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Option 2: Bank Transfer</h5>
                    <div style={{ marginLeft: '10px', fontSize: '14px' }}>
                        {paymentInstructions.accountHolderName && (
                            <p style={{ margin: '5px 0' }}>
                                <strong>Account Name:</strong> {paymentInstructions.accountHolderName}
                            </p>
                        )}
                        <p style={{ margin: '5px 0' }}>
                            <strong>Account Number:</strong> 
                            <code style={{ 
                                background: '#f5f5f5', 
                                padding: '2px 6px', 
                                borderRadius: '3px',
                                marginLeft: '10px'
                            }}>
                                {paymentInstructions.accountNumber}
                            </code>
                        </p>
                    </div>
                </div>
            )}

            {paymentInstructions.additionalNotes && (
                <div style={{ 
                    background: '#fffbea', 
                    padding: '12px', 
                    borderRadius: '6px',
                    borderLeft: '4px solid #ffc107'
                }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                        <strong>📌 Note:</strong> {paymentInstructions.additionalNotes}
                    </p>
                </div>
            )}

            <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                background: '#d4edda', 
                borderRadius: '6px',
                borderLeft: '4px solid #28a745'
            }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#155724' }}>
                    ✅ <strong>After payment:</strong> Take a screenshot of the transaction and upload it below. 
                    Your order will be confirmed once the organizer verifies your payment.
                </p>
            </div>
        </div>
    );
};

export default PaymentInstructions;
