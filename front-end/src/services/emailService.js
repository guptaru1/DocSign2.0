import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const emailService = {
  async processEmail(emailData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/process-email`, emailData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to process email');
    }
  },

  async getEmailSettings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/email-settings`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch email settings');
    }
  }
};

export default emailService; 