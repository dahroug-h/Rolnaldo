// Script to add 200 test members to a project for performance testing
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Configuration
const PROJECT_ID = "67e023cbb3c9a0c455f9da78"; // Target project ID
const TOTAL_MEMBERS = 50; // Number of members to add (reduced for initial testing)
const BASE_URL = "http://localhost:5000"; // API URL (confirmed from server logs)

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

// Add a single team member
async function addTeamMember(index) {
  const member = {
    name: generateName(index),
    whatsappNumber: generateEgyptianPhoneNumber(),
    projectId: PROJECT_ID,
    sectionNumber: generateSectionNumber(),
    deviceId: generateDeviceId()
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Member ${index+1}/${TOTAL_MEMBERS} added: ${member.name}`);
      return data;
    } else {
      const errorText = await response.text();
      console.error(`Failed to add member ${index+1}/${TOTAL_MEMBERS}: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`Error adding member ${index+1}/${TOTAL_MEMBERS}:`, error);
    return null;
  }
}

// Main function to add multiple members
async function addManyMembers() {
  console.log(`Starting to add ${TOTAL_MEMBERS} test members to project ${PROJECT_ID}...`);
  console.log(`This may take several minutes. Please wait...`);
  
  const startTime = Date.now();
  let successCount = 0;
  const BATCH_SIZE = 5; // Process in smaller batches to reduce server load
  
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
            if (result) successCount++;
          } catch (error) {
            console.error(`Error in batch processing for member ${i}:`, error);
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
  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
  console.log(`Average time per member: ${(duration / TOTAL_MEMBERS).toFixed(2)} seconds`);
}

// Run the script
addManyMembers().catch(error => {
  console.error("Script failed:", error);
});