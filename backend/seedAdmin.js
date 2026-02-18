require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./db');

const seedAdmin = async () => {
    await connectDB();
    try {
        const adminExists = await User.findOne({ role: 'Admin' });
        if (!adminExists) {
            const admin = new User({
                email: 'admin@iiit.ac.in', // Admin is the first user [cite: 38]
                password: 'SuperSecurePassword123', // Will be hashed by the User model's pre-save hook [cite: 42]
                role: 'Admin'
            });
            await admin.save();
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin already exists.');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
