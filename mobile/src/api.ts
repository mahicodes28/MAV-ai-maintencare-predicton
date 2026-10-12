import axios from 'axios';
import { Platform } from 'react-native';

// Production Render backend URL with environment variable override
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mav-ai-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const getMachines = async () => {
  try {
    const response = await api.get('/machines/');
    return response.data;
  } catch (error) {
    console.error('Error fetching machines:', error);
    throw error;
  }
};

export const createMachine = async (machineData: { name: string; type: string; location: string; details?: string }) => {
  try {
    const response = await api.post('/machines/', machineData);
    return response.data;
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
};

export const getMachine = async (machineId: number) => {
  try {
    const response = await api.get(`/machines/${machineId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching machine ${machineId}:`, error);
    throw error;
  }
};

export const getInspections = async (machineId: number) => {
  try {
    const response = await api.get(`/inspections/${machineId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching inspections for machine ${machineId}:`, error);
    throw error;
  }
};

export const uploadVideo = async (machineId: number, uri: string, name: string) => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // On web, fetch URI blob or use standard browser file
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } catch {
      formData.append('file', { uri, name, type: 'video/mp4' } as any);
    }
  } else {
    // On native mobile (Android / iOS)
    formData.append('file', {
      uri: uri,
      name: name,
      type: 'video/mp4'
    } as any);
  }
  
  try {
    const response = await api.post(`/inspections/${machineId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export default api;
