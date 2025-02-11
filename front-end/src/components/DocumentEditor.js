import React, { useState } from 'react';
import styled from 'styled-components';

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 20px;
  font-size: 16px;
  line-height: 1.5;
  border: none;
  resize: none;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background: ${props => props.primary ? '#4CAF50' : '#ccc'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  
  &:hover {
    background: ${props => props.primary ? '#45a049' : '#bbb'};
  }
`;

const DocumentEditor = ({ content, onSave, onClose }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editedContent);
      // Force reload the PDF viewer
      window.location.reload();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <h2>Edit Document</h2>
        <div>
          <Button onClick={onClose}>Cancel</Button>
          <Button primary onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </EditorHeader>
      <TextArea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        spellCheck="true"
        placeholder="Edit your document content here..."
      />
    </EditorContainer>
  );
};

export default DocumentEditor; 