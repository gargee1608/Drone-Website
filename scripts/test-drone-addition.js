/**
 * test-drone-addition.js - Test script to verify drone addition for pilots
 * Usage: node scripts/test-drone-addition.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function testDroneAddition() {
  console.log('\n[test-drone-addition] Testing drone addition for pilots...');
  
  try {
    // First, login as a test pilot to get a token
    console.log('[1] Logging in as test pilot...');
    const loginResponse = await fetch(`${BASE_URL}/api/pilots/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    if (!loginResponse.ok) {
      console.log('✗ Login failed. Make sure a test pilot exists or create one first.');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.pilot ? loginData.pilot.id : null;
    
    if (!token) {
      console.log('✗ Could not extract pilot ID from login response');
      return;
    }

    console.log(`✓ Logged in successfully with pilot ID: ${token}`);

    // Test adding a drone for this pilot
    console.log('[2] Adding a new drone for the pilot...');
    const droneData = {
      pilot_id: token,
      model_name: 'Test Drone Model',
      type: 'FPV',
      camera: '4K HDR',
      payload_kg: '2.5',
      flight_time_min: '45',
      range_km: '15',
      use_cases: ['Survey', 'Filming']
    };

    const addDroneResponse = await fetch(`${BASE_URL}/api/drones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer test-token`, // Note: In real app, this would be a JWT
      },
      body: JSON.stringify(droneData)
    });

    if (!addDroneResponse.ok) {
      const errorText = await addDroneResponse.text();
      console.log(`✗ Failed to add drone: ${errorText}`);
      return;
    }

    const addedDrone = await addDroneResponse.json();
    console.log(`✓ Successfully added drone with ID: ${addedDrone.id}`);
    console.log(`  - Model: ${addedDrone.model_name}`);
    console.log(`  - Pilot ID: ${addedDrone.pilot_id}`);
    console.log(`  - Type: ${addedDrone.type}`);

    // Verify the drone is associated with the pilot
    console.log('[3] Verifying drone association...');
    const getDronesResponse = await fetch(`${BASE_URL}/api/drones`);
    
    if (!getDronesResponse.ok) {
      console.log('✗ Failed to retrieve drones list');
      return;
    }

    const allDrones = await getDronesResponse.json();
    const pilotDrones = allDrones.filter(drone => drone.pilot_id === token);
    
    console.log(`✓ Found ${pilotDrones.length} drone(s) associated with pilot ${token}`);
    
    const testDrone = pilotDrones.find(drone => drone.id === addedDrone.id);
    if (testDrone) {
      console.log('✓ Test drone is correctly associated with the pilot');
    } else {
      console.log('✗ Test drone not found in pilot\'s drone list');
    }

    console.log('\n[test-drone-addition] ✓ Test completed successfully!');
    
  } catch (error) {
    console.error('✗ Test failed with error:', error.message);
  }
}

// Run the test
testDroneAddition().catch(console.error);
