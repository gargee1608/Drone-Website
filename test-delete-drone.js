// Test script to verify drone delete functionality
const fetch = require('node-fetch');

async function testDeleteDrone() {
    try {
        // First, let's check what drones exist
        console.log('Checking existing drones...');
        const listResponse = await fetch('http://localhost:4000/api/drones', {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (listResponse.ok) {
            const drones = await listResponse.json();
            console.log('Existing drones:', drones.length);
            
            if (drones.length > 0) {
                const testDrone = drones[0];
                console.log('Testing delete with drone ID:', testDrone.id);
                
                // Test the delete endpoint
                const deleteResponse = await fetch(`http://localhost:4000/api/drones/${testDrone.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (deleteResponse.ok) {
                    const deletedDrone = await deleteResponse.json();
                    console.log('✅ Delete successful! Deleted drone:', deletedDrone);
                } else {
                    const error = await deleteResponse.json();
                    console.log('❌ Delete failed:', error);
                }
            } else {
                console.log('No drones found to test with');
            }
        } else {
            console.log('❌ Failed to list drones');
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDeleteDrone();
