const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Core Fields for all users [cite: 56]
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Must be hashed [cite: 42]
    role: { 
        type: String, 
        enum: ['Participant', 'Organizer', 'Admin'], // Role switching strictly prohibited [cite: 19]
        required: true 
    },

    // Participant Specific Fields [cite: 57, 58, 59, 60, 61]
    firstName: { type: String }, 
    lastName: { type: String },
    contactNumber: { type: String }, // Section 6.1: Contact Number
    college: { type: String }, // Section 6.1: College/Org Name
    participantType: { 
        type: String, 
        enum: ['IIIT', 'Non-IIIT'], 
        required: function() { return this.role === 'Participant'; } 
    },

    // Organizer Specific Fields [cite: 62, 63, 64, 65, 66, 68, 69]
    organizerName: { type: String },
    category: { type: String },
    contactNumber: { type: String },
    contactEmail: { type: String },
    description: { type: String },
    discordWebhookUrl: { type: String }, // For Organizer notifications [Section 10.5]
    isArchived: { type: Boolean, default: false }, // Section 11.2: Archive organizer (disable login)
    
    // Preferences (Participants only) [cite: 48, 49, 54]
    interests: [{ type: String }],
    followedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Section 5: Onboarding Status
    onboardingCompleted: { type: Boolean, default: false }
});

// Security: Password hashing before saving [cite: 41, 42]
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
