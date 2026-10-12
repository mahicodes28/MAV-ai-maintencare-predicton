import axios from 'axios';

// Change this to your machine's IP address when running on an actual device
const BASE_URL = 'http://192.168.1.8:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
  formData.append('file', {
    uri: uri,
    name: name,
    type: 'video/mp4'
  } as any);
  
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
