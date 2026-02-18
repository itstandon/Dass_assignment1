const QRCode = require('qrcode');

/**
 * QR Code Service [Section 9.4: Ticket generation]
 * Generates visual QR codes for tickets
 */

/**
 * Generate QR code image as Data URL
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<String>} Data URL of QR code image
 */
exports.generateQRCodeDataUrl = async (data) => {
    try {
        const jsonString = JSON.stringify(data);
        
        // Generate QR code as data URL (PNG format)
        const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        return qrCodeDataUrl;
    } catch (err) {
        console.error('Error generating QR code:', err.message);
        throw err;
    }
};

/**
 * Generate QR code image as PNG buffer
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<Buffer>} PNG image buffer
 */
exports.generateQRCodeBuffer = async (data) => {
    try {
        const jsonString = JSON.stringify(data);
        
        // Generate QR code as PNG buffer
        const qrCodeBuffer = await QRCode.toBuffer(jsonString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        return qrCodeBuffer;
    } catch (err) {
        console.error('Error generating QR code buffer:', err.message);
        throw err;
    }
};

/**
 * Generate QR code as SVG string
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<String>} SVG string
 */
exports.generateQRCodeSVG = async (data) => {
    try {
        const jsonString = JSON.stringify(data);
        
        // Generate QR code as SVG
        const qrCodeSVG = await QRCode.toString(jsonString, {
            errorCorrectionLevel: 'H',
            type: 'svg',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        return qrCodeSVG;
    } catch (err) {
        console.error('Error generating QR code SVG:', err.message);
        throw err;
    }
};
