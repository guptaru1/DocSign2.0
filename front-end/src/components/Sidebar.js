import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-300px'};
  width: 300px;
  height: 100vh;
  background-color: #1a1a1a;
  transition: left 0.3s ease-in-out;
  z-index: 99;
  padding: 20px;
  color: white;
`;

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <SidebarContainer isOpen={isOpen}>
      {/* Add your sidebar content here */}
      <h2>Menu</h2>
      <ul>
        <li>Home</li>
        <li>Documents</li>
        <li>Settings</li>
      </ul>
    </SidebarContainer>
  );
};

export default Sidebar; 