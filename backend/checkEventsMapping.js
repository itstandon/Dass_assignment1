const mongoose = require('mongoose');
require('dotenv').config();

const checkEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const Event = require('./models/Event');
        const User = require('./models/User');

        // Get all organizers
        const organizers = await User.find({ role: 'Organizer' }).select('_id organizerName');
        console.log('\n=== ORGANIZERS ===');
        organizers.forEach(org => {
            console.log(`${org.organizerName}: ${org._id}`);
        });

        // Get all events
        const events = await Event.find({}).select('title organizer date');
        console.log(`\n=== EVENTS (Total: ${events.length}) ===`);
        events.forEach(event => {
            console.log(`${event.title} - Organizer ID: ${event.organizer} - Date: ${event.date}`);
        });

        // Check which events belong to which organizer
        console.log('\n=== EVENTS BY ORGANIZER ===');
        for (const org of organizers) {
            const orgEvents = await Event.find({ organizer: org._id });
            console.log(`${org.organizerName} (${org._id}): ${orgEvents.length} events`);
            orgEvents.forEach(e => console.log(`  - ${e.title} (${e.date})`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkEvents();
