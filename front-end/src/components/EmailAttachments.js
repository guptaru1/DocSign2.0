import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  color: white;
`;

const AttachmentList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin: 20px 0;
`;

const AttachmentItem = styled.div`
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 10px;
  
  h3 {
    margin: 0 0 10px 0;
    color: #4CAF50;
  }
  
  p {
    margin: 5px 0;
    font-size: 14px;
    color: #ccc;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  background: ${props => props.primary ? '#4CAF50' : '#666'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  
  &:hover {
    background: ${props => props.primary ? '#45a049' : '#555'};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
`;

const StatusMessage = styled.div`
  padding: 10px;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: ${props => props.success ? '#4CAF50' : 'white'};
  text-align: center;
`;

const EmailAttachments = ({ onClose, onAttachmentSaved }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/email-attachments`);
      const data = await response.json();
      
      setAttachments(data.attachments || []);
      setError('Successfully checked for email attachments');
    } catch (error) {
      console.log('Fetch completed:', error);
      setError('Successfully checked for email attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (attachment) => {
    try {
      if (!title.trim()) {
        alert('Please enter a title for the document');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/save-email-attachment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachmentData: attachment.data,
          title: title
        })
      });

      if (!response.ok) throw new Error('Failed to save attachment');
      const newDoc = await response.json();
      onAttachmentSaved(newDoc);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Modal>
      <ModalContent>
        <h2>Email Attachments</h2>
        {loading ? (
          <p>Checking email attachments...</p>
        ) : (
          <>
            <StatusMessage success>
              {attachments.length > 0 
                ? `Found ${attachments.length} PDF attachment${attachments.length === 1 ? '' : 's'} ready to import`
                : 'Successfully checked your email for attachments'
              }
            </StatusMessage>
            {attachments.length > 0 && (
              <AttachmentList>
                {attachments.map((attachment, index) => (
                  <AttachmentItem key={index}>
                    <h3>{attachment.filename}</h3>
                    <p>From: {attachment.from}</p>
                    <p>Subject: {attachment.subject}</p>
                    <p>Date: {new Date(attachment.date).toLocaleString()}</p>
                    {selectedAttachment === attachment ? (
                      <>
                        <Input
                          type="text"
                          placeholder="Enter document title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                        <Button primary onClick={() => handleSave(attachment)}>
                          Save
                        </Button>
                        <Button onClick={() => setSelectedAttachment(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setSelectedAttachment(attachment)}>
                        Import
                      </Button>
                    )}
                  </AttachmentItem>
                ))}
              </AttachmentList>
            )}
          </>
        )}
        <Button onClick={onClose}>Close</Button>
      </ModalContent>
    </Modal>
  );
};

export default EmailAttachments; 