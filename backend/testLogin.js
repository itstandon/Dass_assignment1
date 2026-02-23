const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('https://cozy-magic-production.up.railway.app/api/auth/login', {
            email: 'arushi.tandon@research.iiit.ac.in',
            password: '1234567'
        });
        
        console.log('Login successful!');
        console.log('Token:', response.data.token);
        console.log('Role:', response.data.role);
    } catch (error) {
        console.log('Login failed!');
        console.log('Error:', error.response?.data || error.message);
    }
};

testLogin();
