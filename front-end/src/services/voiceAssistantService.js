import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const voiceAssistant = {
  async generateResponse(text) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        text,
        instructions: `
          Please explain this text in a simple and clear way. Include:
          1. A brief summary in plain language
          2. Key points or takeaways
          3. Any important terms explained
          4. Practical implications or actions needed
          
          Format the response in a conversational tone, as if explaining to someone.
        `
      });

      return response.data.explanation;
    } catch (error) {
      throw new Error('Failed to generate explanation');
    }
  },

  speak(text) {
    return new Promise((resolve, reject) => {
      try {
        console.log("working adi olease i loe you");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.pitch = 1;
        utterance.onend = resolve;
        utterance.onerror = reject;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  },

  stop() {
    window.speechSynthesis.cancel();
  }
};

export default voiceAssistant; 