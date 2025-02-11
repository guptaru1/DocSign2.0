const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const fs = require('fs');
const path = require('path');
const app = express();
const uploadsDir = path.join(__dirname, 'uploads');
require('dotenv').config();
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage: storage });
console.log(process.env.HUGGINGFACE_API_KEY);



app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Sample documents data
const documents = [
  {
    id: 1,
    title: 'Project Proposal',
    content: `
      <h2>Executive Summary</h2>
      <p>This project aims to revolutionize the way we handle document management...</p>
      <h2>Technical Specifications</h2>
      <p>The system will be built using React for the frontend and Node.js for the backend...</p>
    `,
    date: '2024-03-01'
  },
  {
    id: 2,
    title: 'Research Paper',
    content: `
      <h2>Abstract</h2>
      <p>Recent advances in artificial intelligence have shown promising results...</p>
      <h2>Methodology</h2>
      <p>We conducted a series of experiments using state-of-the-art models...</p>
    `,
    date: '2024-03-02'
  },
  {
    id: 3,
    title: 'Technical Documentation',
    content: `<h2>System Architecture</h2><p>Our system uses a microservices architecture...</p>`,
    date: '2024-03-03'
  },
  {
    id: 4,
    title: 'Meeting Minutes',
    content: `<h2>Project Status Update</h2><p>Team discussed the upcoming milestones...</p>`,
    date: '2024-03-04'
  },
  {
    id: 5,
    title: 'Design Specifications',
    content: `<h2>User Interface</h2><p>The new interface will feature a dark mode...</p>`,
    date: '2024-03-05'
  },
  // Add more sample documents...
];

app.get('/api/documents', (req, res) => {
  res.json(documents);
});

app.get('/api/documents/:id', (req, res) => {
  const document = documents.find(doc => doc.id === parseInt(req.params.id));
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

// Add this to your existing templates
const templates = [
  {
    id: 'lease',
    name: 'Lease Agreement',
    content: `
LEASE AGREEMENT

This Lease Agreement (the "Lease") is made and entered into on [START_DATE] by and between:

[LANDLORD_NAME] (hereinafter referred to as "Landlord")
and
[TENANT_NAME] (hereinafter referred to as "Tenant")

1. PROPERTY
The Landlord hereby leases to the Tenant the property located at [PROPERTY_ADDRESS].

2. TERM
The term of this Lease shall be for [LEASE_DURATION] beginning on [START_DATE] and ending on [END_DATE].

3. RENT
The monthly rent shall be [RENT_AMOUNT] dollars, payable on the first day of each month.
    `
  }
];



app.post('/api/generate-document', async (req, res) => {
  try {
    const { sourceDocumentId, customization } = req.body;
    
    // Find the source document
    const sourceDocument = documents.find(doc => doc.id === parseInt(sourceDocumentId));
    if (!sourceDocument) {
      return res.status(404).json({ error: 'Source document not found' });
    }

    // Get the content from the source document
    let templateContent = '';
    if (sourceDocument.filePath) {
      // If it's a PDF, we need to extract text first
      // You might need to install pdf-parse: npm install pdf-parse
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(sourceDocument.filePath);
      const pdfData = await pdf(dataBuffer);
      templateContent = pdfData.text;
    } else {
      templateContent = sourceDocument.content;
    }

    // Call Llama API for document generation
    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Using this document as a template:
                ${templateContent}
                Generate a new version with these changes:
                ${Object.entries(customization).map(([key, value]) => `Replace ${key} with: ${value}`).join('\n')}
                Maintain the same format and structure as the original document.`,
        parameters: {
          max_length: 2000,
          temperature: 0.2
        }
      })
    });

    const result = await response.json();
    const generatedContent = result[0].generated_text;

    // Create new document
    const newDoc = {
      id: documents.length + 1,
      title: `Modified ${sourceDocument.title}`,
      content: generatedContent,
      date: new Date().toISOString()
    };

    documents.push(newDoc);
    res.json(newDoc);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ error: 'Failed to generate document: ' + error.message });
  }
});

// Email monitoring setup
const emailConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
};

// Function to process emails
async function checkEmails() {
  try {
    const connection = await imaps.connect(emailConfig);
    const box = await connection.openBox('INBOX');
    
    // Search for unread emails with attachments
    const searchCriteria = ['UNSEEN', ['HEADER', 'content-type', 'application']];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
    
    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const message of messages) {
      const attachments = await processMessageAttachments(connection, message);
      
      // Use Llama to analyze email content and determine importance
      const emailContent = message.parts.find(p => p.which === 'TEXT').body;
      const importanceAnalysis = await analyzeEmailImportance(emailContent);
      
      if (importanceAnalysis.isImportant) {
        // Save document to the system
        const newDoc = {
          id: documents.length + 1,
          title: message.parts.find(p => p.which === 'HEADER').body.subject[0],
          content: attachments.join('\n'),
          date: new Date().toISOString()
        };
        
        documents.push(newDoc);
      }
    }

    connection.end();
  } catch (error) {
    console.error('Error processing emails:', error);
  }
}

async function analyzeEmailImportance(content) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Analyze if this email contains important documents that should be saved:
                ${content}
                Respond with only true or false.`,
        parameters: {
          max_length: 10,
          temperature: 0.1
        }
      })
    });

    const result = await response.json();
    return {
      isImportant: result[0].generated_text.toLowerCase().includes('true')
    };
  } catch (error) {
    console.error('Error analyzing email:', error);
    return { isImportant: false };
  }
}

// Check emails periodically
setInterval(checkEmails, 5 * 60 * 1000); // Check every 5 minutes

// Update the upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Upload request received');
  try {
    const file = req.file;
    console.log('File details:', file);

    if (!file) {
      console.log('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Accept all PDF-like mime types
    const validMimeTypes = [
      'application/pdf',
      'application/x-pdf',
      'binary/octet-stream',
      'application/octet-stream'
    ];
    
    console.log('File mime type:', file.mimetype);
    if (!validMimeTypes.includes(file.mimetype) && !file.originalname.toLowerCase().endsWith('.pdf')) {
      console.log('Invalid file type:', file.mimetype);
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const newDoc = {
      id: documents.length + 1,
      title: file.originalname.replace('.pdf', ''),
      filePath: file.path,
      fileName: file.filename,
      date: new Date().toISOString()
    };

    documents.push(newDoc);
    console.log('New document added:', newDoc);
    res.json(newDoc);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
});

// Update the PDF serving endpoint
app.get('/api/documents/:id/pdf', (req, res) => {
  try {
    const document = documents.find(doc => doc.id === parseInt(req.params.id));
    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!document.filePath) {
      console.log('File path is missing for document:', document);
      return res.status(404).json({ error: 'PDF file path is missing' });
    }

    const filePath = path.resolve(document.filePath);
    console.log('Attempting to serve file:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    // Update these headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.removeHeader('X-Frame-Options'); // Remove this header completely
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('PDF serving error:', error);
    res.status(500).json({ error: 'Failed to serve PDF: ' + error.message });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

const waitlist = [];

app.post('/api/waitlist', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if email already exists
    if (waitlist.includes(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Add to waitlist
    waitlist.push({
      email,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    // In production, you'd want to:
    // 1. Save to a database (MongoDB, PostgreSQL, etc.)
    // 2. Send a confirmation email
    // 3. Add to your email marketing system (Mailchimp, SendGrid, etc.)
    
    // For now, just log it
    console.log('New waitlist signup:', email);

    res.json({ message: 'Successfully joined waitlist' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

// Add this new endpoint for text analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, instructions } = req.body;

    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `
          Instructions: ${instructions}
          
          Text to analyze:
          "${text}"
          
          Provide your explanation:
        `,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
          top_p: 0.9,
        }
      })
    });

    const result = await response.json();
    console.log(result);
    res.json({ explanation: result[0].generated_text });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});
const axios = require('axios');

app.post('/api/analyz', async (req, res) => {
  try {
    const { text, instructions } = req.body;

    // Make sure that the Hugging Face API key is set in the environment variable
    if (!process.env.HUGGINGFACE_API_KEY) {
      return res.status(400).json({ error: 'Hugging Face API key is missing' });
    }

    // Make the API request using axios to the BART model endpoint
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/bigbird-pegasus-large-arxiv',
      {
        inputs: text,  // The input text for summarization or analysis
        parameters: {
          max_length: 500, // You can adjust this as needed for summarization
          min_length: 50,  // You can adjust this to control summary length
          temperature: 0.7, // Controls randomness in text generation
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data;

    // Check if the response has any error
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Output the result for debugging
    console.log(result);

    // The BART model typically responds with 'summary_text' for summarization tasks
    res.json({ explanation: result[0].summary_text || result[0].generated_text });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});
  
app.get('/api/model-metadata', async (req, res) => {
  try {
    // Get model metadata from HuggingFace API
    const response = await axios.get(
      'https://huggingface.co/api/models/meta-llama/Llama-2-7b-chat-hf',
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, // Pass your HuggingFace API key here
        },
      }
    );

    // Check if the response data is valid
    if (!response.data) {
      throw new Error('Failed to fetch model metadata');
    }

    // Return the model metadata
    res.json({
      modelMetadata: response.data,
    });
    console.log("fetched data orioerly");
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch model metadata' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(process.env.HUGGINGFACE_API_KEY);

}); 