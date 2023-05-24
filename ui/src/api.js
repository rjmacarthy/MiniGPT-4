import axios from 'axios';

const apiUrl = 'http://localhost:8000'



export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  const response = await axios.post(`${apiUrl}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export const generate = async (prompt) => {
  const response = await axios.post(`${apiUrl}/generate`, { message: prompt });
  return response.data;
}

export const reset = async () => {
  const response = await axios.post(`${apiUrl}/reset`);
  return response.data;
}