const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const checkUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        console.log('User found:');
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Password Hash:', user.password);
        console.log('Password Hash Length:', user.password.length);
        
        // Test if password matches
        const testPassword = '1234567';
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`\nDoes '1234567' match? ${isMatch}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const email = process.argv[2] || 'arushi.tandon@research.iiit.ac.in';
checkUser(email);
