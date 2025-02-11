import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const templateService = {
  async generateFromTemplate(templateData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-document`, {
        sourceDocumentId: templateData.sourceDocumentId,
        customization: templateData.customization
      });
      
      return response.data;
    } catch (error) {
      console.error('Template generation error:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate document');
    }
  },

  async getTemplates() {
    try {
      const response = await axios.get(`${API_BASE_URL}templates`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch templates');
    }
  }
};

export default templateService; 