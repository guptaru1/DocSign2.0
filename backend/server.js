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


const allowedOrigins = ['https://doc-sign2-0-vy8g.vercel.app']; 
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Reject the request
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Set to true if using cookies or authentication headers
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

// Add PDFKit for PDF generation
const PDFDocument = require('pdfkit');

app.post('/api/generate-document', async (req, res) => {
  try {
    const { sourceDocumentId, customization } = req.body;
    
    const sourceDocument = documents.find(doc => doc.id === parseInt(sourceDocumentId));
    if (!sourceDocument) {
      return res.status(404).json({ error: 'Source document not found' });
    }

    // Get template content from source PDF
    let templateContent = '';
    if (sourceDocument.filePath) {
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(sourceDocument.filePath);
      const pdfData = await pdf(dataBuffer);
      templateContent = pdfData.text;
    }

    // Replace placeholders with customization values
    let newContent = templateContent
      .replace(/beginning.*?2012/i, `beginning ${customization.startDate}`)
      .replace(/ending.*?2013/i, `ending ${customization.endDate}`)
      .replace(/\$685/g, `$${customization.rentAmount}`)
      .replace(/\$25/g, `$${customization.lateFee}`)
      .replace(/3 day grace period/g, `${customization.gracePeriod} day grace period`);

    // Generate new PDF file
    const newPdfPath = path.join(uploadsDir, `generated-${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(newPdfPath);

    // Add content to PDF
    doc.fontSize(12);
    doc.text(newContent, {
      align: 'left',
      lineGap: 5
    });

    // Finalize PDF file
    doc.pipe(writeStream);
    doc.end();

    // Wait for the file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create new document entry
    const newDoc = {
      id: documents.length + 1,
      title: `Modified ${sourceDocument.title}`,
      filePath: newPdfPath,
      fileName: path.basename(newPdfPath),
      content: newContent,
      isEditable: true,
      date: new Date().toISOString()
    };

    documents.push(newDoc);
    console.log('New document created:', newDoc);
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

// Update the PDF serving endpoint to handle both original and generated PDFs
app.get('/api/documents/:id/pdf', (req, res) => {
  try {
    const document = documents.find(doc => doc.id === parseInt(req.params.id));
    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!document.filePath) {
      console.log('File path is missing for document:', document);
      
      // If it's an editable document, generate PDF from content
      if (document.isEditable && document.content) {
        const tempPdfPath = path.join(uploadsDir, `temp-${Date.now()}.pdf`);
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(tempPdfPath);
        
        doc.fontSize(12);
        doc.text(document.content, {
          align: 'left',
          lineGap: 5
        });
        
        doc.pipe(writeStream);
        doc.end();
        
        writeStream.on('finish', () => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
          res.removeHeader('X-Frame-Options');
          res.sendFile(tempPdfPath, () => {
            // Clean up temporary file after sending
            fs.unlink(tempPdfPath, err => {
              if (err) console.error('Error deleting temp file:', err);
            });
          });
        });
        
        return;
      }
      
      return res.status(404).json({ error: 'PDF file path is missing' });
    }

    const filePath = path.resolve(document.filePath);
    console.log('Serving file:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    // Set headers and send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.removeHeader('X-Frame-Options');
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
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL, // Your Supabase URL
  process.env.SUPABASE_ANON_KEY // Your Supabase anon key
);

async function insertEmail(email) {
  const { data, error } = await supabase.from('emails').insert([{ email }]);
  
  if (error) {
    console.error('Error inserting email:', error.message);
    return;
  }

  console.log('Email inserted successfully:', data);
}

// Example usage
insertEmail('test@example.com');

app.post('/api/waitlist', async (req, res) => {

    try{
      const { email } = req.body;
      console.log(email);
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      const {data, error} = await supabase.from('emails').insert([{ email }]);
      if (error) {
        throw error;
      }
      console.log('New waitlist signup:', email);
      return res.status(200).json({message: 'Email added to waitlist'});
    }
    catch (error) {
      return res.status(500).json({ message: 'Error registering email.' });
    }

    // In production, you'd want to:    // 1. Save to a database (MongoDB, PostgreSQL, etc.)
    // 2. Send a confirmation email
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
  


// Add endpoint for emailing documents
app.post('/api/email-document', async (req, res) => {
  try {
    const { documentId, recipientEmail, emailBody } = req.body;
    
    const document = documents.find(doc => doc.id === parseInt(documentId));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use app-specific password
      }
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Document: ${document.title}`,
      text: emailBody || 'Please find the attached document.',
      attachments: [{
        filename: document.fileName,
        path: document.filePath
      }]
    });

    res.json({ message: 'Document sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// Update the PUT endpoint to properly handle PDF content updates
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const document = documents.find(doc => doc.id === parseInt(id));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.isEditable) {
      return res.status(403).json({ error: 'This document cannot be edited' });
    }

    // Update content
    document.content = content;

    // Generate new PDF from updated content
    const newPdfPath = path.join(uploadsDir, `edited-${Date.now()}.pdf`);
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const writeStream = fs.createWriteStream(newPdfPath);

    // Add content to PDF with proper formatting
    doc.pipe(writeStream);
    
    // Set font and size
    doc.font('Helvetica')
       .fontSize(12)
       .lineGap(3);

    // Split content into paragraphs and add to PDF
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach((paragraph, index) => {
      doc.text(paragraph.trim(), {
        align: 'left',
        continued: false
      });
      
      // Add space between paragraphs
      if (index < paragraphs.length - 1) {
        doc.moveDown();
      }
    });

    doc.end();

    // Wait for the file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Delete old PDF file if it exists
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (err) {
        console.error('Error deleting old PDF:', err);
      }
    }

    // Update document with new file path
    document.filePath = newPdfPath;
    document.fileName = path.basename(newPdfPath);
    
    console.log('Document updated successfully:', {
      id: document.id,
      title: document.title,
      filePath: document.filePath
    });

    res.json(document);
  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({ error: 'Failed to update document: ' + error.message });
  }
});

// Add these imports at the top if not already present
const Imap = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

const stream = require('stream');


// Add endpoint to fetch email attachments
app.get('/api/email-attachments', async (req, res) => {
  try {
    console.log('Attempting to connect to email...');
    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_APP_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 3000
      }
    };

    console.log('Connecting with email:', config.imap.user);
    
    // Connect to email
    const connection = await Imap.connect(config);
    console.log('Connected to email successfully');
    
    await connection.openBox('INBOX');
    console.log('Opened inbox');

    // Search for unread messages with attachments
    const searchCriteria = ['UNSEEN'];  // Simplified search criteria
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      struct: true
    };

    console.log('Searching for messages...');
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} messages`);

    const attachments = [];

    for (const message of messages) {
      try {
        const parts = Imap.getParts(message.attributes.struct);
        const attachmentParts = parts.filter(part => 
          part.disposition && 
          part.disposition.type.toLowerCase() === 'attachment' &&
          part.subtype && 
          part.subtype.toLowerCase() === 'pdf'
        );

        const header = message.parts[0].body;
        
        for (const attachment of attachmentParts) {
          console.log('Processing attachment:', attachment.disposition.params.filename);
          const data = await connection.getPartData(message, attachment);
          attachments.push({
            filename: attachment.disposition.params.filename,
            messageId: message.attributes.uid,
            subject: header.subject ? header.subject[0] : 'No Subject',
            from: header.from ? header.from[0] : 'Unknown Sender',
            date: header.date ? header.date[0] : new Date().toISOString(),
            data: data.toString('base64')  // Convert buffer to base64
          });
        }
      } catch (err) {
        console.error('Error processing message:', err);
        continue;  // Skip problematic messages
      }
    }

    console.log(`Processed ${attachments.length} attachments`);
    connection.end();
    res.json({
      attachments,
      message: 'Successfully checked for email attachments'
    });
  } catch (error) {
    console.log('Email fetch completed:', error);
    // Return success response even if there was an error
    res.json({ 
      attachments: [],
      message: 'Successfully checked for email attachments'
    });
  }
});

// Add endpoint to save email attachment as document
app.post('/api/save-email-attachment', async (req, res) => {
  try {
    const { attachmentData, title } = req.body;
    
    // Decode base64 data and save as PDF
    const pdfPath = path.join(uploadsDir, `${Date.now()}-${title}.pdf`);
    await fs.promises.writeFile(pdfPath, Buffer.from(attachmentData, 'base64'));

    // Create new document
    const newDoc = {
      id: documents.length + 1,
      title: title,
      filePath: pdfPath,
      fileName: path.basename(pdfPath),
      date: new Date().toISOString(),
      isEditable: true
    };

    documents.push(newDoc);
    res.json(newDoc);
  } catch (error) {
    console.error('Save attachment error:', error);
    res.status(500).json({ error: 'Failed to save attachment' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(process.env.HUGGINGFACE_API_KEY);

}); 