import React, { useState } from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-300px'};
  width: 300px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  transition: left 0.3s ease;
  z-index: 1000;
  padding: 20px;
  color: white;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  margin-bottom: 20px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FilterSection = styled.div`
  margin-bottom: 20px;
`;

const FilterTitle = styled.h3`
  color: white;
  margin-bottom: 10px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  margin-bottom: 10px;
  
  option {
    background: black;
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
`;

const Sidebar = ({ isOpen, onClose, onSearch, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={onClose}>×</CloseButton>
      
      <SearchBar
        type="text"
        placeholder="Search documents..."
        value={searchTerm}
        onChange={handleSearch}
      />

      <FilterSection>
        <FilterTitle>Filter by Year</FilterTitle>
        <Select onChange={(e) => onFilterChange('year', e.target.value)}>
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </Select>

        <FilterTitle>Filter by Month</FilterTitle>
        <Select onChange={(e) => onFilterChange('month', e.target.value)}>
          <option value="">All Months</option>
          {months.map((month, index) => (
            <option key={month} value={index + 1}>{month}</option>
          ))}
        </Select>
      </FilterSection>
    </SidebarContainer>
  );
};

export default Sidebar; 