const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkOrganizers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Check all users with role Organizer
        const organizers = await User.find({ role: 'Organizer' });
        console.log('\nTotal Organizers in DB:', organizers.length);
        
        if (organizers.length > 0) {
            console.log('\nOrganizers:');
            organizers.forEach((org, i) => {
                console.log(`\n${i + 1}. ${org.organizerName || 'NO NAME'}`);
                console.log(`   Email: ${org.email}`);
                console.log(`   Category: ${org.category || 'NO CATEGORY'}`);
                console.log(`   Description: ${org.description || 'NO DESCRIPTION'}`);
                console.log(`   isArchived: ${org.isArchived} (type: ${typeof org.isArchived})`);
            });
        }
        
        // Check non-archived organizers
        const nonArchivedOrgs = await User.find({ role: 'Organizer', isArchived: false });
        console.log(`\nNon-archived Organizers: ${nonArchivedOrgs.length}`);
        
        // Check with $ne
        const notArchived = await User.find({ role: 'Organizer', isArchived: { $ne: true } });
        console.log(`Organizers where isArchived != true: ${notArchived.length}`);
        
        // Check undefined or false
        const undefinedOrFalse = await User.find({ 
            role: 'Organizer', 
            $or: [
                { isArchived: false },
                { isArchived: { $exists: false } },
                { isArchived: null }
            ]
        });
        console.log(`Organizers with isArchived false/undefined/null: ${undefinedOrFalse.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOrganizers();
