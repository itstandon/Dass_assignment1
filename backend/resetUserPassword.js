const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const resetPassword = async (email, newPassword) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        // Set password as plaintext - pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        console.log(`Password reset successfully for ${email}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Usage: node resetUserPassword.js <email> <newPassword>
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Usage: node resetUserPassword.js <email> <newPassword>');
    process.exit(1);
}

resetPassword(email, newPassword);
