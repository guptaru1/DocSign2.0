import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const documentService = {
  async getAllDocuments() {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch documents');
    }
  },

  async getDocument(id) {
    try {
      const response = await axios.get(`http://localhost:3001/api/documents/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch document');
    }
  },

  async analyzeText(text) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, { text });
      return response.data;
    } catch (error) {
      throw new Error('Failed to analyze text');
    }
  }
};

export default documentService; 