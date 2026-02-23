import React, { useState, useRef, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import jsQR from 'jsqr';
import { Link } from 'react-router-dom';

const QRScanner = ({ eventId }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const animationFrameRef = useRef(null);
    const isScanningRef = useRef(false);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedList, setScannedList] = useState([]); 
    const [failedList, setFailedList] = useState([]);   
    const [lastScan, setLastScan] = useState(null);     
    const [feedback, setFeedback] = useState(null);     

    const DUPLICATE_SCAN_DELAY = 2000; 

    useEffect(() => {
        isScanningRef.current = isScanning;
        if (isScanning && !animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
        } else if (!isScanning && animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, [isScanning]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setFeedback(null);
            setIsCameraActive(true);
            setIsScanning(true);

            // Wait for DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready before playing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().catch(e => console.error("Play error:", e));
                    setFeedback({ type: 'info', msg: 'Camera active. Point at a QR code.' });
                    requestAnimationFrame(scanFrame);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setFeedback({ 
                type: 'error', 
                msg: `Could not access camera: ${err.message}. Ensure permission is granted.` 
            });
            setIsCameraActive(false);
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        setIsScanning(false);
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        setIsCameraActive(false);
        setFeedback({ type: 'info', msg: 'Camera stopped.' });
    };

    const scanFrame = () => {
        if (!isScanningRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code && code.data && code.data.trim() !== "") {
                handleQRDetected(code.data);
            }
        }

        if (isScanningRef.current) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
    };

    const handleQRDetected = async (qrData) => {
        if (!qrData || !qrData.trim()) return;
        
        let ticketId = qrData.trim();

        // Attempt to parse JSON if QR data is a JSON object
        if (ticketId.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(ticketId);
                // Prefer ticketId, otherwise look for registrationId or id
                if (parsed.ticketId) {
                    ticketId = String(parsed.ticketId);
                } else if (parsed.registrationId) {
                     ticketId = String(parsed.registrationId);
                } else if (parsed._id) {
                     ticketId = String(parsed._id);
                }
            } catch (e) {
                // Ignore parse error, treat as raw string
            }
        }

        const now = Date.now();
        // Prevent duplicate scans
        if (lastScan && lastScan.id === ticketId && (now - lastScan.timestamp < DUPLICATE_SCAN_DELAY)) {
             return; 
        }

        setLastScan({ id: ticketId, timestamp: now });
        await processAttendance(ticketId, 'Camera');
    };

    const processAttendance = async (ticketId, source) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setFeedback({ type: 'error', msg: 'Authentication lost. Please login again.' });
                return;
            }
            
            // Check if we already processed this successfully recently to avoid UI spam
            if (scannedList.some(s => s.id === ticketId && (Date.now() - new Date(s.rawTime).getTime() < 30000))) {
                setFeedback({ type: 'warning', msg: `Already scanned: ${ticketId}` });
                return;
            }

            setFeedback({ type: 'info', msg: `Processing ticket...` });

            const response = await axios.post('/api/attendance/scan', {
                registrationId: ticketId,
                eventId: eventId,
                deviceInfo: source
            }, {
                headers: { 'x-auth-token': token }
            });

            const participantName = response.data.attendance?.participantName || 'Participant';
            setFeedback({ type: 'success', msg: `✅ Marked present: ${participantName}` });
            
            setScannedList(prev => [{
                id: ticketId,
                name: participantName,
                time: new Date().toLocaleTimeString(),
                rawTime: Date.now()
            }, ...prev]);

        } catch (err) {
            console.error("Attendance API Error:", err);
            const errMsg = err.response?.data?.msg || err.message || 'Failed to mark attendance';
            
            // If already registered, treat as success/info but show meaningful message
            if (errMsg.toLowerCase().includes('already')) {
                 setFeedback({ type: 'warning', msg: `⚠️ ${errMsg}` });
            } else {
                 setFeedback({ type: 'error', msg: `❌ ${errMsg}` });
                 setFailedList(prev => [{
                    id: ticketId,
                    error: errMsg,
                    time: new Date().toLocaleTimeString()
                }, ...prev]);
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so same file can be selected again
        e.target.value = null;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    handleQRDetected(code.data);
                } else {
                    setFeedback({ type: 'error', msg: 'No QR code found in the image.' });
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fas fa-qrcode me-2"></i>QR Scanner
                    </h5>
                    <Link to={`/admin/events/${eventId}/participants`} className="btn btn-light btn-sm fw-bold">
                        <i className="fas fa-table me-1"></i> View List
                    </Link>
                </div>
                
                <div className="card-body">
                    <div className="row justify-content-center mb-4">
                        <div className="col-lg-8 col-md-10">
                            <div className="border rounded bg-dark d-flex align-items-center justify-content-center position-relative" 
                                 style={{ minHeight: '320px', overflow: 'hidden' }}>
                                
                                {isCameraActive ? (
                                    <>
                                        <video 
                                            ref={videoRef} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            muted 
                                            playsInline 
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '200px',
                                            height: '200px',
                                            border: '4px solid rgba(0, 255, 0, 0.5)',
                                            borderRadius: '16px',
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                                        }}></div>
                                        <div className="position-absolute top-0 start-0 m-2">
                                            <span className="badge bg-danger">● LIVE</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-white p-4">
                                        <i className="fas fa-camera fa-3x mb-3 text-secondary"></i>
                                        <p className="mb-0">Camera is inactive</p>
                                        <small className="text-muted">Click "Start Camera" to begin scanning</small>
                                    </div>
                                )}
                                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center mb-4">
                        <div className="col-md-8 d-flex justify-content-center gap-3 flex-wrap">
                            {!isCameraActive ? (
                                <button className="btn btn-success btn-lg px-4" onClick={startCamera}>
                                    <i className="fas fa-play me-2"></i> Start Camera
                                </button>
                            ) : (
                                <button className="btn btn-danger btn-lg px-4" onClick={stopCamera}>
                                    <i className="fas fa-stop me-2"></i> Stop Camera
                                </button>
                            )}
                            
                            <button className="btn btn-outline-primary btn-lg px-4" onClick={() => fileInputRef.current?.click()}>
                                <i className="fas fa-upload me-2"></i> Upload Image
                            </button>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleFileUpload} 
                            />
                        </div>
                    </div>

                    {feedback && (
                        <div className={`alert alert-${feedback.type === 'error' ? 'danger' : feedback.type === 'success' ? 'success' : 'info'} text-center mb-4 shadow-sm`} role="alert">
                            <h5 className="alert-heading mb-1">
                                {feedback.msg}
                            </h5>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <div className="card h-100 border-success">
                                <div className="card-header bg-success text-white py-1">
                                    <small className="fw-bold">Recent Success ({scannedList.length})</small>
                                </div>
                                <ul className="list-group list-group-flush small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {scannedList.length === 0 ? (
                                        <li className="list-group-item text-muted text-center py-3">No scans yet</li>
                                    ) : (
                                        scannedList.map((item, idx) => (
                                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <span>
                                                    <i className="fas fa-user-check text-success me-2"></i>
                                                    <strong>{item.name}</strong>
                                                </span>
                                                <span className="text-muted" style={{ fontSize: '0.8em' }}>{item.time}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <div className="card h-100 border-danger">
                                <div className="card-header bg-danger text-white py-1">
                                    <small className="fw-bold">Recent Failures ({failedList.length})</small>
                                </div>
                                <ul className="list-group list-group-flush small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {failedList.length === 0 ? (
                                        <li className="list-group-item text-muted text-center py-3">No failed scans</li>
                                    ) : (
                                        failedList.map((item, idx) => (
                                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-light">
                                                <span className="text-truncate" style={{ maxWidth: '150px' }}>
                                                    {item.error}
                                                </span>
                                                <span className="badge bg-secondary">{item.id.substring(0,8)}...</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
