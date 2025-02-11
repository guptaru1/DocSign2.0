import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import documentService from '../services/documentService';
import voiceAssistant from '../services/voiceAssistantService';
import templateService from '../services/templateService';
import SideMenu from './SideMenu';
import TemplateForm from './TemplateForm';

import DocumentEditor from './DocumentEditor';

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
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
`;

const SelectionTooltip = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px;
  border-radius: 8px;
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  display: ${props => props.visible ? 'block' : 'none'};
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const SelectionIndicator = styled.div`
  background: rgba(255, 255, 0, 0.3);
  position: absolute;
  pointer-events: none;
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

const SelectionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  span {
    display: block;
    width: 25px;
    height: 3px;
    background: white;
    border-radius: 3px;
    transition: all 0.3s;
  }
  
  &:hover span {
    background: #ccc;
  }
`;

const MenuItem = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  span {
    display: block;
    width: 25px;
    height: 3px;
    background: white;
    border-radius: 3px;
    transition: all 0.3s;
  }
  
  &:hover span {
    background: #ccc;
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

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
    const handleIframeLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        const handleTextSelection = () => {
          const selection = iframeDoc.getSelection();
          const text = selection?.toString().trim();
          
          if (text) {
            console.log("Selected text:", text);
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();
            
            // Calculate position relative to the viewport
            const x = iframeRect.left + rect.left + (rect.width / 2);
            const y = iframeRect.top + rect.top - 60; // Position above the selection
            
            setSelectionCoords({
              x: Math.min(x, window.innerWidth - 250),
              y: Math.max(y, 100)
            });
            setSelectedText(text);
            setShowTooltip(true);
          }
        };

        // Handle clicks outside the selection
        const handleClickOutside = (event) => {
          if (!event.target.closest('.selection-tooltip')) {
            setShowTooltip(false);
          }
        };

        iframeDoc.addEventListener('mouseup', handleTextSelection);
        iframeDoc.addEventListener('touchend', handleTextSelection);
        window.addEventListener('click', handleClickOutside);

        return () => {
          iframeDoc.removeEventListener('mouseup', handleTextSelection);
          iframeDoc.removeEventListener('touchend', handleTextSelection);
          window.removeEventListener('click', handleClickOutside);
        };
      } catch (error) {
        console.error('Error setting up iframe listeners:', error);
      }
    };

    // Add load event listener to iframe
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, []);

  const handleVoiceAssistant = async () => {
    // For testing, use the sample text
    const testText = `1. FIXED-TERM AGREEMENT (LEASE):
Tenants agree to lease this dwelling for a fixed term of one year, beginning July 1, 2012 and
ending June 30, 2013. Upon expiration, this Agreement shall become a month-to-month agreement
AUTOMATICALLY, UNLESS either Tenants or Owners notify the other party in writing at least 30 days
prior to expiration that they do not wish this Agreement to continue on any basis.
2. RENT:
Tenant agrees to pay Landlord as base rent the sum of $685 per month, due and payable monthly in
advance on the 1st day of each month during the term of this agreement. The first month's rent is required
to be submitted on or before move-in.
3. FORM OF PAYMENT:
Tenants agree to pay their rent in the form of a personal check, a cashier's check, or a money order made
out to the Landlord.
4. RENT PAYMENT PROCEDURE:
Tenants agree to pay their rent by mail addressed to the Landlord at 426 Main Street, Anycity, USA, or in
person at the same address, or in such other way as the Landlord will advise the Tenant in writing.
5. RENT DUE DATE:
Tenant hereby acknowledges that late payment will cause Landlord to incur costs not contemplated by this
Rental Agreement. We allow for a 3 day grace period. In the event rent is not received prior to the 4th of
the month, Tenant agrees to pay a $25 late fee, plus an additional $5 per day for every day thereafter until
the rent is paid. Neither ill health, loss of job, financial emergency, or other excuses will be accepted for
late payment`;

    try {
      setVoiceAssistantActive(true);
      setIsPlaying(true);
      console.log("Processing text:", testText);
      
      // Show processing state
      setSelectedText(testText + "\n\nProcessing...");
      setShowTooltip(true);
      
      //const explanation = await voiceAssistant.generateResponse(testText);
      const explanation = "This is a fixed term lease and you will be paying $685 per month which begins on July 1st 2012 and ends on June 30th 2013. You can cancel the lease by giving 30 days notice to the landlord. If you have a late payment, you will be charged a $25 late fee and an additional $5 per day for every day thereafter until the rent is paid, however a 3 day  grace period is prrovided "
      console.log("Generated explanation:", explanation);
      
      // Update the selection tooltip with the explanation
      setSelectedText(testText + "\n\nExplanation:\n" + explanation);
      
      // Speak the explanation
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

  const handleGenerateTemplate = async (formData) => {
    try {
      setIsGenerating(true);
      
      const response = await templateService.generateFromTemplate({
        sourceDocumentId: id,
        customization: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          rentAmount: formData.rentAmount,
          lateFee: formData.lateFee,
          gracePeriod: formData.gracePeroid
        }
      });

      // Navigate to the new document
      navigate(`/document/${response.id}`);
    } catch (error) {
      setPdfError('Failed to generate template: ' + error.message);
    } finally {
      setIsGenerating(false);
      setShowTemplateForm(false);
    }
  };

  const handleSaveEdit = async (newContent) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }
      const updatedDoc = await response.json();
      setDocument(updatedDoc);
      setShowEditor(false);
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
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
        <MenuButton onClick={() => setMenuOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </MenuButton>
        <NavButton onClick={() => navigate('/timeline')}>×</NavButton>
      </Navigation>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        onVoiceExplain={() => {
          setMenuOpen(false);
          handleVoiceAssistant();
        }}
        onGenerateTemplate={() => {
          setMenuOpen(false);
          setShowTemplateForm(true);
        }}
        onEditDocument={() => {
          setMenuOpen(false);
          setShowEditor(true);
        }}
        onReturnHome={() => navigate('/timeline')}
      />

      {showTemplateForm && (
        <TemplateForm
          onClose={() => setShowTemplateForm(false)}
          onSubmit={handleGenerateTemplate}
          isLoading={isGenerating}
        />
      )}

      {showEditor && document && (
        <DocumentEditor
          content={document.content}
          onSave={handleSaveEdit}
          onClose={() => setShowEditor(false)}
        />
      )}

      <PDFContainer>
        {pdfError ? (
          <ErrorMessage>{pdfError}</ErrorMessage>
        ) : (
          <>
            <PDFViewer
              ref={iframeRef}
              src={`${process.env.REACT_APP_API_BASE_URL}/documents/${id}/pdf#toolbar=0`}
              title="PDF Viewer"
              onError={() => setPdfError('Failed to load PDF')}
            />
            <SelectionOverlay />
          </>
        )}
      </PDFContainer>

      {showTooltip && selectedText && (
        <SelectionTooltip 
          className="selection-tooltip"
          visible={true}
          x={selectionCoords.x}
          y={selectionCoords.y}
        >
          <div style={{ marginBottom: '10px' }}>
            <strong>Selected Text:</strong>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '8px', 
              borderRadius: '4px',
              marginTop: '5px',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {selectedText}
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '10px',
            marginTop: '10px'
          }}>
            <ControlButton 
              onClick={handleVoiceAssistant}
              disabled={isVoiceAssistantActive}
              style={{ 
                width: '40px', 
                height: '40px', 
                fontSize: '18px',
                background: '#4CAF50'
              }}
            >
              {isVoiceAssistantActive ? '🔊' : '🎤'}
            </ControlButton>
          </div>
        </SelectionTooltip>
      )}
    </ViewerContainer>
  );
};

export default DocumentViewer; 