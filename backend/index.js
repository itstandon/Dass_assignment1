require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Import Models - Register schemas before using them
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing JSON request bodies

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes')); // Section 9: Event Registration
app.use('/api/user', require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.send('Felicity EMS API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
