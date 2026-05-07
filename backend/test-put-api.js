/**
 * test-put-api.js - Test the PUT drone API endpoint
 */

const http = require('http');

const testData = {
  model_name: "Test Update Drone",
  type: "FPV",
  camera: "4K",
  payload_kg: "2.5",
  flight_time_min: "30",
  range_km: "10",
  use_cases: ["Survey", "Filming"]
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/drones/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
