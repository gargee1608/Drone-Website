/**
 * check-backend.js - Check if backend server is running
 * Usage: node scripts/check-backend.js
 */

const http = require('http');

function checkBackend() {
  console.log('\n[check-backend] Checking if backend server is running...');
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/pilots',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log(`✓ Backend server is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(`✓ API is responding correctly. Found ${parsed.length ? parsed.length : 0} pilots`);
      } catch (e) {
        console.log('✓ API is responding but data format may be unexpected');
      }
    });
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log('✗ Backend server is not running on port 4000');
      console.log('\nTo start the backend server:');
      console.log('1. Navigate to the backend directory: cd backend');
      console.log('2. Install dependencies: npm install');
      console.log('3. Start the server: npm start or node server.js');
      console.log('4. Make sure PostgreSQL is running and accessible');
    } else {
      console.log(`✗ Error connecting to backend: ${err.message}`);
    }
  });

  req.on('timeout', () => {
    console.log('✗ Request to backend timed out');
    req.destroy();
  });

  req.end();
}

// Run the check
checkBackend();
