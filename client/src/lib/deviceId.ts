import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'team-not-found-device-id';

/**
 * Gets or creates a persistent device ID
 * Uses localStorage for persistence across sessions but falls back to
 * session-based ID if localStorage is not available
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    // If no device ID exists, create a new one
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // If localStorage is not available (e.g., in private browsing mode),
    // generate a session-only ID
    console.warn('Could not access localStorage for device ID, using session-only ID');
    return uuidv4();
  }
}