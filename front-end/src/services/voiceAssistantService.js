const GOOGLE_CLOUD_API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;

class VoiceAssistant {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
  }

  speak(text) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = resolve;
      utterance.onerror = reject;
      this.synthesis.speak(utterance);
    });
  }

  async generateResponse(text) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          inputs: `Please explain this text in simple terms: ${text}`,
          parameters: {
            max_length: 100,
            temperature: 0.7
          }
        })
      });

      const data = await response.json();
      return data[0].generated_text;
    } catch (error) {
      throw new Error('Failed to generate response');
    }
  }
}

export default new VoiceAssistant(); 