// Script to add 200 test members to a project for performance testing
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Configuration
const PROJECT_ID = "67e023cbb3c9a0c455f9da78"; // Target project ID
const TOTAL_MEMBERS = 200; // Number of members to add as requested
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

// Add a single team member with retry capability
async function addTeamMember(index, retryCount = 0) {
  const MAX_RETRIES = 3;
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
      timeout: 10000, // 10 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Member ${index+1}/${TOTAL_MEMBERS} added: ${member.name}`);
      return data;
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

// Main function to add multiple members
async function addManyMembers() {
  console.log(`Starting to add ${TOTAL_MEMBERS} test members to project ${PROJECT_ID}...`);
  console.log(`This may take several minutes. Please wait...`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const BATCH_SIZE = 8; // Increased batch size for faster processing
  
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
}

// Run the script
addManyMembers().catch(error => {
  console.error("Script failed:", error);
});