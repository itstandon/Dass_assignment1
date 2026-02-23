/**
 * Email Service [Section 9.5: Email Notifications]
 * Handles sending confirmation emails to participants
 */

const nodemailer = require('nodemailer');

// Configure transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify connection on startup (non-blocking)
transporter.verify((error, success) => {
    if (error) {
        console.warn('⚠️ Email service connection failed (non-critical):', error.message);
        console.warn('   Email notifications will be disabled, but app will continue working');
        console.warn('   To fix: Set up .env with Gmail credentials');
    } else {
        console.log('✅ Email service connected successfully!');
    }
});

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME || 'Felicity Event Management'} <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        return true;
    } catch (err) {
        console.error('❌ Failed to send email:', err.message);
        console.error('   Full error:', err);
        console.error('   Possible causes:');
        console.error('   - Gmail app password not set correctly in .env');
        console.error('   - 2FA not enabled on Gmail account');
        console.error('   - Network/firewall blocking SMTP connection');
        console.error('   - Invalid email address');
        return false;
    }
};

// Registration Confirmation Email
const sendRegistrationConfirmation = async (participant, event, ticketId, qrCode, qrCodeDataUrl = null) => {
    const subject = `✅ Registration Confirmed - ${event.title}`;

    // Generate QR code image URL using free API
    const qrCodeString = typeof qrCode === 'string' ? qrCode : JSON.stringify(qrCode);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeString)}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .header { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 15px; }
                .ticket-box { background: #e7f3ff; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
                .ticket-id { font-size: 18px; font-weight: bold; color: #333; }
                .event-details { margin: 20px 0; }
                .event-details p { margin: 8px 0; }
                .qr-section { text-align: center; background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px dashed #667eea; }
                .qr-section img { width: 250px; height: 250px; border: 2px solid #333; padding: 10px; background: white; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
                .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Registration Confirmed!</h1>
                </div>

                <p>Dear <strong>${participant.firstName} ${participant.lastName}</strong>,</p>

                <p>Congratulations! Your registration for the following event has been confirmed:</p>

                <div class="event-details">
                    <h3>${event.title}</h3>
                    <p><strong>📅 Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                    <p><strong>⏰ Time:</strong> ${new Date(event.startDate).toLocaleTimeString()}</p>
                    <p><strong>📍 Location:</strong> ${event.location || 'TBD'}</p>
                    <p><strong>🎯 Category:</strong> ${event.category || event.eventType}</p>
                </div>

                <div class="ticket-box">
                    <p style="margin: 0; color: #666; font-size: 12px;">YOUR TICKET ID</p>
                    <p class="ticket-id">${ticketId}</p>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">🔒 Keep this safe - you'll need it for check-in</p>
                </div>

                <div class="qr-section">
                    <h4>📱 Your QR Code</h4>
                    <p style="font-size: 12px; color: #666;">Scan this code at check-in for verification</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${qrCodeImageUrl}" alt="Event QR Code" style="width: 280px; height: 280px; border: 3px solid #333; padding: 10px; background-color: #ffffff; display: block; margin: 0 auto;" />
                    </div>
                    <p style="font-size: 11px; color: #999; margin-top: 10px;">👆 Scan with your phone camera</p>
                </div>

                <div style="margin: 20px 0;">
                    <p><strong>✅ Registration Status:</strong> CONFIRMED</p>
                    <p><strong>📧 Registered Email:</strong> ${participant.email}</p>
                    <p><strong>👤 Participant Type:</strong> ${participant.participantType === 'IIIT' ? 'IIIT Student' : 'Non-IIIT Participant'}</p>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4>📋 What's Next?</h4>
                    <ul>
                        <li>Save your ticket ID for check-in</li>
                        <li>Make note of the event date and time</li>
                        <li>Arrive 15 minutes early for check-in</li>
                        <li>Bring a valid ID if required</li>
                    </ul>
                </div>

                <p>If you have any questions about this event, please contact the organizer: <strong>${event.organizer?.organizerName || 'Event Team'}</strong></p>

                <p style="margin-top: 20px;">Best regards,<br><strong>Felicity Event Management System</strong></p>

                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>For support, contact your event organizer.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(participant.email, subject, htmlContent);
};

// Merchandise Purchase Confirmation Email
const sendPurchaseConfirmation = async (participant, event, ticketId, quantity, variantSize, variantColor, totalAmount, qrCodeData = null) => {
    const subject = `✅ Purchase Confirmed - ${event.title}`;

    // Generate QR code image URL using free API
    const qrCodeJson = qrCodeData || { ticketId, type: 'Merchandise', quantity, size: variantSize, color: variantColor };
    const qrCodeString = JSON.stringify(qrCodeJson);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeString)}`;

    console.log('📧 Generating purchase confirmation email...');
    console.log(`   Participant: ${participant.email}`);
    console.log(`   Ticket ID: ${ticketId}`);
    console.log(`   QR Code URL: ${qrCodeImageUrl}`);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 15px; margin-bottom: 20px; }
                .ticket-box { background: #e7f3ff; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
                .qr-section { text-align: center; background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px dashed #667eea; }
                .qr-section img { width: 280px; height: 280px; border: 3px solid #333; padding: 10px; background: white; display: block; margin: 15px auto; }
                .order-details { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                .order-total { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; color: #667eea; border-top: 2px solid #667eea; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🛒 Purchase Confirmed!</h1>
                </div>

                <p>Dear <strong>${participant.firstName} ${participant.lastName}</strong>,</p>

                <p>Thank you for your purchase! Here are your order details:</p>

                <div class="ticket-box">
                    <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">YOUR TICKET ID</p>
                    <p style="font-size: 20px; font-weight: bold; color: #333; margin: 10px 0; font-family: monospace;">${ticketId}</p>
                    <p style="margin: 0; color: #666; font-size: 12px;">🔒 Use this for order tracking</p>
                </div>

                <div class="qr-section">
                    <h3 style="margin-top: 0; color: #667eea;">📱 Your QR Code</h3>
                    <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Scan this code at pickup for verification</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${qrCodeImageUrl}" alt="Order QR Code" title="Scan with phone camera" style="width: 280px; height: 280px; border: 3px solid #333; padding: 10px; background-color: #ffffff; display: block; margin: 0 auto;" />
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">👆 Scan with your phone camera</p>
                </div>

                <h3 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">${event.title}</h3>

                <div class="order-details">
                    <div class="order-row">
                        <span style="font-weight: bold;">Merchandise:</span>
                        <span>${event.title}</span>
                    </div>
                    <div class="order-row">
                        <span style="font-weight: bold;">Quantity:</span>
                        <span>${quantity}</span>
                    </div>
                    ${variantSize ? `<div class="order-row"><span style="font-weight: bold;">Size:</span><span>${variantSize}</span></div>` : ''}
                    ${variantColor ? `<div class="order-row"><span style="font-weight: bold;">Color:</span><span>${variantColor}</span></div>` : ''}
                    <div class="order-row">
                        <span style="font-weight: bold;">Unit Price:</span>
                        <span>₹${event.price}</span>
                    </div>
                    <div class="order-total">
                        <span>Total Amount:</span>
                        <span>₹${totalAmount}</span>
                    </div>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h4 style="color: #28a745; margin-top: 0;">📦 Pickup/Delivery Information</h4>
                    <p style="margin: 8px 0;"><strong>Event Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                    <p style="margin: 8px 0;"><strong>Pickup Location:</strong> ${event.location || 'Event Venue'}</p>
                    <p style="color: #d9534f; margin-top: 12px;">⚠️ <strong>Bring your Ticket ID for pickup verification</strong></p>
                </div>

                <p style="color: #555; font-size: 14px;">If you have any questions about your purchase, please contact: <strong>${event.organizer?.organizerName || 'Event Team'}</strong></p>

                <p style="margin-top: 20px; font-size: 14px;">Thank you for your support!<br><strong>Felicity Event Management System</strong></p>

                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>For support, contact your event organizer.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(participant.email, subject, htmlContent);
};

module.exports = {
    sendEmail,
    sendRegistrationConfirmation,
    sendPurchaseConfirmation
};
