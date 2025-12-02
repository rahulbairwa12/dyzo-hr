import { fetchAuthGET, fetchAuthPatch, fetchAuthPut } from '@/store/api/apiSlice';
import changelog from '../data/changelog.json';

const API_BASE_URL = 'https://api.dyzo.ai/api';

export const getUserVersionHistory = async (userId) => {
  try {
    const response = await fetchAuthGET(`${API_BASE_URL}/version-history/${userId}/`);
    return response;
  } catch (error) {
    console.error('Error fetching version history:', error);
    return null;
  }
};

export const updateUserVersion = async (userId, appName, version) => {
  try {
    const payload = {
      [appName]: version
    };
    
    const response = await fetchAuthPatch(`${API_BASE_URL}/version-history/${userId}/`, {
      body: payload
    });
    
    return response;
  } catch (error) {
    console.error('Error updating version:', error);
    return { success: false, error: error.message };
  }
};


export const isVersionNewer = (currentVersion, lastSeenVersion) => {
  if (!lastSeenVersion || lastSeenVersion === '0.0.0') {
    return true; 
  }
  
  const currentParts = currentVersion.split('.').map(Number);
  const lastSeenParts = lastSeenVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, lastSeenParts.length); i++) {
    const current = currentParts[i] || 0;
    const lastSeen = lastSeenParts[i] || 0;
    
    if (current > lastSeen) {
      return true;
    } else if (current < lastSeen) {
      return false;
    }
  }
  
  return false; 
};

export const getCurrentAppVersion = () => {
  return changelog[0]?.version || '1.0.0';
};
