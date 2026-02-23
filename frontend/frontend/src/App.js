/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails'; // Section 9.4
import ParticipantDashboard from './components/ParticipantDashboard'; // Section 9.2
import Clubs from './components/Clubs'; // Section 9.3
import Profile from './components/Profile'; // User profile
// import CreateEvent from './components/CreateEvent';
import CreateEventAdvanced from './components/CreateEventAdvanced'; // Section 8
import AdminDashboard from './components/AdminDashboard'; // Section 11
import EventAnalytics from './components/EventAnalytics'; // Section 10.3
import OrganizerDashboard from './components/OrganizerDashboard'; // Section 10.2
import OrganizerEventDetails from './components/OrganizerEventDetails'; // Section 10.3
import OngoingEvents from './components/OngoingEvents'; // Section 10.1
import QRScanner from './components/QRScanner'; // Tier A: QR Scanner
import AttendanceDashboard from './components/AttendanceDashboard'; // Tier A: Attendance Dashboard
import OrganizerPasswordReset from './components/OrganizerPasswordReset'; // Tier B: Password Reset
import AdminPasswordResetDashboard from './components/AdminPasswordResetDashboard'; // Tier B: Password Reset Admin

// Helper Component for Role-Based Access Control (Section 4.2)
const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (allowedRole && role !== allowedRole) {
        return <Navigate to="/" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Dashboards (Section 4.2 & 4.3) */}
                    <Route
                        path="/participant-dashboard"
                        element={
                            <ProtectedRoute allowedRole="Participant">
                                <ParticipantDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/browse-events"
                        element={
                            <ProtectedRoute allowedRole="Participant">
                                <EventList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/event/:id"
                        element={
                            <ProtectedRoute allowedRole="Participant">
                                <EventDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/organizer-dashboard"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <OrganizerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-event"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <CreateEventAdvanced />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/event/:id/details"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <OrganizerEventDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/event/:id/analytics"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <EventAnalytics />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute allowedRole="Admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/onboarding"
                        element={
                            <ProtectedRoute allowedRole="Participant">
                                <Onboarding />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/clubs"
                        element={
                            <ProtectedRoute allowedRole="Participant">
                                <Clubs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/ongoing-events"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <OngoingEvents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/password-reset"
                        element={
                            <ProtectedRoute allowedRole="Organizer">
                                <OrganizerPasswordReset />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/manage-clubs"
                        element={
                            <ProtectedRoute allowedRole="Admin">
                                <h1>🏛️ Manage Clubs/Organizers</h1>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/password-requests"
                        element={
                            <ProtectedRoute allowedRole="Admin">
                                <AdminPasswordResetDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Redirects */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<h2>404 - Page Not Found</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;