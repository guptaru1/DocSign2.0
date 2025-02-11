import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-300px'};
  width: 300px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  transition: left 0.3s ease;
  z-index: 1000;
  padding: 20px;
  padding-top: 60px;
  box-shadow: ${props => props.isOpen ? '2px 0 5px rgba(0,0,0,0.3)' : 'none'};
`;

const MenuItem = styled.div`
  color: white;
  padding: 15px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;

  &:hover {
    background: rgba(255,255,255,0.1);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #ccc;
  }
`;

const SideMenu = ({ isOpen, onClose, onVoiceExplain, onGenerateTemplate, onReturnHome, onEditDocument }) => {
  return (
    <MenuContainer isOpen={isOpen}>
      <CloseButton onClick={onClose}>×</CloseButton>
      <MenuItem onClick={onVoiceExplain}>
        🎤 Verbally explain this text
      </MenuItem>
      <MenuItem onClick={onGenerateTemplate}>
        📄 Generate new template
      </MenuItem>
      <MenuItem onClick={onEditDocument}>
        ✏️ Edit Document
      </MenuItem>
      <MenuItem onClick={onReturnHome}>
        🏠 Return to home
      </MenuItem>
    </MenuContainer>
  );
};

export default SideMenu; 