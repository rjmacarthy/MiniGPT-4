import axios from 'axios';

const apiUrl = 'http://localhost:8000';

export const uploadFiles = async files => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  const response = await axios.post(`${apiUrl}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getImages = async () => {
  const response = await axios.get(`${apiUrl}/list_images`);
  return response.data;
};

export const deleteImages = async ids => {
  const response = await axios.post(`${apiUrl}/delete_images`, {
    image_ids: ids,
  });
  return response.data;
};

export const generate = async (prompt, imageIds) => {
  const response = await axios.post(`${apiUrl}/generate`, {
    prompt,
    image_ids: imageIds,
  });
  return response.data;
};

export const reset = async () => {
  const response = await axios.post(`${apiUrl}/reset`);
  return response.data;
};
