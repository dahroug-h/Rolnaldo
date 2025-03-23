// Script to add 50 more members to a project and test the "Remove Me" feature
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const PROJECT_ID = "67e023cbb3c9a0c455f9da78"; // Target project ID
const TOTAL_MEMBERS = 100; // Number of members to add (increased from 50 to 100)
const BASE_URL = "http://localhost:5000"; // API URL (confirmed from server logs)
const DEVICE_IDS_FILE = './device-ids.json'; // File to save device IDs for testing

// Generate a random Egyptian phone number
function generateEgyptianPhoneNumber() {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `+20${digits}`;
}

// Generate a random name
function generateName(index) {
  const firstNames = [
    "Mohamed", "Ahmed", "Mahmoud", "Ali", "Hassan", "Hussein", "Omar", "Khaled", 
    "Ibrahim", "Youssef", "Mostafa", "Karim", "Amir", "Adel", "Ashraf", "Fadi", 
    "Nour", "Sara", "Fatima", "Aisha", "Nada", "Layla", "Mariam", "Heba", "Amira", 
    "Rania", "Dina", "Aya", "Yasmin", "Noura", "Salma", "Reem", "Mai", "Mona"
  ];
  
  const lastNames = [
    "Ibrahim", "Hassan", "Mohamed", "Ahmed", "Mahmoud", "Ali", "Sayed", "El-Din", 
    "Abdelrahman", "Abdelaziz", "Khalil", "Mansour", "Elshamy", "Farouk", "Sami", 
    "Sobhy", "Sherif", "Nabil", "Fahmy", "Saleh", "Fawzy", "Safwat", "Kamel", 
    "Hamdy", "Gaber", "Samir", "Adel", "Fouad", "Emad", "Essam", "Adham"
  ];
  
  // Ensure unique name by using the index
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName} ${index}`;
}

// Generate a random section number (1-4)
function generateSectionNumber() {
  return Math.floor(Math.random() * 4) + 1;
}

// Generate a unique device ID
function generateDeviceId() {
  return uuidv4();
}

// Save device IDs and member info to file for testing
function saveDeviceInfo(members) {
  try {
    fs.writeFileSync(DEVICE_IDS_FILE, JSON.stringify(members, null, 2));
    console.log(`Device IDs saved to ${DEVICE_IDS_FILE} for testing`);
  } catch (error) {
    console.error(`Failed to save device IDs: ${error.message}`);
  }
}

// Load previously saved device IDs if they exist
function loadDeviceInfo() {
  try {
    if (fs.existsSync(DEVICE_IDS_FILE)) {
      const data = fs.readFileSync(DEVICE_IDS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Failed to load device IDs: ${error.message}`);
  }
  return [];
}

// Add a single team member with retry capability
async function addTeamMember(index, retryCount = 0) {
  const MAX_RETRIES = 3;
  
  // Generate a unique device ID
  const deviceId = generateDeviceId();
  
  const member = {
    name: generateName(index),
    whatsappNumber: generateEgyptianPhoneNumber(),
    projectId: PROJECT_ID,
    sectionNumber: generateSectionNumber(),
    deviceId: deviceId
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
      timeout: 10000, // 10 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Member ${index+1}/${TOTAL_MEMBERS} added: ${member.name}`);
      // Return both API data and the local member object with device ID
      return { 
        ...data, 
        memberInfo: member 
      };
    } else {
      const errorText = await response.text();
      console.error(`Failed to add member ${index+1}/${TOTAL_MEMBERS}: ${errorText}`);
      
      // Retry logic for server errors
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying member ${index+1}/${TOTAL_MEMBERS} (attempt ${retryCount+1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return addTeamMember(index, retryCount + 1);
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Error adding member ${index+1}/${TOTAL_MEMBERS}:`, error);
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying member ${index+1}/${TOTAL_MEMBERS} (attempt ${retryCount+1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return addTeamMember(index, retryCount + 1);
    }
    
    return null;
  }
}

// Test the "Remove Me" feature
async function testRemoveMeFeature(members) {
  if (members.length === 0) {
    console.log("No members available to test removal");
    return;
  }
  
  console.log("\n--- Testing 'Remove Me' Feature ---");
  
  // Test case 1: Valid removal (using correct device ID)
  const testMember = members[0];
  console.log(`Testing valid removal for member: ${testMember.memberInfo.name}`);
  
  try {
    // Attempt to remove the member using their device ID
    const removeResponse = await fetch(`${BASE_URL}/api/members/${testMember.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': testMember.memberInfo.deviceId
      }
    });
    
    if (removeResponse.ok) {
      console.log(`✅ Success: Member removed successfully using their device ID`);
    } else {
      const errorText = await removeResponse.text();
      console.log(`❌ Failed: Could not remove member with correct device ID: ${errorText}`);
    }
  } catch (error) {
    console.error(`Error during valid removal test:`, error);
  }
  
  // Test case 2: Invalid removal (using incorrect device ID)
  if (members.length > 1) {
    const testMember2 = members[1];
    const fakeDeviceId = generateDeviceId(); // Generate a new random device ID
    
    console.log(`\nTesting invalid removal for member: ${testMember2.memberInfo.name}`);
    console.log(`Using incorrect device ID: ${fakeDeviceId}`);
    
    try {
      // Attempt to remove another member using an incorrect device ID
      const removeResponse = await fetch(`${BASE_URL}/api/members/${testMember2.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': fakeDeviceId
        }
      });
      
      if (!removeResponse.ok) {
        console.log(`✅ Success: Security check prevented removal with incorrect device ID`);
      } else {
        console.log(`❌ Failed: Member was removed with incorrect device ID!`);
      }
    } catch (error) {
      console.error(`Error during invalid removal test:`, error);
    }
  }
  
  console.log("--- 'Remove Me' Feature Tests Completed ---");
}

// Main function to add multiple members
async function addManyMembers() {
  console.log(`Starting to add ${TOTAL_MEMBERS} test members to project ${PROJECT_ID}...`);
  console.log(`This may take several minutes. Please wait...`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const BATCH_SIZE = 8; // Increased batch size for faster processing
  
  // Array to store successfully added members with their device IDs
  const addedMembers = [];
  
  // Process members in batches to make the script more robust
  for (let batchStart = 0; batchStart < TOTAL_MEMBERS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_MEMBERS);
    console.log(`Processing batch ${batchStart/BATCH_SIZE + 1}: members ${batchStart+1}-${batchEnd}`);
    
    // Process a batch of members concurrently
    const promises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      // Add a small staggered delay to prevent overwhelming the server
      const delay = (i - batchStart) * 100;
      const promise = new Promise(resolve => {
        setTimeout(async () => {
          try {
            const result = await addTeamMember(i);
            if (result) {
              successCount++;
              // Add to our list of members
              addedMembers.push(result);
            } else {
              failureCount++;
              console.error(`Failed to add member ${i+1}/${TOTAL_MEMBERS}`);
            }
          } catch (error) {
            failureCount++;
            console.error(`Error in batch processing for member ${i+1}/${TOTAL_MEMBERS}:`, error);
          }
          resolve();
        }, delay);
      });
      promises.push(promise);
    }
    
    // Wait for the current batch to complete
    await Promise.all(promises);
    
    // Report progress after each batch
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - startTime) / 1000;
    const percentComplete = ((batchEnd / TOTAL_MEMBERS) * 100).toFixed(1);
    console.log(`Progress: ${percentComplete}% complete (${batchEnd}/${TOTAL_MEMBERS})`);
    console.log(`Time elapsed: ${elapsedSeconds.toFixed(1)} seconds`);
    
    // Short pause between batches to let the server breathe
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\nCompleted adding members!`);
  console.log(`Successfully added: ${successCount}/${TOTAL_MEMBERS} members`);
  console.log(`Failed: ${failureCount}/${TOTAL_MEMBERS} members`);
  console.log(`Success rate: ${(successCount / TOTAL_MEMBERS * 100).toFixed(1)}%`);
  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
  console.log(`Average time per member: ${(duration / TOTAL_MEMBERS).toFixed(2)} seconds`);
  console.log(`Members per second: ${(successCount / duration).toFixed(2)}`);
  
  // Save device IDs for testing
  if (addedMembers.length > 0) {
    saveDeviceInfo(addedMembers);
    
    // Test the "Remove Me" feature
    await testRemoveMeFeature(addedMembers);
  }
  
  return addedMembers;
}

// Function to run "Remove Me" testing with previously stored device IDs
async function testPersistentRemoveMe() {
  console.log("Testing 'Remove Me' feature with previously stored device IDs...");
  
  // Load device IDs from previous runs
  const savedMembers = loadDeviceInfo();
  
  if (savedMembers && savedMembers.length > 0) {
    console.log(`Found ${savedMembers.length} previously saved members for testing`);
    await testRemoveMeFeature(savedMembers);
  } else {
    console.log("No previously saved device IDs found. Run addManyMembers() first.");
  }
}

// Determine which mode to run (add members or test removal)
async function main() {
  const args = process.argv.slice(2);
  
  // Check if we should run in test mode
  if (args.includes('--test-remove')) {
    console.log("Running in test-only mode for the 'Remove Me' feature...");
    await testPersistentRemoveMe();
  } else {
    // Default: add members and then test removal
    console.log("Running in full mode: adding members and testing 'Remove Me' feature...");
    await addManyMembers();
  }
}

// Run the script
main().catch(error => {
  console.error("Script failed:", error);
});