import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import DocumentBall from './DocumentBall';
import Sidebar from './Sidebar';
import documentService from '../services/documentService';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import EmailAttachments from './EmailAttachments';

const TimelineContainer = styled.div`
  background-color: black;
  min-height: 100vh;
  padding: 20px;
  position: relative;
`;

const CurvedLine = styled.div`
  position: fixed;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  transform-origin: 50% 0;
  
  &::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 0;
    bottom: 0;
    width: 4px;
    height: 200%;
    background: linear-gradient(45deg, #333, #444);
    animation: snakeAnimation 20s linear infinite;
  }

  @keyframes snakeAnimation {
    0% {
      clip-path: path('M2 0 C 2 100, 50 200, 2 300, -50 400, 2 500, 50 600, 2 700, -50 800, 2 900, 50 1000');
    }
    50% {
      clip-path: path('M2 0 C 2 100, -50 200, 2 300, 50 400, 2 500, -50 600, 2 700, 50 800, 2 900, -50 1000');
    }
    100% {
      clip-path: path('M2 0 C 2 100, 50 200, 2 300, -50 400, 2 500, 50 600, 2 700, -50 800, 2 900, 50 1000');
    }
  }
`;

const BallsContainer = styled.div`
  position: relative;
  z-index: 2;
  padding: 40px 0;
  max-width: 1200px;
  margin: 0 auto;
`;

const MenuButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 100;
  padding: 10px;
  
  span {
    display: block;
    width: 25px;
    height: 3px;
    background-color: white;
    margin: 5px 0;
    border-radius: 3px;
  }
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

const ErrorContainer = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
`;

const BallWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${props => props.isLeft ? '0 50% 0 0' : '0 0 0 50%'};
  margin: 150px 0;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: translateX(${props => props.isVisible ? 0 : (props.isLeft ? '-50px' : '50px')});
  transition: all 0.5s ease-out;
`;

const UploadButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 24px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  
  &:hover {
    background: #45a049;
  }
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
  margin: 100px 0;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: translateX(${props => props.isVisible ? 0 : (props.isLeft ? '-50px' : '50px')});
  transition: all 0.5s ease-out;
  padding: ${props => props.isLeft ? '0 50% 0 0' : '0 0 0 50%'};

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = styled.div`
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  white-space: pre-wrap;
  max-width: 300px;
  transition: all 0.2s;
  z-index: 1000;
  margin-bottom: 8px;

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const Circle = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(145deg, #1a1a1a, #333);
  border-radius: 50%;
  box-shadow: 8px 8px 16px #0d0d0d,
              -8px -8px 16px #333333;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    background: linear-gradient(145deg, #333, #1a1a1a);
  }

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 20%;
    height: 20%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
`;

const TimelineDate = styled.div`
  color: #888;
  font-size: 14px;
  margin-top: 10px;
`;

const TimelineTitle = styled.div`
  color: white;
  font-size: 16px;
  margin-top: 5px;
  text-align: center;
  max-width: 200px;
`;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Timeline = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [visibleDocs, setVisibleDocs] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ year: '', month: '' });
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [showEmailAttachments, setShowEmailAttachments] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleDocs(prev => new Set([...prev, entry.target.dataset.docId]));
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.document-ball').forEach(ball => {
      observer.observe(ball);
    });

    return () => observer.disconnect();
  }, [documents]);

  useEffect(() => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply year filter
    if (filters.year) {
      filtered = filtered.filter(doc => {
        const docYear = new Date(doc.date).getFullYear().toString();
        return docYear === filters.year;
      });
    }

    // Apply month filter
    if (filters.month) {
      filtered = filtered.filter(doc => {
        const docMonth = (new Date(doc.date).getMonth() + 1).toString();
        return docMonth === filters.month;
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, filters]);

  const onDrop = async (acceptedFiles) => {
    try {
      setUploading(true);
      setError(null); // Clear any previous errors
      
      const file = acceptedFiles[0];
      if (!file) {
        throw new Error('No file selected');
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Only PDF files are allowed');
      }

      console.log('Selected file name:', file.name);
      console.log('File type:', file.type);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name);

      const response = await fetch(`http://localhost:3001/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const newDoc = await response.json();
      console.log('Upload successful:', newDoc);
      setDocuments(prev => [...prev, newDoc]);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleDocumentClick = (docId) => {
    navigate(`/document/${docId}`);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleAttachmentSaved = (newDoc) => {
    setDocuments(prev => [...prev, newDoc]);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadDocuments}>Retry</button>
      </ErrorContainer>
    );
  }

  return (
    <TimelineContainer>
      <MenuButton onClick={() => setSidebarOpen(!isSidebarOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </MenuButton>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onImportEmail={() => setShowEmailAttachments(true)}
      />
      
      <CurvedLine />
      
      <BallsContainer>
        {filteredDocuments.map((doc, index) => (
          <TimelineItem 
            key={doc.id} 
            onClick={() => handleDocumentClick(doc.id)}
            isLeft={index % 2 === 0}
            isVisible={visibleDocs.has(doc.id.toString())}
            className="document-ball"
            data-doc-id={doc.id}
          >
            <Circle>
              <Tooltip className="tooltip">
                {doc.content ? (
                  doc.content.match(/<p>(.*?)<\/p>/g)?.map((p, i) => (
                    <div key={i}>
                      {p.replace(/<\/?p>/g, '')}
                      {i < doc.content.match(/<p>(.*?)<\/p>/g).length - 1 && <br />}
                    </div>
                  )) || doc.content
                ) : (
                  'No content available'
                )}
              </Tooltip>
            </Circle>
            <TimelineDate>{formatDate(doc.date)}</TimelineDate>
            <TimelineTitle>{doc.title}</TimelineTitle>
          </TimelineItem>
        ))}
      </BallsContainer>
      
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadButton disabled={uploading}>
          {uploading ? '...' : '+'}
        </UploadButton>
      </div>

      {showEmailAttachments && (
        <EmailAttachments
          onClose={() => setShowEmailAttachments(false)}
          onAttachmentSaved={handleAttachmentSaved}
        />
      )}
    </TimelineContainer>
  );
};

export default Timeline; 