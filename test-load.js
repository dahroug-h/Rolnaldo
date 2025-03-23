// Script to add 200 test members to a project for performance testing
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Configuration
const PROJECT_ID = "67e023cbb3c9a0c455f9da78"; // Target project ID
const TOTAL_MEMBERS = 200; // Number of members to add
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
  
  // Add members one at a time to avoid rate limiting and server overload
  for (let i = 0; i < TOTAL_MEMBERS; i++) {
    const result = await addTeamMember(i);
    if (result) successCount++;
    
    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
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