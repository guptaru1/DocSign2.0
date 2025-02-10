import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import documentService from '../services/documentService';
import voiceAssistant from '../services/voiceAssistantService';
import templateService from '../services/templateService';

const ViewerContainer = styled.div`
  background-color: black;
  min-height: 100vh;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.8);
  z-index: 10;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 10px;
  
  &:hover {
    color: #ccc;
  }
`;

const PDFContainer = styled.div`
  flex: 1;
  margin-top: 80px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 100px);
  position: relative;
`;

const PDFViewer = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: all;
`;

const SelectionTooltip = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: ${props => props.visible ? 'block' : 'none'};
  top: ${props => props.y}px;
  left: ${props => props.x}px;
`;

const VoiceControls = styled.div`
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ControlButton = styled.button`
  background: ${props => props.active ? '#45a049' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  font-size: 24px;
  
  &:hover {
    background: #45a049;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #808080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: white;
`;

const GenerateButton = styled(ControlButton)`
  background: #4a90e2;
  &:hover {
    background: #357abd;
  }
`;

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [isVoiceAssistantActive, setVoiceAssistantActive] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setPdfError(null);
        const doc = await documentService.getDocument(id);
        setDocument(doc);
      } catch (err) {
        setPdfError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && containerRef.current) {
        console.log("Selected text:", text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setSelectionCoords({
          x: Math.min(
            rect.x + rect.width / 2 - containerRect.x,
            containerRect.width - 200
          ),
          y: Math.max(rect.y - containerRect.y - 40, 100)
        });
        setSelectedText(text);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleTextSelection);
      container.addEventListener('touchend', handleTextSelection);

      return () => {
        container.removeEventListener('mouseup', handleTextSelection);
        container.removeEventListener('touchend', handleTextSelection);
      };
    }
  }, []);

  const handleVoiceAssistant = async () => {
    if (!selectedText) {
      alert('Please select some text to explain');
      return;
    }

    try {
      setVoiceAssistantActive(true);
      setIsPlaying(true);
      console.log("Processing text:", selectedText);
      
      const explanation = await voiceAssistant.generateResponse(selectedText);
      console.log("Generated explanation:", explanation);
      
      await voiceAssistant.speak(explanation);
    } catch (err) {
      console.error("Voice assistant error:", err);
      setPdfError('Voice assistant error: ' + err.message);
    } finally {
      setVoiceAssistantActive(false);
      setIsPlaying(false);
    }
  };

  const stopSpeaking = () => {
    voiceAssistant.stop();
    setIsPlaying(false);
  };

  const handleGenerateNew = async () => {
    try {
      const customization = {
        'tenant name': 'Jane Smith',
        'lease duration': '24 months',
        'monthly rent': '$2000',
        'start date': '2024-04-01',
        'end date': '2026-03-31'
      };

      const response = await templateService.generateFromTemplate({
        sourceDocumentId: id,
        customization
      });

      // Navigate to the new document
      navigate(`/document/${response.id}`);
    } catch (error) {
      setPdfError('Failed to generate new document: ' + error.message);
    }
  };

  if (loading) {
    return (
      <ViewerContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer ref={containerRef}>
      <Navigation>
        <NavButton onClick={() => navigate(`/document/${parseInt(id) - 1}`)}>
          ←
        </NavButton>
        <NavButton onClick={() => navigate('/timeline')}>×</NavButton>
        <NavButton onClick={() => navigate(`/document/${parseInt(id) + 1}`)}>
          →
        </NavButton>
      </Navigation>
      
      <PDFContainer>
        {pdfError ? (
          <ErrorMessage>{pdfError}</ErrorMessage>
        ) : (
          <PDFViewer
            ref={iframeRef}
            src={`${process.env.REACT_APP_API_BASE_URL}documents/${id}/pdf#toolbar=0`}
            title="PDF Viewer"
            onError={() => setPdfError('Failed to load PDF')}
          />
        )}
      </PDFContainer>

      {selectedText && (
        <SelectionTooltip 
          visible={true}
          x={selectionCoords.x}
          y={selectionCoords.y}
        >
          <div>Selected text: {selectedText.substring(0, 50)}...</div>
          <ControlButton 
            onClick={handleVoiceAssistant}
            disabled={isVoiceAssistantActive}
            style={{ margin: '8px 0' }}
          >
            {isVoiceAssistantActive ? '🔊' : '🎤'}
          </ControlButton>
        </SelectionTooltip>
      )}

      <VoiceControls>
        {isPlaying && (
          <ControlButton onClick={stopSpeaking}>
            🔇
          </ControlButton>
        )}
        <GenerateButton onClick={handleGenerateNew}>
          📄
        </GenerateButton>
      </VoiceControls>
    </ViewerContainer>
  );
};

export default DocumentViewer; 